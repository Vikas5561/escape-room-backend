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

    /* ✅ SAVE ROOM TO DATABASE (SAFE) */
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

    /* ✅ SAVE QUESTION TO DATABASE */
    try {
      await QuizRoom.updateOne(
        { roomId },
        { $push: { problems: problem } }
      );

      console.log("Problem saved in MongoDB");
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

    /* ✅ SAVE PLAYER TO DATABASE */
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

      console.log("Player saved in MongoDB:", name);
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

  // 🔥🔥🔥 HARD DELETE ROOM (WORKING FLOW NOT TOUCHED)
  async deleteRoom(roomId: string) {
    console.log("Deleting room completely:", roomId);

    this.quizes = this.quizes.filter((q) => q.roomId !== roomId);

    globalProblemId = 0;

    /* ✅ ALSO DELETE FROM DATABASE */
    try {
      await QuizRoom.deleteOne({ roomId });
      console.log("Room deleted from MongoDB:", roomId);
    } catch (err) {
      console.log("MongoDB delete failed:", err);
    }
  }
}
