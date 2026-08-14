console.log("VINDARR CHAT JS LOADED");


/* ==========================================
   CONFIG
========================================== */

const token =
    localStorage.getItem("token");


const currentUser =
    JSON.parse(
        localStorage.getItem("user") || "null"
    );


const currentUsername =
    currentUser?.username;


const params =
    new URLSearchParams(
        window.location.search
    );


const receiverUsername =
    params.get("user");


const chatContainer =
    document.getElementById(
        "chatMessages"
    );


const input =
    document.getElementById(
        "chatInput"
    );


const sendBtn =
    document.getElementById(
        "sendBtn"
    );


const backBtn =
    document.getElementById(
        "backBtn"
    );


const chatUsername =
    document.getElementById(
        "chatUsername"
    );


const replyPreview =
    document.getElementById(
        "replyPreview"
    );


const replyPreviewUser =
    document.getElementById(
        "replyPreviewUser"
    );


const replyPreviewText =
    document.getElementById(
        "replyPreviewText"
    );


const cancelReplyBtn =
    document.getElementById(
        "cancelReplyBtn"
    );


const attachmentBtn =
    document.getElementById(
        "attachmentBtn"
    );


const attachmentInput =
    document.getElementById(
        "attachmentInput"
    );


const attachmentPreview =
    document.getElementById(
        "attachmentPreview"
    );


const attachmentPreviewContent =
    document.getElementById(
        "attachmentPreviewContent"
    );


const removeAttachmentBtn =
    document.getElementById(
        "removeAttachmentBtn"
    );


const videoNoteBtn =
    document.getElementById(
        "videoNoteBtn"
    );


const videoModal =
    document.getElementById(
        "videoModal"
    );


const videoPreview =
    document.getElementById(
        "videoPreview"
    );


const videoPlaceholder =
    document.getElementById(
        "videoPlaceholder"
    );


const closeVideoModalBtn =
    document.getElementById(
        "closeVideoModalBtn"
    );


const recordVideoBtn =
    document.getElementById(
        "recordVideoBtn"
    );


const useVideoBtn =
    document.getElementById(
        "useVideoBtn"
    );


const recordTimer =
    document.getElementById(
        "recordTimer"
    );


const messageActions =
    document.getElementById(
        "messageActions"
    );


const replyActionBtn =
    document.getElementById(
        "replyActionBtn"
    );


const deleteActionBtn =
    document.getElementById(
        "deleteActionBtn"
    );


const closeActionsBtn =
    document.getElementById(
        "closeActionsBtn"
    );


/* ==========================================
   STATE
========================================== */

let messages = [];

let selectedMessage = null;

let replyTo = null;

let selectedAttachment = null;

let mediaStream = null;

let mediaRecorder = null;

let recordedChunks = [];

let recordedVideoBlob = null;

let recordingTimer = null;

let recordingSeconds = 0;


/* ==========================================
   AUTH
========================================== */

if (!token) {

    window.location.href =
        "login.html";

}


if (!receiverUsername) {

    window.location.href =
        "messages.html";

}


if (chatUsername) {

    chatUsername.textContent =
        receiverUsername;

}


/* ==========================================
   ESCAPE
========================================== */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ==========================================
   FORMAT TIME
========================================== */

function formatTime(dateValue) {

    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* ==========================================
   LOAD CHAT
========================================== */

async function loadChat() {

    try {

        chatContainer.innerHTML = `
            <div class="chat-loading">
                <div class="loading-spinner"></div>
                <span>Loading conversation...</span>
            </div>
        `;


        const response =
            await fetch(
                `${API_BASE_URL}/messages/chat/${encodeURIComponent(receiverUsername)}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load conversation."
            );

        }


        const data =
            await response.json();


        messages =
            Array.isArray(data)
                ? data
                : [];


        renderMessages();


    }
    catch (error) {

        console.error(
            "LOAD CHAT ERROR:",
            error
        );


        chatContainer.innerHTML = `
            <div class="chat-loading">
                <i class="bi bi-exclamation-circle"
                   style="font-size:30px;color:#d10000">
                </i>
                <span>Unable to load messages.</span>
            </div>
        `;

    }

}


/* ==========================================
   RENDER MESSAGES
========================================== */

function renderMessages() {

    if (!messages.length) {

        chatContainer.innerHTML = `
            <div class="chat-loading">

                <i
                    class="bi bi-chat-heart"
                    style="
                        font-size:38px;
                        color:#d10000;
                    "
                ></i>

                <strong>
                    Start the conversation
                </strong>

                <span>
                    Send a message to ${escapeHtml(receiverUsername)}.
                </span>

            </div>
        `;

        return;
    }


    chatContainer.innerHTML =
        messages
            .map(
                renderMessage
            )
            .join("");


    chatContainer.scrollTop =
        chatContainer.scrollHeight;


    attachMessageEvents();

}


/* ==========================================
   RENDER MESSAGE
========================================== */

function renderMessage(message) {

    const mine =
        message.senderUsername ===
        currentUsername;


    const text =
        message.text || "";


    let attachmentHtml = "";


    if (message.attachmentUrl) {

        const url =
            message.attachmentUrl;


        const type =
            message.attachmentType || "";


        if (
            type.startsWith("image/")
        ) {

            attachmentHtml = `
                <div class="message-attachment">

                    <img
                        src="${escapeHtml(url)}"
                        alt="Attachment"
                    >

                </div>
            `;

        }
        else {

            attachmentHtml = `
                <div class="message-attachment">

                    <a
                        class="message-file"
                        href="${escapeHtml(url)}"
                        target="_blank"
                        rel="noopener"
                    >

                        <i class="bi bi-file-earmark"></i>

                        <span>
                            Open attachment
                        </span>

                    </a>

                </div>
            `;

        }

    }


    const replyHtml =
        message.replyTo
            ? `
                <div class="reply-quote">

                    <strong>
                        ${escapeHtml(
                            message.replyTo.senderUsername
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            message.replyTo.text ||
                            "Attachment"
                        )}
                    </span>

                </div>
            `
            : "";


    const bodyHtml =
        text
            ? `<div>${escapeHtml(text)}</div>`
            : "";


    return `

        <div
            class="message-row ${mine ? "mine" : "theirs"}"
            data-id="${message.id}"
        >

            <div>

                <div class="message-bubble">

                    ${replyHtml}

                    ${attachmentHtml}

                    ${bodyHtml}

                </div>


                <div class="message-meta">

                    <span>
                        ${formatTime(
                            message.createdAt
                        )}
                    </span>

                    ${
                        mine
                            ? `
                                <span>
                                    ${message.read ? "Seen" : "Sent"}
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>


            <button
                class="message-menu-btn"
                type="button"
                data-message-id="${message.id}"
                aria-label="Message options"
            >
                <i class="bi bi-three-dots"></i>
            </button>

        </div>

    `;

}


/* ==========================================
   MESSAGE EVENTS
========================================== */

function attachMessageEvents() {

    document
        .querySelectorAll(
            ".message-menu-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        const id =
                            Number(
                                button.dataset.messageId
                            );


                        selectedMessage =
                            messages.find(
                                message =>
                                    Number(message.id) === id
                            );


                        if (
                            selectedMessage
                        ) {

                            openMessageActions();

                        }

                    }
                );

            }
        );

}


/* ==========================================
   ACTION SHEET
========================================== */

function openMessageActions() {

    if (!selectedMessage) {
        return;
    }


    messageActions.classList.add(
        "active"
    );


    const isMine =
        selectedMessage.senderUsername ===
        currentUsername;


    deleteActionBtn.style.display =
        isMine
            ? "flex"
            : "none";

}


function closeMessageActions() {

    messageActions.classList.remove(
        "active"
    );

}


replyActionBtn.addEventListener(
    "click",
    () => {

        if (!selectedMessage) {
            return;
        }


        setReply(
            selectedMessage
        );


        closeMessageActions();

    }
);


deleteActionBtn.addEventListener(
    "click",
    async () => {

        if (!selectedMessage) {
            return;
        }


        const message =
            selectedMessage;


        closeMessageActions();


        const confirmed =
            window.confirm(
                "Delete this message?"
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/messages/${message.id}`,
                    {
                        method: "DELETE",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (!response.ok) {

                const data =
                    await response.json()
                        .catch(
                            () => ({})
                        );


                throw new Error(
                    data.message ||
                    "Unable to delete message."
                );

            }


            messages =
                messages.filter(
                    item =>
                        item.id !== message.id
                );


            renderMessages();


        }
        catch (error) {

            console.error(
                "DELETE MESSAGE ERROR:",
                error
            );


            alert(
                error.message
            );

        }

    }
);


closeActionsBtn.addEventListener(
    "click",
    closeMessageActions
);


messageActions.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            messageActions
        ) {

            closeMessageActions();

        }

    }
);


/* ==========================================
   REPLY
========================================== */

function setReply(message) {

    replyTo =
        message;


    replyPreviewUser.textContent =
        message.senderUsername;


    replyPreviewText.textContent =
        message.text ||
        "Attachment";


    replyPreview.classList.add(
        "active"
    );


    input.focus();

}


cancelReplyBtn.addEventListener(
    "click",
    clearReply
);


function clearReply() {

    replyTo =
        null;

    replyPreview.classList.remove(
        "active"
    );

}


/* ==========================================
   UPLOAD ATTACHMENT
========================================== */

attachmentBtn.addEventListener(
    "click",
    () => {

        attachmentInput.click();

    }
);


attachmentInput.addEventListener(
    "change",
    () => {

        const file =
            attachmentInput.files?.[0];


        if (!file) {
            return;
        }


        selectedAttachment =
            file;


        renderAttachmentPreview();

    }
);


function renderAttachmentPreview() {

    if (!selectedAttachment) {

        attachmentPreview.classList.remove(
            "active"
        );

        return;

    }


    attachmentPreviewContent.innerHTML = "";


    if (
        selectedAttachment.type.startsWith(
            "image/"
        )
    ) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            URL.createObjectURL(
                selectedAttachment
            );


        attachmentPreviewContent.appendChild(
            img
        );

    }
    else {

        attachmentPreviewContent.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                color:white;
                font-size:12px;
            ">

                <i
                    class="bi bi-file-earmark-pdf"
                    style="
                        font-size:25px;
                        color:#d10000;
                    "
                ></i>

                ${escapeHtml(
                    selectedAttachment.name
                )}

            </div>
        `;

    }


    attachmentPreview.classList.add(
        "active"
    );

}


removeAttachmentBtn.addEventListener(
    "click",
    clearAttachment
);


function clearAttachment() {

    selectedAttachment =
        null;


    attachmentInput.value =
        "";


    attachmentPreview.classList.remove(
        "active"
    );


    attachmentPreviewContent.innerHTML =
        "";

}


/* ==========================================
   UPLOAD FILE
========================================== */

async function uploadAttachment(
    file
) {

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(
            `${API_BASE_URL}/messages/upload`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body:
                    formData
            }
        );


    if (!response.ok) {

        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        throw new Error(
            data.message ||
            "Attachment upload failed."
        );

    }


    return response.json();

}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    const text =
        input.value.trim();


    if (
        !text &&
        !selectedAttachment
    ) {

        return;

    }


    sendBtn.disabled =
        true;


    try {

        let attachmentUrl =
            null;


        let attachmentType =
            null;


        if (selectedAttachment) {

            const uploaded =
                await uploadAttachment(
                    selectedAttachment
                );


            attachmentUrl =
                uploaded.url;


            attachmentType =
                uploaded.type;

        }


        const payload = {

            receiverUsername,

            text:
                text || undefined,

            attachmentUrl:
                attachmentUrl ||
                undefined,

            attachmentType:
                attachmentType ||
                undefined

        };


        const response =
            await fetch(
                `${API_BASE_URL}/messages`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Message could not be sent."
            );

        }


        input.value =
            "";


        clearAttachment();

        clearReply();


        await loadChat();

    }
    catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );


        alert(
            error.message ||
            "Unable to send message."
        );

    }
    finally {

        sendBtn.disabled =
            false;

    }

}


sendBtn.addEventListener(
    "click",
    sendMessage
);


input.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* ==========================================
   VIDEO NOTE
========================================== */

videoNoteBtn.addEventListener(
    "click",
    openVideoRecorder
);


async function openVideoRecorder() {

    videoModal.classList.add(
        "active"
    );


    videoPlaceholder.style.display =
        "flex";


    useVideoBtn.disabled =
        true;


    recordedVideoBlob =
        null;


    try {

        mediaStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    video: true,
                    audio: true
                }
            );


        videoPreview.srcObject =
            mediaStream;


        videoPreview.style.display =
            "block";


        videoPlaceholder.style.display =
            "none";

    }
    catch (error) {

        console.error(
            "VIDEO CAMERA ERROR:",
            error
        );


        videoPlaceholder.innerHTML = `
            <i class="bi bi-camera-video-off"></i>

            <span>
                Camera permission is required.
            </span>
        `;

    }

}


/* ==========================================
   RECORD
========================================== */

recordVideoBtn.addEventListener(
    "click",
    toggleRecording
);


function toggleRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state ===
            "recording"
    ) {

        stopRecording();

        return;

    }


    if (!mediaStream) {

        alert(
            "Camera is not available."
        );

        return;

    }


    recordedChunks =
        [];


    const mimeType =
        getSupportedMimeType();


    try {

        mediaRecorder =
            mimeType
                ? new MediaRecorder(
                    mediaStream,
                    {
                        mimeType
                    }
                )
                : new MediaRecorder(
                    mediaStream
                );

    }
    catch (error) {

        console.error(
            "MEDIA RECORDER ERROR:",
            error
        );


        alert(
            "Your browser cannot record video."
        );

        return;

    }


    mediaRecorder.ondataavailable =
        event => {

            if (
                event.data &&
                event.data.size
            ) {

                recordedChunks.push(
                    event.data
                );

            }

        };


    mediaRecorder.onstop =
        () => {

            recordedVideoBlob =
                new Blob(
                    recordedChunks,
                    {
                        type:
                            mediaRecorder.mimeType ||
                            "video/webm"
                    }
                );


            useVideoBtn.disabled =
                recordedVideoBlob.size ===
                0;


            stopTimer();

        };


    mediaRecorder.start();


    startTimer();


    recordVideoBtn.classList.add(
        "recording"
    );

}


function stopRecording() {

    if (
        mediaRecorder &&
        mediaRecorder.state ===
            "recording"
    ) {

        mediaRecorder.stop();

    }


    recordVideoBtn.classList.remove(
        "recording"
    );

}


/* ==========================================
   MIME TYPE
========================================== */

function getSupportedMimeType() {

    const types = [

        "video/webm;codecs=vp9,opus",

        "video/webm;codecs=vp8,opus",

        "video/webm",

        "video/mp4"

    ];


    for (
        const type of types
    ) {

        if (
            MediaRecorder.isTypeSupported(
                type
            )
        ) {

            return type;

        }

    }


    return "";

}


/* ==========================================
   TIMER
========================================== */

function startTimer() {

    recordingSeconds =
        0;


    updateTimer();


    recordingTimer =
        setInterval(
            () => {

                recordingSeconds++;

                updateTimer();

            },
            1000
        );

}


function stopTimer() {

    clearInterval(
        recordingTimer
    );

    recordingTimer =
        null;

}


function updateTimer() {

    const minutes =
        Math.floor(
            recordingSeconds / 60
        );


    const seconds =
        recordingSeconds % 60;


    recordTimer.textContent =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

}


/* ==========================================
   USE VIDEO
========================================== */

useVideoBtn.addEventListener(
    "click",
    async () => {

        if (!recordedVideoBlob) {
            return;
        }


        try {

            const file =
                new File(
                    [
                        recordedVideoBlob
                    ],
                    "video-note.webm",
                    {
                        type:
                            recordedVideoBlob.type
                    }
                );


            /*
             * Current backend /messages/upload
             * does NOT accept videos.
             *
             * This will therefore fail until
             * the backend accepts video uploads.
             */

            const uploaded =
                await uploadAttachment(
                    file
                );


            selectedAttachment =
                {
                    name:
                        file.name,

                    type:
                        file.type,

                    uploadedUrl:
                        uploaded.url
                };


            closeVideoRecorder();

            alert(
                "Video note is ready to send."
            );

        }
        catch (error) {

            console.error(
                "VIDEO NOTE UPLOAD ERROR:",
                error
            );


            alert(
                "Video notes require the backend upload endpoint to accept video files."
            );

        }

    }
);


/* ==========================================
   CLOSE VIDEO
========================================== */

closeVideoModalBtn.addEventListener(
    "click",
    closeVideoRecorder
);


videoModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            videoModal
        ) {

            closeVideoRecorder();

        }

    }
);


function closeVideoRecorder() {

    stopRecording();

    stopTimer();


    if (mediaStream) {

        mediaStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }


    mediaStream =
        null;


    videoPreview.srcObject =
        null;


    videoModal.classList.remove(
        "active"
    );

}


/* ==========================================
   SOCKET.IO
========================================== */

let socket = null;


try {

    if (
        typeof io ===
        "function"
    ) {

        socket =
            io(
                API_BASE_URL,
                {
                    transports:
                        [
                            "websocket"
                        ]
                }
            );


        socket.on(
            "connect",
            () => {

                console.log(
                    "CHAT SOCKET CONNECTED"
                );

            }
        );


        socket.on(
            "receiveMessage",
            message => {

                if (!message) {
                    return;
                }


                const belongsToChat =

                    (
                        message.senderUsername ===
                        receiverUsername &&
                        message.receiverUsername ===
                        currentUsername
                    )

                    ||

                    (
                        message.senderUsername ===
                        currentUsername &&
                        message.receiverUsername ===
                        receiverUsername
                    );


                if (
                    !belongsToChat
                ) {

                    return;

                }


                if (
                    messages.some(
                        item =>
                            item.id ===
                            message.id
                    )
                ) {

                    return;

                }


                messages.push(
                    message
                );


                renderMessages();

            }
        );


    }

}
catch (error) {

    console.error(
        "SOCKET ERROR:",
        error
    );

}


/* ==========================================
   NAVIGATION
========================================== */

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "messages.html";

    }
);


/* ==========================================
   INIT
========================================== */

loadChat();