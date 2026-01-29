import { Quiz } from "../Quiz";
import { AllowedSubmissions } from "../types/types";

let globalProblemId = 0;

export class QuizManager {
  private quizes: Quiz[];

  constructor() {
    this.quizes = [];
  }

  // ================= CREATE QUIZ =================
  addQuiz(roomId: string) {
    if (this.getQuiz(roomId)) return;

    const quiz = new Quiz(roomId);
    this.quizes.push(quiz);

    console.log("✅ Quiz Room Created:", roomId);
  }

  // ================= START QUIZ =================
  start(roomId: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;

    quiz.start();
  }

  // ================= ADD QUESTION =================
  addProblem(
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

    console.log("✅ Problem Added:", problem.title);
  }

  // ================= NEXT QUESTION =================
  next(roomId: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return;

    quiz.next();
  }

  // ================= ADD USER =================
  addUser(roomId: string, name: string) {
    const quiz = this.getQuiz(roomId);
    if (!quiz) return null;

    const userId = quiz.addUser(name);

    console.log("✅ Player Joined:", name);

    return userId;
  }

  // ================= SUBMIT ANSWER =================
  submit(
    userId: string,
    roomId: string,
    problemId: string,
    submission: AllowedSubmissions
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
  deleteRoom(roomId: string) {
    this.quizes = this.quizes.filter((q) => q.roomId !== roomId);

    console.log("❌ Room Deleted:", roomId);
  }
}
