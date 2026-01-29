import { IoManager } from "./managers/IoManager";
import { UserManager } from "./managers/UserManager";

/* ✅ MongoDB Connection Import */
import { connectDB } from "./config/db";

import dotenv from "dotenv";

/* ✅ Load .env */
dotenv.config();

/* ✅ Connect MongoDB (Safe Addition) */
connectDB();

const io = IoManager.getIo();

// ✅ Correct way for Socket.IO
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
io.listen(PORT);

console.log(`Socket server running on port ${PORT}`);

const userManager = new UserManager();

io.on("connection", (socket) => {
  userManager.addUser(socket);
});