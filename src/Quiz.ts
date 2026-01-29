import { IoManager } from "./managers/IoManager";
import { AllowedSubmissions, Problem, User } from "./types/types";

const PROBLEM_TIME_S = 15; // ✅ Question stays 15 seconds
const WINNING_POINTS = 80; // ✅ Winner at 80 points

export class Quiz {
  public roomId: string;

  private problems: Problem[];
  private activeProblem: number;
  private users: User[];

  private currentState: "leaderboard" | "question" | "not_started" | "ended";
  private winner: User | null = null;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.problems = [];
    this.activeProblem = 0;
    this.users = [];
    this.currentState = "not_started";

    console.log("Room created:", roomId);
  }

  // ================= ADD QUESTION =================
  addProblem(problem: Problem) {
    this.problems.push(problem);
  }

  // ================= ADD USER =================
  addUser(name: string) {
    const id = Math.random().toString(36).substring(2, 9);

    this.users.push({
      id,
      name,
      points: 0,
      stage: 1,
      hasSubmitted: false,
    });

    return id;
  }

  // ================= START QUIZ =================
  start() {
    if (this.problems.length === 0) return;

    console.log("Quiz started");
    this.setActiveProblem(this.problems[0]);
  }

  // ================= SEND QUESTION =================
  private setActiveProblem(problem: Problem) {
    if (this.winner) return;

    this.currentState = "question";

    problem.startTime = Date.now();
    problem.submissions = [];

    IoManager.getIo().to(this.roomId).emit("problem", { problem });

    console.log("Question sent:", problem.title);

    // ✅ After 15 seconds automatically show leaderboard
    setTimeout(() => {
      if (!this.winner) {
        this.sendLeaderboard();
      }
    }, PROBLEM_TIME_S * 1000);
  }

  // ================= SEND LEADERBOARD =================
  private sendLeaderboard() {
    if (this.winner) return;

    this.currentState = "leaderboard";

    // Update player stages based on points
    this.users.forEach((u) => {
      u.stage = Math.min(Math.floor(u.points / 10) + 1, 9);
      u.hasSubmitted = false;
    });

    const leaderboard = this.getLeaderboard();

    IoManager.getIo().to(this.roomId).emit("leaderboard", {
      leaderboard,
      winner: this.winner,
    });

    console.log("Leaderboard sent");
  }

  // ================= NEXT QUESTION (ADMIN ONLY) =================
  next() {
    if (this.winner) return;

    this.activeProblem++;

    const nextProblem = this.problems[this.activeProblem];

    if (nextProblem) {
      this.setActiveProblem(nextProblem);
    } else {
      this.endQuiz();
    }
  }

  // ================= SUBMIT ANSWER =================
  submit(
    userId: string,
    roomId: string,
    problemId: string,
    submission: AllowedSubmissions
  ) {
    if (this.winner) return;

    const problem = this.problems.find((p) => p.id === problemId);
    const user = this.users.find((u) => u.id === userId);

    if (!problem || !user) return;
    if (user.hasSubmitted) return;

    user.hasSubmitted = true;

    const isCorrect = problem.answer === submission;

    if (isCorrect) {
      user.points += 10;
    }

    console.log(user.name, "submitted", submission, "Correct:", isCorrect);

    // ✅ Winner check at 80 points
    if (user.points >= WINNING_POINTS) {
      this.winner = user;
      this.declareWinner();
    }
  }

  // ================= DECLARE WINNER =================
  private declareWinner() {
    this.currentState = "ended";

    IoManager.getIo().to(this.roomId).emit("winner", {
      winner: this.winner,
      leaderboard: this.getLeaderboard(),
    });

    console.log("🏆 WINNER:", this.winner?.name);
  }

  // ================= END QUIZ =================
  private endQuiz() {
    this.currentState = "ended";

    IoManager.getIo().to(this.roomId).emit("ended", {
      leaderboard: this.getLeaderboard(),
      winner: this.winner,
    });

    console.log("Quiz finished");
  }

  // ================= LEADERBOARD =================
  private getLeaderboard() {
    return this.users.sort((a, b) => b.points - a.points);
  }

  // ================= CURRENT STATE =================
  getCurrentState() {
    if (this.currentState === "not_started") {
      return { type: "not_started" };
    }

    if (this.currentState === "question") {
      return {
        type: "question",
        problem: this.problems[this.activeProblem],
      };
    }

    if (this.currentState === "leaderboard") {
      return {
        type: "leaderboard",
        leaderboard: this.getLeaderboard(),
      };
    }

    return {
      type: "ended",
      leaderboard: this.getLeaderboard(),
      winner: this.winner,
    };
  }
}