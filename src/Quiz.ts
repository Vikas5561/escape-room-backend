import { IoManager } from "./managers/IoManager";
import { AllowedSubmissions, Problem, User } from "./types/types";

const PROBLEM_TIME_S = 15;
const WINNING_POINTS = 80;

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
    this.setActiveProblem(this.problems[0]);
  }

  // ================= SEND QUESTION =================
  private setActiveProblem(problem: Problem) {
    if (this.winner) return;

    this.currentState = "question";

    // Reset question timer
    problem.startTime = Date.now();
    problem.submissions = [];

    // Reset submission state for all users
    this.users.forEach((u) => {
      u.hasSubmitted = false;
    });

    IoManager.getIo().to(this.roomId).emit("problem", { problem });

    console.log("Question started:", problem.title);

    // ✅ After 15s leaderboard will be shown
    setTimeout(() => {
      if (!this.winner) {
        this.sendLeaderboard();
      }
    }, PROBLEM_TIME_S * 1000);
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

    // Prevent double submit
    if (user.hasSubmitted) return;

    // ✅ FIX: Reject submissions after time is over
    const now = Date.now();
    const timePassed = (now - problem.startTime) / 1000;

    if (timePassed > PROBLEM_TIME_S) {
      console.log("❌ Submission ignored (time over):", user.name);
      return;
    }

    user.hasSubmitted = true;

    const isCorrect = problem.answer === submission;

    if (isCorrect) {
      user.points += 10;
    }

    console.log(user.name, "answered", submission, "Correct:", isCorrect);

    // Winner check
    if (user.points >= WINNING_POINTS) {
      this.winner = user;
      this.declareWinner();
    }
  }

  // ================= SEND LEADERBOARD =================
  private sendLeaderboard() {
    if (this.winner) return;

    this.currentState = "leaderboard";

    // Update movement stages
    this.users.forEach((u) => {
      u.stage = Math.min(Math.floor(u.points / 10) + 1, 9);
      u.hasSubmitted = false;
    });

    IoManager.getIo().to(this.roomId).emit("leaderboard", {
      leaderboard: this.getLeaderboard(),
      winner: this.winner,
    });

    console.log("Leaderboard sent properly");
  }

  // ================= NEXT QUESTION =================
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

  // ================= DECLARE WINNER =================
  private declareWinner() {
    this.currentState = "ended";

    IoManager.getIo().to(this.roomId).emit("winner", {
      winner: this.winner,
      leaderboard: this.getLeaderboard(),
    });
  }

  // ================= END QUIZ =================
  private endQuiz() {
    this.currentState = "ended";

    IoManager.getIo().to(this.roomId).emit("ended", {
      leaderboard: this.getLeaderboard(),
      winner: this.winner,
    });
  }

  // ================= LEADERBOARD SORT =================
  private getLeaderboard() {
    return this.users.sort((a, b) => b.points - a.points);
  }

  // ================= CURRENT STATE =================
  getCurrentState() {
    if (this.currentState === "not_started") return { type: "not_started" };

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
