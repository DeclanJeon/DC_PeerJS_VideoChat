const express = require("express");
const app = express();
const httpServer = require("http");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const server = httpServer.createServer(app);

const io = require("socket.io")(server);

const port = process.env.PORT || 1337;
const hostname = "127.0.0.1";

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.static("public/assets/css"));
app.use(express.static("public/assets/lib"));

app.get("/", (req, res) => {
    res.redirect(`${uuidv4()}`);
});

app.get("/:room", (req, res) => {
    res.render("index", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            socket.broadcast.to(roomId).emit("user-disconnected", userId);
        });

        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message);
        });
    });
});

server.listen(port, hostname, () => {
    console.log(`Server Listening... http://${hostname}:${port}`);
});
