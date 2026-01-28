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
    socket.on("join", async (data) => {
      const { roomId, name } = data;

      const quiz = this.quizManager.getQuiz(roomId);
      if (!quiz) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const userId = await this.quizManager.addUser(roomId, name);

      socket.join(roomId);

      socket.emit("init", {
        userId,
        state: this.quizManager.getCurrentState(roomId),
      });

      console.log(`User ${name} joined room ${roomId}`);
    });

    // ================= ADMIN LOGIN =================
    socket.on("joinAdmin", async (data) => {
      if (data.password !== ADMIN_PASSWORD) {
        socket.emit("adminAuth", { success: false });
        return;
      }

      socket.emit("adminAuth", { success: true });
      console.log("✅ Admin logged in!");

      // =====================================================
      // ✅ ADMIN: GET ALL ROOMS
      // =====================================================
      socket.on("getRooms", async () => {
        const rooms = await this.quizManager.getAllRooms();
        socket.emit("roomsList", rooms);
      });

      // =====================================================
      // ✅ ADMIN: RESTART ROOM (FORCE USERS TO REJOIN)
      // =====================================================
      socket.on("restartRoom", async (data) => {
        const roomId = data.roomId;

        try {
          await this.quizManager.restartRoom(roomId);

          socket.emit("roomRestarted", { roomId });

          // ✅ Notify all players: Reset quiz state
          socket.to(roomId).emit("reset");

          // ✅ Kick all players back to Join Screen
          socket.to(roomId).emit("forceRejoin");

          console.log("🔄 Room restarted + Users forced to rejoin:", roomId);
        } catch (err) {
          socket.emit("error", {
            message: "Failed to restart room",
          });
        }
      });

      // =====================================================
      // ✅ ADMIN: CREATE QUIZ
      // =====================================================
      socket.on("createQuiz", async (data) => {
        await this.quizManager.addQuiz(data.roomId);
        socket.emit("quizCreated", { roomId: data.roomId });
      });

      // =====================================================
      // ✅ ADMIN: ADD QUESTION
      // =====================================================
      socket.on("createProblem", async (data) => {
        await this.quizManager.addProblem(data.roomId, data.problem);
        socket.emit("problemAdded", { roomId: data.roomId });
      });

      // =====================================================
      // ✅ ADMIN: START QUIZ
      // =====================================================
      socket.on("start", (data) => {
        this.quizManager.start(data.roomId);
      });

      // =====================================================
      // ✅ ADMIN: NEXT QUESTION
      // =====================================================
      socket.on("next", (data) => {
        this.quizManager.next(data.roomId);
      });

      // =====================================================
      // ✅ ADMIN: END QUIZ (DELETE ROOM)
      // =====================================================
      socket.on("endQuiz", async (data) => {
        const { roomId } = data;

        await this.quizManager.deleteRoom(roomId);

        socket.to(roomId).emit("reset");
        socket.to(roomId).emit("forceRejoin");

        socket.emit("reset");

        console.log(`❌ Room ${roomId} deleted by admin`);
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
