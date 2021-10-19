const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const localVideo = document.createElement("video");

const userIdCtr = document.createElement("div");
userIdCtr.id = "userId";

localVideo.setAttribute("id", "local__video");
localVideo.volume = 0;

const remoteVideoContainer = document.getElementById(
    "remote__video__container"
);

const videoBtn = document.getElementById("muteVideo");
const audioBtn = document.getElementById("muteAudio");
const shareScreenBtn = document.getElementById("shareScreen");

const mediaDevices = navigator.mediaDevices;

localVideo.muted = true;

const peer = new Peer({
    initiator: true,
    trickle: false,
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

const displayMediaConfig = {
    video: {
        cursor: "always" | "motion" | "never",
        displaySurface: "application" | "browser" | "monitor" | "window",
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100,
    },
};

let myVideoStream;
let myUserId;

const username = window.prompt("Enter the username");
socket.emit("new user", username);

function videoStreamFuncResult() {
    videoCall();
    shareScreenBtnFunc();
    handlerMuteControler();
}

async function videoCall() {
    const getUserMedia =
        mediaDevices.getUserMedia ||
        mediaDevices.webkitGetUserMedia ||
        mediaDevices.mozGetUserMedia;
    const stream = await getUserMedia(constraints);

    console.log(stream.getVideoTracks());

    myVideoStream = stream;
    socket.connect();
    console.log(socket.connect());
    addVideoStream(localVideo, stream);

    peer.on("call", (call) => {
        const remoteVideo = document.createElement("video");
        remoteVideo.setAttribute("id", "remote__video");
        remoteVideo.volume = 0;

        call.answer(stream);
        call.on("stream", (userVideoStream) => {
            addVideoStream(remoteVideo, userVideoStream);
            this.currentPeer = call.peerConnection;
        });
    });

    socket.on("user-connected", (userId) => {
        myUserId = userId;
        console.log("The User has been Connected. : ", userId);
        connectToNewUser(userId, stream);
    });
}

socket.on("user-disconnected", (userId) => {
    if (peers[userId]) {
        peers[userId].close();
    }
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
    console.log("ROOM_ID : " + ROOM_ID);
    console.log("Peer Open ID : ", id);
});

peer.on("error", (err) => {
    console.log("error : " + err);
});

const connectToNewUser = (userId, stream) => {
    const call = peer.call(userId, stream);
    const remoteVideo = document.createElement("video");
    remoteVideo.setAttribute("id", "remote__video");
    remoteVideo.volume = 0;

    call.on("stream", (userVideoStream) => {
        addVideoStream(remoteVideo, userVideoStream);
    });
    call.on("close", () => {
        remoteVideo.remove();
    });

    peers[userId] = call;
    console.log(peers[userId]);
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
            displayMediaConfig
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

    console.log(video.id);
    if (video.id == "local__video") {
        videoGrid.append(video);
    } else {
        remoteVideoContainer.append(video);
    }
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
