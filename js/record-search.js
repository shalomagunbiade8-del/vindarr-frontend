/* ==========================================
   VINDARR — RECORD FIND
   record-search.js
========================================== */

let mediaStream = null;
let mediaRecorder = null;

let recordedChunks = [];
let recordedBlob = null;
let recordedObjectUrl = null;

let recording = false;
let uploading = false;
let cameraReady = false;

let usingFrontCamera = true;

let seconds = 0;
let timer = null;

const MAX_RECORDING_SECONDS = 300;

const FIND_ENDPOINT =
    `${API_BASE_URL}/find`;


/* ==========================================
   ELEMENTS
========================================== */

const camera =
    document.getElementById("camera");

const playback =
    document.getElementById("playback");

const cameraMessage =
    document.getElementById("cameraMessage");

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
    document.getElementById("sendFindBtn");

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

const backBtn =
    document.getElementById("backBtn");

const nextBtn =
    document.getElementById("nextBtn");


/* ==========================================
   AUTH
========================================== */

function getToken() {
    return localStorage.getItem("token");
}


/* ==========================================
   CAMERA MESSAGE
========================================== */

function showCameraMessage(message) {

    if (!cameraMessage) {
        return;
    }

    cameraMessage.style.display = "flex";

    const text =
        cameraMessage.querySelector("p");

    if (text) {
        text.textContent = message;
    }
}


function hideCameraMessage() {

    if (cameraMessage) {
        cameraMessage.style.display = "none";
    }
}


/* ==========================================
   BUTTON STATE
========================================== */

function updateCameraButtons() {

    if (recordBtn) {
        recordBtn.disabled =
            !cameraReady ||
            uploading;
    }

    if (switchCameraBtn) {
        switchCameraBtn.disabled =
            !cameraReady ||
            recording ||
            uploading;
    }

    if (retakeBtn) {
        retakeBtn.disabled =
            recording ||
            uploading;
    }
}


/* ==========================================
   MIME TYPE
========================================== */

function getSupportedMimeType() {

    if (
        typeof MediaRecorder === "undefined"
    ) {
        return "";
    }

    const types = [

        "video/webm;codecs=vp9,opus",

        "video/webm;codecs=vp8,opus",

        "video/webm",

        "video/mp4"

    ];

    for (const type of types) {

        try {

            if (
                MediaRecorder.isTypeSupported(type)
            ) {
                return type;
            }

        }

        catch (error) {
            console.warn(
                "MIME type check failed:",
                type,
                error
            );
        }
    }

    return "";
}


/* ==========================================
   SECURE CONTEXT CHECK
========================================== */

function checkCameraEnvironment() {

    if (
        !window.isSecureContext &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
    ) {

        showCameraMessage(
            "Camera access requires a secure connection (HTTPS)."
        );

        return false;
    }

    if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !==
            "function"
    ) {

        showCameraMessage(
            "Camera access is not supported by this browser."
        );

        return false;
    }

    return true;
}


/* ==========================================
   STOP CAMERA
========================================== */

function stopCamera() {

    if (mediaStream) {

        mediaStream
            .getTracks()
            .forEach(track => {

                try {
                    track.stop();
                }

                catch (error) {
                    console.warn(
                        "Unable to stop camera track:",
                        error
                    );
                }

            });
    }

    mediaStream = null;
    cameraReady = false;

    if (camera) {
        camera.srcObject = null;
    }

    updateCameraButtons();
}


/* ==========================================
   START CAMERA
========================================== */

async function startCamera() {

    if (recording || uploading) {
        return false;
    }

    if (!checkCameraEnvironment()) {
        updateCameraButtons();
        return false;
    }

    cameraReady = false;
    updateCameraButtons();

    showCameraMessage(
        "Requesting camera and microphone access..."
    );

    try {

        stopCamera();

        /*
         * First attempt:
         * request the preferred camera.
         */

        const constraints = {

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

        };

        mediaStream =
            await navigator.mediaDevices
                .getUserMedia(constraints);


        /*
         * Make sure we actually received
         * both required tracks.
         */

        const videoTracks =
            mediaStream.getVideoTracks();

        const audioTracks =
            mediaStream.getAudioTracks();


        if (!videoTracks.length) {

            stopCamera();

            throw new Error(
                "No camera track was returned."
            );
        }


        if (!audioTracks.length) {

            stopCamera();

            throw new Error(
                "No microphone track was returned."
            );
        }


        /*
         * Attach stream to preview.
         */

        camera.srcObject =
            mediaStream;

        camera.muted = true;
        camera.autoplay = true;
        camera.playsInline = true;

        camera.style.display =
            "block";

        playback.style.display =
            "none";


        /*
         * Wait for the video element
         * to actually receive video data.
         */

        await waitForCameraReady();


        cameraReady = true;

        hideCameraMessage();

        updateCameraButtons();

        return true;

    }

    catch (error) {

        console.error(
            "Vindarr camera initialization error:",
            error
        );

        stopCamera();

        cameraReady = false;

        updateCameraButtons();

        handleCameraError(error);

        return false;
    }
}


/* ==========================================
   WAIT FOR CAMERA READY
========================================== */

function waitForCameraReady() {

    return new Promise(
        async (resolve, reject) => {

            if (!camera) {

                reject(
                    new Error(
                        "Camera element not found."
                    )
                );

                return;
            }


            let finished = false;


            const cleanup = () => {

                camera.removeEventListener(
                    "loadedmetadata",
                    onReady
                );

                camera.removeEventListener(
                    "canplay",
                    onReady
                );

                camera.removeEventListener(
                    "playing",
                    onReady
                );
            };


            const finish = () => {

                if (finished) {
                    return;
                }

                finished = true;

                cleanup();

                resolve();
            };


            const onReady = () => {

                if (
                    camera.videoWidth > 0 &&
                    camera.videoHeight > 0
                ) {
                    finish();
                }
            };


            camera.addEventListener(
                "loadedmetadata",
                onReady
            );

            camera.addEventListener(
                "canplay",
                onReady
            );

            camera.addEventListener(
                "playing",
                onReady
            );


            try {

                await camera.play();

            }

            catch (error) {

                console.warn(
                    "Camera play() warning:",
                    error
                );
            }


            /*
             * Sometimes the browser has already
             * delivered metadata before listeners
             * were attached.
             */

            if (
                camera.readyState >= 2 &&
                camera.videoWidth > 0 &&
                camera.videoHeight > 0
            ) {

                finish();

                return;
            }


            /*
             * Safety timeout.
             */

            setTimeout(
                () => {

                    if (
                        camera.videoWidth > 0 &&
                        camera.videoHeight > 0
                    ) {

                        finish();

                    }

                    else {

                        if (!finished) {

                            finished = true;

                            cleanup();

                            reject(
                                new Error(
                                    "Camera started but no video frames were received."
                                )
                            );
                        }
                    }

                },
                8000
            );
        }
    );
}


/* ==========================================
   CAMERA ERROR HANDLER
========================================== */

function handleCameraError(error) {

    const name =
        error?.name || "";

    let message =
        "Unable to access the camera.";


    if (
        name === "NotAllowedError" ||
        name === "PermissionDeniedError"
    ) {

        message =
            "Camera and microphone permission is required. Please allow access in your browser settings and reload this page.";
    }


    else if (
        name === "NotFoundError" ||
        name === "DevicesNotFoundError"
    ) {

        message =
            "No camera or microphone was found on this device.";
    }


    else if (
        name === "NotReadableError" ||
        name === "TrackStartError"
    ) {

        message =
            "Your camera or microphone is already being used by another application.";
    }


    else if (
        name === "OverconstrainedError"
    ) {

        message =
            "The selected camera is not available. Try switching cameras.";
    }


    else if (
        name === "SecurityError"
    ) {

        message =
            "Camera access was blocked by the browser for security reasons.";
    }


    else if (
        error?.message
    ) {

        message =
            error.message;
    }


    showCameraMessage(message);


    /*
     * Do not repeatedly spam alerts.
     * The message is already visible on screen.
     */

    console.error(
        "Camera error:",
        {
            name,
            message:
                error?.message
        }
    );
}


/* ==========================================
   SWITCH CAMERA
========================================== */

if (switchCameraBtn) {

    switchCameraBtn.addEventListener(
        "click",
        async () => {

            if (
                recording ||
                uploading
            ) {
                return;
            }

            if (!cameraReady) {
                return;
            }

            usingFrontCamera =
                !usingFrontCamera;

            showCameraMessage(
                "Switching camera..."
            );

            await startCamera();
        }
    );
}


/* ==========================================
   CAPTION
========================================== */

if (caption) {

    caption.addEventListener(
        "input",
        () => {

            if (captionCount) {

                captionCount.textContent =
                    `${caption.value.length} / 300`;
            }

        }
    );
}


/* ==========================================
   TIMER
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


function startTimer() {

    stopTimer();

    seconds = 0;

    if (timerLabel) {
        timerLabel.textContent =
            "00:00";
    }

    timer =
        setInterval(
            () => {

                seconds++;

                if (timerLabel) {

                    timerLabel.textContent =
                        formatTime(seconds);
                }

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

    if (!cameraReady || !mediaStream) {

        showCameraMessage(
            "Camera is not ready. Please allow camera and microphone access and try again."
        );

        return;
    }


    if (
        typeof MediaRecorder ===
        "undefined"
    ) {

        alert(
            "This browser does not support video recording."
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


    try {

        mediaRecorder =
            new MediaRecorder(
                mediaStream,
                {
                    mimeType
                }
            );

    }

    catch (error) {

        console.error(
            "MediaRecorder creation failed:",
            error
        );

        alert(
            "Unable to start recording on this device."
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
                "MediaRecorder error:",
                event
            );

            recording = false;

            stopTimer();

            recordBtn?.classList.remove(
                "recording"
            );

            updateCameraButtons();
        };


    mediaRecorder.onstop =
        finishRecording;


    try {

        mediaRecorder.start(1000);

    }

    catch (error) {

        console.error(
            "MediaRecorder.start failed:",
            error
        );

        mediaRecorder = null;

        alert(
            "Unable to start recording."
        );

        return;
    }


    recording = true;

    recordBtn?.classList.add(
        "recording"
    );

    recordBtn?.setAttribute(
        "aria-label",
        "Stop recording"
    );


    if (switchCameraBtn) {
        switchCameraBtn.disabled = true;
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


    try {

        mediaRecorder.stop();

    }

    catch (error) {

        console.error(
            "Unable to stop recorder:",
            error
        );
    }


    recording = false;

    recordBtn?.classList.remove(
        "recording"
    );

    recordBtn?.setAttribute(
        "aria-label",
        "Start recording"
    );

    stopTimer();

    if (recordBtn) {
        recordBtn.disabled = true;
    }
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


    mediaRecorder = null;


    if (!recordedBlob.size) {

        alert(
            "No video was recorded."
        );

        recordedBlob = null;

        updateCameraButtons();

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

        const size =
            recordedBlob.size /
            1024 /
            1024;

        videoSize.textContent =
            `${size.toFixed(2)} MB`;
    }


    if (retakeBtn) {
        retakeBtn.style.display =
            "inline-flex";
        retakeBtn.disabled = false;
    }


    if (uploadBtn) {
        uploadBtn.style.display =
            "flex";
        uploadBtn.disabled = false;
    }


    if (switchCameraBtn) {
        switchCameraBtn.disabled = true;
    }


    if (recordBtn) {
        recordBtn.disabled = true;
    }
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

            if (
                recording ||
                uploading
            ) {
                return;
            }


            recordedBlob = null;
            recordedChunks = [];


            if (playback) {

                playback.pause();

                playback.removeAttribute(
                    "src"
                );

                playback.load();

                playback.style.display =
                    "none";
            }


            if (camera) {

                camera.style.display =
                    "block";
            }


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


            revokePlaybackUrl();


            seconds = 0;

            if (timerLabel) {

                timerLabel.textContent =
                    "00:00";
            }


            await startCamera();
        }
    );
}


/* ==========================================
   VALIDATION
========================================== */

function validateFind() {

    if (!recordedBlob) {

        alert(
            "Please record a Find video first."
        );

        return false;
    }


    if (
        !caption ||
        !caption.value.trim()
    ) {

        alert(
            "Please describe what you are looking for."
        );

        caption?.focus();

        return false;
    }


    if (
        caption.value.trim().length >
        300
    ) {

        alert(
            "Your caption must be 300 characters or less."
        );

        return false;
    }


    if (
        !category ||
        !category.value
    ) {

        alert(
            "Please select a category."
        );

        category?.focus();

        return false;
    }


    return true;
}


/* ==========================================
   PROGRESS
========================================== */

function setProgress(percent) {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(percent)
            )
        );


    if (uploadProgress) {

        uploadProgress.style.width =
            `${value}%`;
    }
}


/* ==========================================
   SEND FIND
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


            if (!validateFind()) {
                return;
            }


            uploading = true;


            uploadBtn.disabled =
                true;

            recordBtn.disabled =
                true;

            retakeBtn.disabled =
                true;

            switchCameraBtn.disabled =
                true;


            if (uploadCard) {

                uploadCard.style.display =
                    "block";
            }


            if (uploadTitle) {

                uploadTitle.textContent =
                    "Publishing Find...";
            }


            if (uploadText) {

                uploadText.textContent =
                    "Uploading your video.";
            }


            setProgress(0);


            try {

                const formData =
                    new FormData();


                const extension =
                    recordedBlob.type
                        .includes("mp4")
                        ? "mp4"
                        : "webm";


                formData.append(
                    "video",
                    recordedBlob,
                    `find-video.${extension}`
                );


                formData.append(
                    "caption",
                    caption.value.trim()
                );


                formData.append(
                    "category",
                    category.value
                );


                formData.append(
                    "location",
                    locationInput?.value.trim() ||
                        ""
                );


                await new Promise(
                    (resolve, reject) => {

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


                                setProgress(
                                    percent
                                );


                                if (uploadText) {

                                    uploadText.textContent =
                                        `Uploading ${Math.round(
                                            percent
                                        )}%`;
                                }
                            };


                        xhr.onload =
                            () => {

                                if (
                                    xhr.status >= 200 &&
                                    xhr.status < 300
                                ) {

                                    resolve();

                                    return;
                                }


                                let message =
                                    "Unable to publish Find.";


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

                                catch {
                                    // Ignore invalid JSON.
                                }


                                reject(
                                    new Error(
                                        message
                                    )
                                );
                            };


                        xhr.onerror =
                            () => {

                                reject(
                                    new Error(
                                        "Network error while publishing Find."
                                    )
                                );
                            };


                        xhr.ontimeout =
                            () => {

                                reject(
                                    new Error(
                                        "The upload timed out."
                                    )
                                );
                            };


                        xhr.send(
                            formData
                        );
                    }
                );


                setProgress(100);


                if (uploadTitle) {

                    uploadTitle.textContent =
                        "Find Published";
                }


                if (uploadText) {

                    uploadText.textContent =
                        "Your Find is now live.";
                }


                setTimeout(
                    () => {

                        window.location.href =
                            "find.html";

                    },
                    900
                );
            }


            catch (error) {

                console.error(
                    "Find upload error:",
                    error
                );


                if (uploadTitle) {

                    uploadTitle.textContent =
                        "Upload Failed";
                }


                if (uploadText) {

                    uploadText.textContent =
                        error.message ||
                        "Something went wrong.";
                }


                uploadBtn.disabled =
                    false;

                retakeBtn.disabled =
                    false;

                uploading = false;

                /*
                 * The recording itself still exists,
                 * so the user can retry the upload.
                 */
                recordBtn.disabled =
                    true;

                switchCameraBtn.disabled =
                    true;
            }

        }
    );
}


/* ==========================================
   BACK
========================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            if (recording) {

                const leave =
                    confirm(
                        "You are currently recording. Leave without saving this Find?"
                    );

                if (!leave) {
                    return;
                }

                stopRecording();
            }


            window.history.back();
        }
    );
}


/* ==========================================
   NEXT
========================================== */

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        () => {

            if (recordedBlob) {

                caption?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                return;
            }


            showCameraMessage(
                "Record your Find video first."
            );
        }
    );
}


/* ==========================================
   URL CLEANUP
========================================== */

function revokePlaybackUrl() {

    if (!recordedObjectUrl) {
        return;
    }


    try {

        URL.revokeObjectURL(
            recordedObjectUrl
        );

    }

    catch (error) {

        console.warn(
            "Unable to revoke playback URL:",
            error
        );
    }


    recordedObjectUrl = null;
}


/* ==========================================
   INITIALIZATION
========================================== */

async function initialize() {

    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    /*
     * Make the UI honest while the camera
     * is being initialized.
     */

    if (recordBtn) {
        recordBtn.disabled = true;
    }


    if (switchCameraBtn) {
        switchCameraBtn.disabled = true;
    }


    if (retakeBtn) {

        retakeBtn.style.display =
            "none";
    }


    if (uploadBtn) {

        uploadBtn.style.display =
            "none";
    }


    if (videoInfo) {

        videoInfo.style.display =
            "none";
    }


    showCameraMessage(
        "Preparing camera..."
    );


    await startCamera();
}


/* ==========================================
   DOM READY
========================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize,
        {
            once: true
        }
    );

}

else {

    initialize();
}


/* ==========================================
   VISIBILITY RECOVERY
========================================== */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState !==
            "visible"
        ) {
            return;
        }


        if (
            uploading ||
            recording ||
            recordedBlob
        ) {
            return;
        }


        /*
         * If the user changed browser
         * permissions while the page was
         * hidden, try the camera again.
         */

        if (!cameraReady) {

            await startCamera();
        }
    }
);


/* ==========================================
   PAGE CLEANUP
========================================== */

window.addEventListener(
    "beforeunload",
    () => {

        stopTimer();

        stopCamera();

        revokePlaybackUrl();
    }
);


/* ==========================================
   INITIAL BUTTON STATE
========================================== */

updateCameraButtons();