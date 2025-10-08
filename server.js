const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Room data
const rooms = {};

function checkWinner(board) {
    const lines = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (const [a,b,c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return null;
}

io.on("connection", socket => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ roomCode, playerName }) => {
        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], board: Array(9).fill(null), turn: "X" };
        }
        const room = rooms[roomCode];

        if (room.players.length >= 2) {
            socket.emit("full", "Room is full!");
            return;
        }

        const symbol = room.players.length === 0 ? "X" : "O";
        room.players.push({ id: socket.id, name: playerName, symbol });
        socket.join(roomCode);
        socket.emit("playerData", { symbol, roomCode });
        io.to(roomCode).emit("updatePlayers", room.players);

        if (room.players.length === 2) {
            io.to(roomCode).emit("startGame", room.turn);
        }
    });

    socket.on("move", ({ roomCode, index }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.symbol !== room.turn || room.board[index]) return;

        room.board[index] = player.symbol;
        const winner = checkWinner(room.board);
        io.to(roomCode).emit("boardUpdate", { board: room.board, turn: room.turn, winner });

        if (!winner) {
            room.turn = room.turn === "X" ? "O" : "X";
        } else {
            room.board = Array(9).fill(null); // reset board after win
        }
    });

    socket.on("disconnecting", () => {
        const roomCodes = Array.from(socket.rooms).filter(r => r !== socket.id);
        roomCodes.forEach(roomCode => {
            const room = rooms[roomCode];
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);
                io.to(roomCode).emit("updatePlayers", room.players);
                if (room.players.length === 0) delete rooms[roomCode];
            }
        });
    });
});

// Use dynamic port for Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(Server running on port ${PORT});
});
