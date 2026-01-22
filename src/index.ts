import { IoManager } from './managers/IoManager';
import { UserManager } from './managers/UserManager';

const io = IoManager.getIo();

// ✅ Correct way for Socket.IO
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
io.listen(PORT);

console.log(`Socket server running on port ${PORT}`);

const userManager = new UserManager();

io.on('connection', (socket) => {
    userManager.addUser(socket);
});
