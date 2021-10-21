const express = require("express");
const app = express();
const httpServer = require("http");
const { nanoid } = require("nanoid");
const cors = require("cors");
const server = httpServer.createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "/",
        methods: ["GET", "POST"],
    },
});
const port = process.env.PORT || 1337;
const host = "127.0.0.1";
const roomID = nanoid();

const users = {};

app.set("view engine", "ejs");

app.use(cors());
//app.use("/peerjs", ExpressPeerServer(server, options));

app.use(express.static("public"));
app.use(express.static("public/assets/css"));
app.use(express.static("public/assets/lib"));
app.use(express.static("public/assets/img"));

app.get("/", (req, res) => {
    res.redirect(`${roomID}`);
});

app.get("/:room", (req, res) => {
    res.render("index", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("welcome");
        socket.broadcast.emit("user-connected", userId);
        console.log("BoardCast User Connected : ", userId);

        socket.on("screen-share", (stream) => {
            io.to(roomId).emit("screenShare", stream, userId);
        });

        socket.on("disconnect", () => {
            socket.broadcast.emit("user-disconnected", userId);
        });

        socket.on("new message", (msg) => {
            io.to(roomId).emit("send message", {
                message: msg,
                user: socket.username,
            });
        });
    });
    socket.on("new user", (usr) => {
        socket.username = usr;
        console.log("User connected - User name: " + socket.username);
    });
});

server.listen(port, host, () => {
    console.log(`Server Listening... http://${host}:${port}`);
});
