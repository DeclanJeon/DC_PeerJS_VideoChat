const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const localVideo = document.createElement("video");
localVideo.setAttribute("id", "local__video");
localVideo.volume = 0;

const remoteVideoContainer = document.getElementById(
    "remote__video__container"
);

const videoBtn = document.getElementById("muteVideo");
const audioBtn = document.getElementById("muteAudio");
const shareScreenBtn = document.getElementById("shareScreen");

localVideo.muted = true;

const peer = new Peer(undefined, {
    path: "/",
    host: "0.peerjs.com",
    port: "443",
    pingInterval: 5000,
    config: {
        iceServers: [
            {
                url: "stun:stun.l.google.com:19302",
                url: "turn:192.158.29.39:3478?transport=udp",
                credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                username: "28224511:1379330808",
            },
        ],
        sdpmantics: "unified-plan",
    },
});

const peers = {};

const constraints = {
    audio: {
        autoGainControl: false,
        channelCount: 2,
        echoCancellation: false,
        latency: 0,
        noiseSuppression: false,
        sampleRate: 48000,
        sampleSize: 16,
        volume: 1.0,
    },
    video: true,
};

let myVideoStream;
let myUserId;

function videoStreamFuncResult() {
    videoCall();
    shareFilesBtn();
    shareScreenBtnFunc();
    handlerMuteControler();
}

async function videoCall() {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    myVideoStream = stream;
    addVideoStream(localVideo, stream);

    peer.on("call", (call) => {
        call.answer(stream);
        const remoteVideo = document.createElement("video");
        remoteVideo.setAttribute("id", "remote__video");
        call.on("stream", (userVideoStream) => {
            addVideoStream(remoteVideo, userVideoStream);
        });
    });

    socket.on("user-connected", (userId) => {
        myUserId = userId
        console.log(myUserId);
        connectToNewUser(myUserId, stream);
    });

    let text = $("#chat_message");

    $("html").keydown((e) => {
        if (e.which == 13 && text.val().length !== 0) {
            console.log(text.val());
            socket.emit("message", text.val());
            text.val("");
        }
    });

    socket.on("createMessage", (message) => {
        $("div.messages").append(
            `<div class="message"><b>user</b><br/>${message}</div>`
        );
        scrollToBottom();
    });
}

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) {
        peers[userId].close();
    }
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
    console.log(id);
});

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const remoteVideo = document.createElement("video");
    remoteVideo.setAttribute("id", "remote__video");

    call.on("stream", (userVideoStream) => {
        addVideoStream(remoteVideo, userVideoStream);
    });
    call.on("close", () => {
        remoteVideo.remove();
    });

    peers[userId] = call;
};

function shareScreenBtnFunc() {
    shareScreenBtn.addEventListener("click", (e) => {
        if (e.target) {
            shareScreen();
        }
    });
}

const shareScreen = async () => {
    let captureStream = null;

    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(
            constraints
        );
    } catch (err) {
        console.error("Error: " + err);
    }
    peer.call(myUserId, captureStream);
};

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });

    videoGrid.appendChild(video);
};

const scrollToBottom = () => {
    let d = $(".main__chat_window");
    d.scrollTop(d.prop("scrollHeight"));
};

const handlerAudioMute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        audioBtn.style.color = "red";
        console.log("AudioTracks : " + enabled);
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        audioBtn.style.color = "";
        console.log("AudioTracks : " + enabled);
    }
};

const handlerVideoMute = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        videoBtn.style.color = "red";
        console.log("VideoTracks : " + enabled);
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        console.log("VideoTracks : " + enabled);
        videoBtn.style.color = "";
    }
};

const handlerMuteControler = () => {
    videoBtn.addEventListener("click", () => {
        handlerVideoMute();
    });
    audioBtn.addEventListener("click", () => {
        handlerAudioMute();
    });
};

const copyInfo = () => {
    navigator.clipboard.writeText(window.location.href);
};

function shareFilesBtn() {
    const fileShare = document.getElementById("shareFile");
    const file = document.createElement("input");

    file.type = "file";
    file.id = "file";
    file.style.display = "none";

    fileShare.appendChild(file);
    fileShare.addEventListener("click", () => shareFiles(file));
}

function shareFiles() {
    console.log(file.value);
    const files = [file];
    if (
        navigator.canShare &&
        navigator.canShare({
            files: files,
        })
    ) {
        const numFiles = files.length;
        console.log(numFiles);
        navigator
            .share({
                file: files,
            })
            .then(() => console.log("Successful share"))
            .catch((error) => console.log("Error sharing", error));
    } else {
        console.log("Web Share API is not available in your browser.");
    }
}

videoStreamFuncResult();
