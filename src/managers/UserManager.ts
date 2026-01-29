import { Socket } from "socket.io";
import { QuizManager } from "./QuizManager";

const ADMIN_PASSWORD = "ADMIN_PASSWORD";

export class UserManager {
    private quizManager: QuizManager;

    constructor() {
        this.quizManager = new QuizManager();
    }

    addUser(socket: Socket) {
        this.createHandlers(socket);
    }

    private createHandlers(socket: Socket) {

        // ================= USER JOIN =================
        socket.on("join", (data) => {
            const { roomId, name } = data;

            const quiz = this.quizManager.getQuiz(roomId);
            if (!quiz) {
                socket.emit("error", { message: "Room not found" });
                return;
            }

            const userId = this.quizManager.addUser(roomId, name);

            socket.join(roomId);

            socket.emit("init", {
                userId,
                state: this.quizManager.getCurrentState(roomId),
            });

            console.log(`User ${name} joined room ${roomId}`);
        });

        // ================= ADMIN LOGIN =================
        socket.on("joinAdmin", (data) => {
            if (data.password !== ADMIN_PASSWORD) {
                socket.emit("adminAuth", { success: false });
                return;
            }

            socket.emit("adminAuth", { success: true });

            // CREATE QUIZ
            socket.on("createQuiz", (data) => {
                this.quizManager.addQuiz(data.roomId);
                socket.emit("quizCreated", { roomId: data.roomId });
            });

            // ADD QUESTION
            socket.on("createProblem", (data) => {
                this.quizManager.addProblem(data.roomId, data.problem);
                socket.emit("problemAdded", { roomId: data.roomId });
            });

            // START QUIZ
            socket.on("start", (data) => {
                this.quizManager.start(data.roomId);
            });

            // NEXT QUESTION
            socket.on("next", (data) => {
                this.quizManager.next(data.roomId);
            });

            // GET STATE
            socket.on("getQuizState", (data) => {
                const state = this.quizManager.getCurrentState(data.roomId);
                socket.emit("quizStateUpdate", state);
            });

            // 🔥🔥🔥 END QUIZ (HARD DELETE)
            socket.on("endQuiz", (data) => {
                const { roomId } = data;

                this.quizManager.deleteRoom(roomId);

                // notify ALL clients
                socket.to(roomId).emit("reset");
                socket.emit("reset");

                console.log(`Room ${roomId} deleted by admin`);
            });
        });

        // ================= SUBMIT ANSWER =================
        socket.on("submit", (data) => {
            const { userId, roomId, problemId, submission } = data;

            if (![0, 1, 2, 3].includes(submission)) return;

            this.quizManager.submit(userId, roomId, problemId, submission);
        });
    }
}