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

        console.log("Quiz created:", roomId);
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

        return quiz.addUser(name);
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
        return this.quizes.find(q => q.roomId === roomId) ?? null;
    }

    // ================= CURRENT STATE =================
    getCurrentState(roomId: string) {
        const quiz = this.getQuiz(roomId);
        if (!quiz) return null;
        return quiz.getCurrentState();
    }

    // 🔥🔥🔥 HARD DELETE ROOM (THIS IS THE KEY)
    deleteRoom(roomId: string) {
        console.log("Deleting room completely:", roomId);

        this.quizes = this.quizes.filter(q => q.roomId !== roomId);

        // reset problem ids for next quiz
        globalProblemId = 0;
    }
}
