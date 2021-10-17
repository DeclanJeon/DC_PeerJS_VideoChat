const express = require("express");
const app = express();
const httpServer = require("http");
//const { v4: uuidv4 } = require("uuid");
const shortId = require("shortid");
const cors = require("cors");
const server = httpServer.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "/",
        methods: ["GET", "POST"],
    },
});
const port = process.env.PORT || 1337;
const hostname = "127.0.0.1";

const users = {};

app.set("view engine", "ejs");

app.use(cors());
app.use(express.static("public"));
app.use(express.static("public/assets/css"));
app.use(express.static("public/assets/lib"));
app.use(express.static("public/assets/img"));

app.get("/", (req, res) => {
    res.redirect(`${shortId.generate()}`);
});

app.get("/:room", (req, res) => {
    res.render("index", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit("welcome");
        socket.broadcast.to(roomId).emit("user-connected", userId);
        console.log("BoardCast User Connected : ", userId);

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
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

server.listen(port, hostname, () => {
    console.log(`Server Listening... http://${hostname}:${port}`);
});
