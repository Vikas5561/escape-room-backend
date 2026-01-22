import { Quiz } from "../Quiz";
import { AllowedSubmissions } from "../types/types";

let globalProblemId = 0;

export class QuizManager {
    private quizes: Quiz[];

    constructor() {
        this.quizes = [];
    }

    // ================= START QUIZ =================
    public start(roomId: string) {
        const quiz = this.getQuiz(roomId);
        if (!quiz) return;
        quiz.start();
    }

    // ================= ADD QUESTION =================
    public addProblem(
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
            startTime: new Date().getTime(),
            submissions: [],
        });
    }

    // ================= NEXT QUESTION =================
    public next(roomId: string) {
        const quiz = this.getQuiz(roomId);
        if (!quiz) return;
        quiz.next();
    }

    // ================= ADD USER =================
    addUser(roomId: string, name: string) {
        return this.getQuiz(roomId)?.addUser(name);
    }

    // ================= SUBMIT ANSWER =================
    submit(
        userId: string,
        roomId: string,
        problemId: string,
        submission: 0 | 1 | 2 | 3
    ) {
        this.getQuiz(roomId)?.submit(userId, roomId, problemId, submission);
    }

    // ================= GET QUIZ =================
    getQuiz(roomId: string) {
        return this.quizes.find(q => q.roomId === roomId) ?? null;
    }

    // ================= CURRENT STATE =================
    getCurrentState(roomId: string) {
        const quiz = this.getQuiz(roomId);
        if (!quiz) return null;
        return quiz.getCurrentState();
    }

    // ================= CREATE QUIZ =================
    addQuiz(roomId: string) {
        if (this.getQuiz(roomId)) return;

        const quiz = new Quiz(roomId);
        this.quizes.push(quiz);
    }

    // 🔥🔥🔥 RESET QUIZ (NEW — IMPORTANT)
    resetRoom(roomId: string) {
        // Remove quiz completely
        this.quizes = this.quizes.filter(q => q.roomId !== roomId);

        // Optional: reset problem counter for clean IDs
        globalProblemId = 0;
    }
}
