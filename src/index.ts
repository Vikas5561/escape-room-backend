import { IoManager } from "./managers/IoManager";
import { UserManager } from "./managers/UserManager";

const io = IoManager.getIo();

// ✅ Render gives dynamic PORT
const PORT = process.env.PORT || 3000;

io.listen(Number(PORT));

console.log("✅ Socket server running on port", PORT);

const userManager = new UserManager();

io.on("connection", (socket) => {
  userManager.addUser(socket);
});
