const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

backBtn.addEventListener("click", () => {
    document.querySelector(".main__left").style.display = "flex";
    document.querySelector(".main__left").style.flex = "1";
    document.querySelector(".main__right").style.display = "none";
    document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
    document.querySelector(".main__right").style.display = "flex";
    document.querySelector(".main__right").style.flex = "1";
    document.querySelector(".main__left").style.display = "none";
    document.querySelector(".header__back").style.display = "block";
});

const chattingFunc = () => {
    let text = document.getElementById("chat_message");
    let send = document.getElementById("send");

    send.addEventListener("click", (e) => {
        if (text.value.length !== 0) {
            socket.emit("new message", text.value);
            text.value = "";
        }
    });

    text.addEventListener("keydown", (e) => {
        if (e.which === 13 && text.value.length !== 0) {
            socket.emit("new message", text.value);
            text.value = "";
        }
    });

    socket.on("send message", (data) => {
        const userName = data.user;
        const message = data.message;

        const messageList = document.getElementById("messages");
        const userNameArea = document.createElement("div");
        const messageArea = document.createElement("div");

        userNameArea.className = "userName";
        messageArea.className = "message";

        userNameArea.textContent = userName;
        messageArea.textContent = message;

        messageList.append(userNameArea, messageArea);

        scrollToBottom();
    });
};

const scrollToBottom = () => {
    let d = document.querySelector(".main__chat_window");
    d.scrollTop = d.scrollHeight;
};

function chatResult() {
    chattingFunc();
}

chatResult();
