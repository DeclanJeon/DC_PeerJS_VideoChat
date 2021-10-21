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

let myVideoStream;
let myUserId;
let userCount = 0;

localVideo.muted = true;

const peer = new Peer(undefined, {
    initiator: true,
    trickle: false,
    path: "/",
    host: "0.peerjs.com",
    port: "443",
    //path: "/peerjs",
    //host: "localhost",
    //port : "1337",
    pingInterval: 2000,
    config: {
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
            {
                urls: "turn:192.158.29.39:3478?transport=udp",
                credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                username: "28224511:1379330808",
            },
        ],
        sdpmantics: "unified-plan",
        //iceTransportPolicy: "relay", // <- this is a hint for WebRTC to use the relay server
    },

    debug: 3,
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
    audio: false,
};

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

    myVideoStream = stream;
    addVideoStream(localVideo, stream);

    peer.on("call", (call) => {
        const remoteVideo = document.createElement("video");
        remoteVideo.setAttribute("id", "remote__video");
        remoteVideo.volume = 0;

        call.answer(stream);
        call.on("stream", (userVideoStream) => {
            addVideoStream(remoteVideo, userVideoStream);
        });
    });

    socket.on("user-connected", (userId) => {
        myUserId = userId;
        connectToNewUser(userId, stream);
        console.log("The User has been Connected. : ", userId);
        userCount = userCount + peer.connect.length;
        console.log("userCount : " + userCount);
        fileSharing(userId);
    });
    socket.on("user-disconnected", (userId) => {
        if (peers[userId]) {
            peers[userId].close();
        }
    });

    peer.on("open", (id) => {
        socket.emit("join-room", ROOM_ID, id);
    });

    peer.on("error", (err) => {
        console.log("error : " + err);
    });
}

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
        shareScreen();
    });
}

function getDisplayMedia(options) {
    if (mediaDevices && mediaDevices.getDisplayMedia) {
        return mediaDevices.getDisplayMedia(options);
    }
    if (mediaDevices.getDisplayMedia) {
        return mediaDevices.getDisplayMedia(options);
    }
    if (mediaDevices.webkitGetDisplayMedia) {
        return mediaDevices.webkitGetDisplayMedia(options);
    }
    if (mediaDevices.mozGetDisplayMedia) {
        return mediaDevices.mozGetDisplayMedia(options);
    }
    throw new Error("getDisplayMedia is not defined");
}

const shareScreen = async () => {
    // if (adapter.browserDetails.browser == "firefox") {
    //     adapter.browserShim.shimGetDisplayMedia(window, "screen");
    // }
    let captureStream = null;
    try {
        captureStream = await mediaDevices.getDisplayMedia(displayMediaConfig);
    } catch (err) {
        console.error("Error: " + err);
    }
    connectToNewUser(myUserId, captureStream);
    socket.emit("screen-share", captureStream);
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
