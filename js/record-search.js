let mediaStream = null;
let mediaRecorder = null;

let recordedChunks = [];
let recordedBlob = null;
let recordedObjectUrl = null;

let recording = false;
let uploading = false;
let usingFrontCamera = true;

let seconds = 0;
let timer = null;

/* ==========================================
   CONFIG
========================================== */

const FILE_UPLOAD_ENDPOINT =
    `${API_BASE_URL}/files/upload`;

const FIND_ENDPOINT =
    `${API_BASE_URL}/find`;

const MAX_RECORDING_SECONDS = 300;

/* ==========================================
   ELEMENTS
========================================== */

const camera =
    document.getElementById("camera");

const playback =
    document.getElementById("playback");

const caption =
    document.getElementById("caption");

const captionCount =
    document.getElementById("captionCount");

const category =
    document.getElementById("findCategory");

const locationInput =
    document.getElementById("findLocation");

const recordBtn =
    document.getElementById("recordBtn");

const retakeBtn =
    document.getElementById("retakeBtn");

const uploadBtn =
    document.getElementById("uploadBtn");

const switchCameraBtn =
    document.getElementById("switchCameraBtn");

const timerLabel =
    document.getElementById("recordTimer");

const uploadCard =
    document.getElementById("uploadCard");

const uploadTitle =
    document.getElementById("uploadTitle");

const uploadText =
    document.getElementById("uploadText");

const uploadProgress =
    document.getElementById("uploadProgress");

const videoInfo =
    document.getElementById("videoInfo");

const videoSize =
    document.getElementById("videoSize");

/* ==========================================
   SAFETY CHECK
========================================== */

if (!camera || !playback || !recordBtn) {
    console.error(
        "record-search.js: Required elements are missing."
    );
}

/* ==========================================
   GET AUTH TOKEN
========================================== */

function getToken() {

    return localStorage.getItem("token");

}

/* ==========================================
   GET SUPPORTED MIME TYPE
========================================== */

function getSupportedMimeType() {

    const types = [

        "video/webm;codecs=vp9,opus",

        "video/webm;codecs=vp8,opus",

        "video/webm",

        "video/mp4"

    ];

    for (const type of types) {

        if (
            typeof MediaRecorder !== "undefined" &&
            MediaRecorder.isTypeSupported(type)
        ) {

            return type;

        }

    }

    return "";

}

/* ==========================================
   START CAMERA
========================================== */

async function startCamera() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            alert(
                "Camera access is not supported by this browser."
            );

            return false;

        }

        stopCamera();

        mediaStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode:
                        usingFrontCamera
                            ? "user"
                            : "environment",

                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }

                },

                audio: true

            });

        camera.srcObject =
            mediaStream;

        camera.style.display =
            "block";

        playback.style.display =
            "none";

        await camera.play().catch(() => {});

        return true;

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );

        if (
            error.name ===
            "NotAllowedError"
        ) {

            alert(
                "Camera and microphone permission is required to record a Find request."
            );

        }

        else if (
            error.name ===
            "NotFoundError"
        ) {

            alert(
                "No camera or microphone was found on this device."
            );

        }

        else {

            alert(
                "Unable to access your camera."
            );

        }

        return false;

    }

}

/* ==========================================
   STOP CAMERA
========================================== */

function stopCamera() {

    if (!mediaStream) {
        return;
    }

    mediaStream
        .getTracks()
        .forEach(track => {

            track.stop();

        });

    mediaStream = null;

    camera.srcObject = null;

}

/* ==========================================
   SWITCH CAMERA
========================================== */

if (switchCameraBtn) {

    switchCameraBtn.addEventListener(
        "click",
        async () => {

            if (recording || uploading) {
                return;
            }

            usingFrontCamera =
                !usingFrontCamera;

            await startCamera();

        }
    );

}

/* ==========================================
   CAPTION COUNTER
========================================== */

if (caption && captionCount) {

    caption.addEventListener(
        "input",
        () => {

            captionCount.textContent =
                `${caption.value.length} / 300`;

        }
    );

}

/* ==========================================
   TIME FORMAT
========================================== */

function formatTime(value) {

    const minutes =
        String(
            Math.floor(value / 60)
        ).padStart(2, "0");

    const secs =
        String(
            value % 60
        ).padStart(2, "0");

    return `${minutes}:${secs}`;

}

/* ==========================================
   START TIMER
========================================== */

function startTimer() {

    stopTimer();

    seconds = 0;

    timerLabel.textContent =
        "00:00";

    timer =
        setInterval(
            () => {

                seconds++;

                timerLabel.textContent =
                    formatTime(seconds);

                if (
                    seconds >=
                    MAX_RECORDING_SECONDS
                ) {

                    stopRecording();

                }

            },
            1000
        );

}

/* ==========================================
   STOP TIMER
========================================== */

function stopTimer() {

    if (timer) {

        clearInterval(timer);

    }

    timer = null;

}

/* ==========================================
   START RECORDING
========================================== */

function startRecording() {

    if (!mediaStream) {

        alert(
            "Camera is not ready yet."
        );

        return;

    }

    if (
        typeof MediaRecorder ===
        "undefined"
    ) {

        alert(
            "Video recording is not supported by this browser."
        );

        return;

    }

    const mimeType =
        getSupportedMimeType();

    if (!mimeType) {

        alert(
            "This browser does not support a compatible video recording format."
        );

        return;

    }

    recordedChunks = [];

    recordedBlob = null;

    const options = {
        mimeType
    };

    try {

        mediaRecorder =
            new MediaRecorder(
                mediaStream,
                options
            );

    }

    catch (error) {

        console.error(
            "MediaRecorder error:",
            error
        );

        alert(
            "Unable to start video recording."
        );

        return;

    }

    mediaRecorder.ondataavailable =
        event => {

            if (
                event.data &&
                event.data.size > 0
            ) {

                recordedChunks.push(
                    event.data
                );

            }

        };

    mediaRecorder.onerror =
        event => {

            console.error(
                "Recording error:",
                event
            );

            recording = false;

            stopTimer();

            recordBtn.classList.remove(
                "recording"
            );

        };

    mediaRecorder.onstop =
        finishRecording;

    mediaRecorder.start(
        1000
    );

    recording = true;

    recordBtn.classList.add(
        "recording"
    );

    recordBtn.setAttribute(
        "aria-label",
        "Stop recording"
    );

    if (switchCameraBtn) {

        switchCameraBtn.disabled =
            true;

    }

    startTimer();

}

/* ==========================================
   STOP RECORDING
========================================== */

function stopRecording() {

    if (!mediaRecorder) {
        return;
    }

    if (
        mediaRecorder.state ===
        "inactive"
    ) {

        return;

    }

    mediaRecorder.stop();

    recording = false;

    recordBtn.classList.remove(
        "recording"
    );

    recordBtn.setAttribute(
        "aria-label",
        "Start recording"
    );

    stopTimer();

}

/* ==========================================
   FINISH RECORDING
========================================== */

function finishRecording() {

    const mimeType =
        mediaRecorder?.mimeType ||
        "video/webm";

    recordedBlob =
        new Blob(
            recordedChunks,
            {
                type: mimeType
            }
        );

    if (!recordedBlob.size) {

        alert(
            "No video was recorded. Please try again."
        );

        recordedBlob = null;

        return;

    }

    revokePlaybackUrl();

    recordedObjectUrl =
        URL.createObjectURL(
            recordedBlob
        );

    camera.style.display =
        "none";

    playback.src =
        recordedObjectUrl;

    playback.style.display =
        "block";

    playback.load();

    stopCamera();

    if (videoInfo) {

        videoInfo.style.display =
            "flex";

    }

    if (videoSize) {

        const sizeMB =
            recordedBlob.size /
            1024 /
            1024;

        videoSize.textContent =
            `${sizeMB.toFixed(2)} MB`;

    }

    if (retakeBtn) {

        retakeBtn.style.display =
            "inline-flex";

    }

    if (uploadBtn) {

        uploadBtn.style.display =
            "inline-flex";

        uploadBtn.disabled =
            false;

    }

    if (switchCameraBtn) {

        switchCameraBtn.disabled =
            true;

    }

    timerLabel.textContent =
        formatTime(seconds);

}

/* ==========================================
   RECORD BUTTON
========================================== */

if (recordBtn) {

    recordBtn.addEventListener(
        "click",
        () => {

            if (uploading) {
                return;
            }

            if (!recording) {

                startRecording();

            }

            else {

                stopRecording();

            }

        }
    );

}

/* ==========================================
   RETAKE
========================================== */

if (retakeBtn) {

    retakeBtn.addEventListener(
        "click",
        async () => {

            if (recording || uploading) {
                return;
            }

            recordedBlob = null;

            recordedChunks = [];

            playback.pause();

            playback.removeAttribute(
                "src"
            );

            playback.load();

            playback.style.display =
                "none";

            camera.style.display =
                "block";

            if (videoInfo) {

                videoInfo.style.display =
                    "none";

            }

            retakeBtn.style.display =
                "none";

            if (uploadBtn) {

                uploadBtn.style.display =
                    "none";

            }

            if (switchCameraBtn) {

                switchCameraBtn.disabled =
                    false;

            }

            seconds = 0;

            timerLabel.textContent =
                "00:00";

            revokePlaybackUrl();

            await startCamera();

        }
    );

}

/* ==========================================
   VALIDATE FORM
========================================== */

function validateFindRequest() {

    const captionValue =
        caption?.value.trim() || "";

    const categoryValue =
        category?.value.trim() || "";

    const locationValue =
        locationInput?.value.trim() || "";

    if (!recordedBlob) {

        alert(
            "Please record a video first."
        );

        return null;

    }

    if (!captionValue) {

        alert(
            "Please describe what you are looking for."
        );

        caption?.focus();

        return null;

    }

    if (captionValue.length > 300) {

        alert(
            "Your description must be 300 characters or less."
        );

        return null;

    }

    if (!categoryValue) {

        alert(
            "Please select a category."
        );

        return null;

    }

    return {

        caption: captionValue,

        category: categoryValue,

        location: locationValue

    };

}

/* ==========================================
   UPLOAD UI
========================================== */

function showUploadCard() {

    uploadCard.style.display =
        "block";

    uploadTitle.textContent =
        "Uploading video...";

    uploadText.textContent =
        "Preparing your Find request.";

    uploadProgress.style.width =
        "0%";

    uploadProgress.textContent =
        "0%";

}

/* ==========================================
   UPDATE PROGRESS
========================================== */

function updateProgress(percent) {

    const safePercent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(percent)
            )
        );

    uploadProgress.style.width =
        `${safePercent}%`;

    uploadProgress.textContent =
        `${safePercent}%`;

}

/* ==========================================
   UPLOAD VIDEO FILE
========================================== */

function uploadVideoFile(
    blob,
    token
) {

    return new Promise(
        (resolve, reject) => {

            const xhr =
                new XMLHttpRequest();

            xhr.open(
                "POST",
                FILE_UPLOAD_ENDPOINT
            );

            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
            );

            xhr.upload.onprogress =
                event => {

                    if (
                        !event.lengthComputable
                    ) {

                        return;

                    }

                    const percent =
                        (
                            event.loaded /
                            event.total
                        ) * 100;

                    updateProgress(
                        percent
                    );

                    uploadTitle.textContent =
                        "Uploading video...";

                    uploadText.textContent =
                        `Uploading ${Math.round(percent)}%`;

                };

            xhr.onload = () => {

                if (
                    xhr.status < 200 ||
                    xhr.status >= 300
                ) {

                    let message =
                        "Video upload failed.";

                    try {

                        const response =
                            JSON.parse(
                                xhr.responseText
                            );

                        if (
                            response?.message
                        ) {

                            message =
                                Array.isArray(
                                    response.message
                                )
                                    ? response.message.join(
                                        ", "
                                    )
                                    : response.message;

                        }

                    }

                    catch (error) {
                        // Keep default message.
                    }

                    reject(
                        new Error(
                            message
                        )
                    );

                    return;

                }

                let response;

                try {

                    response =
                        JSON.parse(
                            xhr.responseText
                        );

                }

                catch (error) {

                    reject(
                        new Error(
                            "The upload server returned an invalid response."
                        )
                    );

                    return;

                }

                const videoUrl =
                    response?.videoUrl ||
                    response?.fileUrl ||
                    response?.url ||
                    response?.data?.videoUrl ||
                    response?.data?.fileUrl ||
                    response?.data?.url;

                if (!videoUrl) {

                    console.error(
                        "Upload response:",
                        response
                    );

                    reject(
                        new Error(
                            "Video uploaded, but no video URL was returned."
                        )
                    );

                    return;

                }

                resolve(
                    videoUrl
                );

            };

            xhr.onerror = () => {

                reject(
                    new Error(
                        "Network error while uploading the video."
                    )
                );

            };

            xhr.ontimeout = () => {

                reject(
                    new Error(
                        "The video upload timed out."
                    )
                );

            };

            const extension =
                blob.type.includes(
                    "mp4"
                )
                    ? "mp4"
                    : "webm";

            const formData =
                new FormData();

            formData.append(
                "file",
                blob,
                `find-video.${extension}`
            );

            xhr.send(
                formData
            );

        }
    );

}

/* ==========================================
   CREATE FIND REQUEST
========================================== */

function createFindRequest(
    data,
    videoUrl,
    token
) {

    return new Promise(
        (resolve, reject) => {

            const payload = {

                caption:
                    data.caption,

                category:
                    data.category,

                location:
                    data.location || undefined,

                videoUrl:
                    videoUrl,

                duration:
                    seconds

            };

            const xhr =
                new XMLHttpRequest();

            xhr.open(
                "POST",
                FIND_ENDPOINT
            );

            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
            );

            xhr.setRequestHeader(
                "Content-Type",
                "application/json"
            );

            xhr.onload = () => {

                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    let response = {};

                    try {

                        response =
                            JSON.parse(
                                xhr.responseText
                            );

                    }

                    catch (error) {
                        // Empty response is acceptable.
                    }

                    resolve(
                        response
                    );

                    return;

                }

                let message =
                    "Unable to publish your Find request.";

                try {

                    const response =
                        JSON.parse(
                            xhr.responseText
                        );

                    if (
                        response?.message
                    ) {

                        message =
                            Array.isArray(
                                response.message
                            )
                                ? response.message.join(
                                    ", "
                                )
                                : response.message;

                    }

                }

                catch (error) {
                    // Keep default message.
                }

                reject(
                    new Error(
                        message
                    )
                );

            };

            xhr.onerror = () => {

                reject(
                    new Error(
                        "Network error while publishing your Find request."
                    )
                );

            };

            xhr.send(
                JSON.stringify(
                    payload
                )
            );

        }
    );

}

/* ==========================================
   PUBLISH FIND REQUEST
========================================== */

if (uploadBtn) {

    uploadBtn.addEventListener(
        "click",
        async () => {

            if (uploading) {
                return;
            }

            const token =
                getToken();

            if (!token) {

                window.location.href =
                    "login.html";

                return;

            }

            const data =
                validateFindRequest();

            if (!data) {
                return;
            }

            uploading = true;

            uploadBtn.disabled =
                true;

            recordBtn.disabled =
                true;

            if (retakeBtn) {

                retakeBtn.disabled =
                    true;

            }

            if (switchCameraBtn) {

                switchCameraBtn.disabled =
                    true;

            }

            showUploadCard();

            try {

                /*
                 * STEP 1
                 * Upload raw video.
                 */

                const videoUrl =
                    await uploadVideoFile(
                        recordedBlob,
                        token
                    );

                updateProgress(
                    100
                );

                uploadTitle.textContent =
                    "Saving request...";

                uploadText.textContent =
                    "Publishing your Find request.";

                /*
                 * STEP 2
                 * POST metadata + videoUrl
                 * to /find.
                 */

                await createFindRequest(
                    data,
                    videoUrl,
                    token
                );

                uploadTitle.textContent =
                    "Published";

                uploadText.textContent =
                    "Your Find request is now live.";

                updateProgress(
                    100
                );

                setTimeout(
                    () => {

                        window.location.href =
                            "search.html";

                    },
                    1200
                );

            }

            catch (error) {

                console.error(
                    "Find publish error:",
                    error
                );

                uploadTitle.textContent =
                    "Upload Failed";

                uploadText.textContent =
                    error.message ||
                    "Something went wrong. Please try again.";

                uploadBtn.disabled =
                    false;

                recordBtn.disabled =
                    false;

                if (retakeBtn) {

                    retakeBtn.disabled =
                        false;

                }

                uploading = false;

            }

        }
    );

}

/* ==========================================
   REVOKE PLAYBACK URL
========================================== */

function revokePlaybackUrl() {

    if (recordedObjectUrl) {

        URL.revokeObjectURL(
            recordedObjectUrl
        );

        recordedObjectUrl =
            null;

    }

}

/* ==========================================
   INITIALIZE
========================================== */

async function initializeRecordSearch() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }

    await startCamera();

}

/*
 * The script is loaded at the bottom
 * of record-search.html, so initialize
 * immediately.
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRecordSearch
    );

}

else {

    initializeRecordSearch();

}

/* ==========================================
   CLEANUP
========================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopTimer();

        stopCamera();

        revokePlaybackUrl();

    }
);