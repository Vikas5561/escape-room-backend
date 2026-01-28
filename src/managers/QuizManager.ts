import { Quiz } from "../Quiz";
import { AllowedSubmissions } from "../types/types";

/* ✅ MongoDB Model Import */
import { QuizRoom } from "../models/QuizRoom";

let globalProblemId = 0;

export class QuizManager {
  private quizes: Quiz[];

  constructor() {
    this.quizes = [];
  }

  // ================= CREATE QUIZ =================
  async addQuiz(roomId: string) {
    if (this.getQuiz(roomId)) return;

    const quiz = new Quiz(roomId);
    this.quizes.push(quiz);

    console.log("Quiz created:", roomId);

    /* ✅ SAVE ROOM TO DATABASE */
    try {
      await QuizRoom.create({
        roomId,
        problems: [],
        players: [],
      });

      console.log("Room saved in MongoDB:", roomId);
    } catch (err) {
      console.log("MongoDB room save failed:", err);
    }
  }

  // ================= GET ALL ROOMS =================
  async getAllRooms() {
    try {
      return await QuizRoom.find({}, { roomId: 1, _id: 0 });
    } catch (err) {
      console.log("MongoDB getAllRooms failed:", err);
      return [];
    }
  }

  // ================= RESTART ROOM =================
  async restartRoom(roomId: string) {
    console.log("Restarting room:", roomId);

    /* ✅ Get room from DB */
    const dbRoom = await QuizRoom.findOne({ roomId });

    if (!dbRoom) {
      console.log("Room not found in MongoDB");
      return;
    }

    /* ✅ Remove quiz from memory */
    this.quizes = this.quizes.filter((q) => q.roomId !== roomId);

    /* ✅ Create fresh Quiz instance */
    const newQuiz = new Quiz(roomId);

    /* ✅ Re-add old saved questions */
    dbRoom.problems.forEach((p: any) => {
      newQuiz.addProblem({
        ...p,
        id: (globalProblemId++).toString(),
        startTime: Date.now(),
        submissions: [],
      });
    });

    /* ✅ Add restarted quiz back */
    this.quizes.push(newQuiz);

    /* ✅ Reset DB players list only */
    await QuizRoom.updateOne(
      { roomId },
      { $set: { players: [] } }
    );

    console.log("Room restarted successfully:", roomId);
  }

  // ================= START QUIZ =================
  start(roomId: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;
    quiz.start();
  }

  // ================= ADD QUESTION =================
  async addProblem(
    roomId: string,
    problem: {
      title: string;
      description: string;
      image?: string;
      options: { id: number; title: string }[];
      answer: AllowedSubmissions;
    }
  ) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;

    quiz.addProblem({
      ...problem,
      id: (globalProblemId++).toString(),
      startTime: Date.now(),
      submissions: [],
    });

    /* ✅ Save question in MongoDB */
    try {
      await QuizRoom.updateOne(
        { roomId },
        { $push: { problems: problem } }
      );
    } catch (err) {
      console.log("MongoDB problem save failed:", err);
    }
  }

  // ================= NEXT QUESTION =================
  next(roomId: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;
    quiz.next();
  }

  // ================= ADD USER =================
  async addUser(roomId: string, name: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return null;

    const userId = quiz.addUser(name);

    /* ✅ Save player in DB */
    try {
      await QuizRoom.updateOne(
        { roomId },
        {
          $push: {
            players: {
              name,
              points: 0,
              stage: 1,
            },
          },
        }
      );
    } catch (err) {
      console.log("MongoDB player save failed:", err);
    }

    return userId;
  }

  // ================= SUBMIT ANSWER =================
  submit(
    userId: string,
    roomId: string,
    problemId: string,
    submission: 0 | 1 | 2 | 3
  ) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;

    quiz.submit(userId, roomId, problemId, submission);
  }

  // ================= GET QUIZ =================
  getQuiz(roomId: string) {
    return this.quizes.find((q) => q.roomId === roomId) ?? null;
  }

  // ================= CURRENT STATE =================
  getCurrentState(roomId: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return null;
    return quiz.getCurrentState();
  }

  // ================= DELETE ROOM =================
  async deleteRoom(roomId: string) {
    console.log("Deleting room completely:", roomId);

    this.quizes = this.quizes.filter((q) => q.roomId !== roomId);

    globalProblemId = 0;

    /* ✅ Delete from MongoDB */
    try {
      await QuizRoom.deleteOne({ roomId });
      console.log("Room deleted from MongoDB:", roomId);
    } catch (err) {
      console.log("MongoDB delete failed:", err);
    }
  }
}
