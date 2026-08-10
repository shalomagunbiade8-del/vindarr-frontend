/* ==========================================
   VINDARR — FIND DISCOVERY
   find.js
========================================== */

(() => {

    "use strict";


    /* ==========================================
       CONFIG
    ========================================== */

    const FIND_ENDPOINT =
        `${API_BASE_URL}/find`;

    const PAGE_SIZE = 15;

    const MAX_REPLY_SECONDS = 300;


    /* ==========================================
       STATE
    ========================================== */

    let currentPage = 1;

    let loading = false;

    let hasMore = true;

    let currentReplyFindId = null;

    let replyStream = null;

    let replyRecorder = null;

    let replyChunks = [];

    let replyBlob = null;

    let replyObjectUrl = null;

    let replyRecording = false;

    let replySeconds = 0;

    let replyTimer = null;

    let currentReplyCamera =
        "user";


    /* ==========================================
       ELEMENTS
    ========================================== */

    const findFeed =
        document.getElementById("findFeed");

    const loadingElement =
        document.getElementById("loading");

    const emptyState =
        document.getElementById("emptyState");

    const backBtn =
        document.getElementById("backBtn");

    const recordFindBtn =
        document.getElementById("recordFindBtn");

    const emptyRecordBtn =
        document.getElementById("emptyRecordBtn");


    /* ==========================================
       AUTH
    ========================================== */

    function getToken() {

        return localStorage.getItem("token");

    }


    function requireAuth() {

        const token =
            getToken();

        if (!token) {

            window.location.href =
                "login.html";

            return null;

        }

        return token;

    }


    /* ==========================================
       API REQUEST
    ========================================== */

    async function apiRequest(
        url,
        options = {}
    ) {

        const token =
            getToken();

        const headers =
            new Headers(
                options.headers || {}
            );

        if (token) {

            headers.set(
                "Authorization",
                `Bearer ${token}`
            );

        }

        const response =
            await fetch(
                url,
                {
                    ...options,
                    headers
                }
            );

        let data = null;

        try {

            data =
                await response.json();

        }

        catch {

            data = null;

        }

        if (!response.ok) {

            let message =
                "Something went wrong.";

            if (data?.message) {

                message =
                    Array.isArray(
                        data.message
                    )
                        ? data.message.join(", ")
                        : data.message;

            }

            throw new Error(message);

        }

        return data;

    }


    /* ==========================================
       ESCAPE HTML
    ========================================== */

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* ==========================================
       FORMAT TIME
    ========================================== */

    function formatTime(value) {

        const total =
            Number(value) || 0;

        const minutes =
            Math.floor(
                total / 60
            );

        const seconds =
            total % 60;

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );

    }


    /* ==========================================
       DATE
    ========================================== */

    function formatDate(dateValue) {

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

        const now =
            new Date();

        const difference =
            now.getTime() -
            date.getTime();

        const minute =
            60 * 1000;

        const hour =
            60 * minute;

        const day =
            24 * hour;

        if (
            difference >= 0 &&
            difference < minute
        ) {

            return "Just now";

        }

        if (
            difference >= minute &&
            difference < hour
        ) {

            return (
                `${Math.floor(
                    difference / minute
                )}m ago`
            );

        }

        if (
            difference >= hour &&
            difference < day
        ) {

            return (
                `${Math.floor(
                    difference / hour
                )}h ago`
            );

        }

        if (
            difference >= day &&
            difference < 7 * day
        ) {

            return (
                `${Math.floor(
                    difference / day
                )}d ago`
            );

        }

        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

    }


    /* ==========================================
       AVATAR
    ========================================== */

    function renderAvatar(
        username,
        avatar
    ) {

        if (avatar) {

            return `
                <img
                    class="find-avatar"
                    src="${escapeHtml(avatar)}"
                    alt="${escapeHtml(username || "User")}"
                    loading="lazy"
                >
            `;

        }

        const letter =
            (
                username ||
                "U"
            )
                .trim()
                .charAt(0)
                .toUpperCase();

        return `
            <div class="find-avatar find-avatar-placeholder">
                ${escapeHtml(letter)}
            </div>
        `;

    }


    /* ==========================================
       EMPTY STATE
    ========================================== */

    function showEmptyState() {

        if (emptyState) {

            emptyState.style.display =
                "flex";

        }

    }


    function hideEmptyState() {

        if (emptyState) {

            emptyState.style.display =
                "none";

        }

    }


    /* ==========================================
       LOADING
    ========================================== */

    function showLoading() {

        if (loadingElement) {

            loadingElement.style.display =
                "flex";

        }

    }


    function hideLoading() {

        if (loadingElement) {

            loadingElement.style.display =
                "none";

        }

    }


    /* ==========================================
       REPLY COUNT
    ========================================== */

    function getReplyCount(find) {

        if (
            Number.isFinite(
                Number(find?.replyCount)
            )
        ) {

            return Number(
                find.replyCount
            );

        }

        return Array.isArray(
            find?.replies
        )
            ? find.replies.length
            : 0;

    }


    /* ==========================================
       RENDER REPLY
    ========================================== */

    function renderReply(
        reply,
        findId
    ) {

        const token =
            getToken();

        const currentUserId =
            getCurrentUserId();

        const replyCreatorId =
            Number(
                reply?.creatorId
            );

        const canDelete =
            token &&
            currentUserId &&
            replyCreatorId ===
                currentUserId;

        return `
            <article
                class="find-reply"
                data-reply-id="${escapeHtml(reply.id)}"
            >

                <div class="reply-header">

                    <div class="reply-user">

                        ${renderAvatar(
                            reply.creatorUsername,
                            reply.creatorAvatar
                        )}

                        <div>

                            <strong>
                                ${escapeHtml(
                                    reply.creatorUsername ||
                                    "User"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    reply.createdAt
                                )}
                            </span>

                        </div>

                    </div>

                    ${
                        canDelete
                            ? `
                                <button
                                    class="reply-delete-btn"
                                    type="button"
                                    data-action="delete-reply"
                                    data-reply-id="${escapeHtml(reply.id)}"
                                >
                                    <i class="bi bi-trash3"></i>
                                </button>
                            `
                            : ""
                    }

                </div>


                <div class="reply-video-wrap">

                    <video
                        class="reply-video"
                        src="${escapeHtml(reply.videoUrl)}"
                        controls
                        playsinline
                        preload="metadata"
                    ></video>

                    ${
                        reply.duration
                            ? `
                                <span class="reply-duration">
                                    ${formatTime(reply.duration)}
                                </span>
                            `
                            : ""
                    }

                </div>

            </article>
        `;

    }


    /* ==========================================
       RENDER FIND
    ========================================== */

    function renderFind(find) {

        const token =
            getToken();

        const currentUserId =
            getCurrentUserId();

        const creatorId =
            Number(
                find?.creatorId
            );

        const canDelete =
            token &&
            currentUserId &&
            creatorId === currentUserId;

        const replies =
            Array.isArray(
                find?.replies
            )
                ? find.replies
                : [];

        const replyCount =
            getReplyCount(find);

        return `
            <article
                class="find-card"
                data-find-id="${escapeHtml(find.id)}"
            >

                <!-- ==========================
                     FIND HEADER
                =========================== -->

                <div class="find-card-header">

                    <div class="find-user">

                        ${renderAvatar(
                            find.creatorUsername,
                            find.creatorAvatar
                        )}

                        <div class="find-user-info">

                            <strong>
                                ${escapeHtml(
                                    find.creatorUsername ||
                                    "User"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    find.createdAt
                                )}
                            </span>

                        </div>

                    </div>


                    ${
                        canDelete
                            ? `
                                <button
                                    class="find-delete-btn"
                                    type="button"
                                    data-action="delete-find"
                                    data-find-id="${escapeHtml(find.id)}"
                                    aria-label="Delete Find"
                                >
                                    <i class="bi bi-three-dots"></i>
                                </button>
                            `
                            : ""
                    }

                </div>


                <!-- ==========================
                     FIND VIDEO
                =========================== -->

                <div class="find-video-wrap">

                    <video
                        class="find-video"
                        src="${escapeHtml(find.videoUrl)}"
                        controls
                        playsinline
                        preload="metadata"
                        data-action="view-find"
                        data-find-id="${escapeHtml(find.id)}"
                    ></video>

                    ${
                        find.duration
                            ? `
                                <span class="find-duration">
                                    ${formatTime(find.duration)}
                                </span>
                            `
                            : ""
                    }

                </div>


                <!-- ==========================
                     FIND INFORMATION
                =========================== -->

                <div class="find-content">

                    ${
                        find.caption
                            ? `
                                <p class="find-caption">
                                    ${escapeHtml(
                                        find.caption
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div class="find-meta">

                        ${
                            find.category
                                ? `
                                    <span class="find-tag">
                                        <i class="bi bi-tag"></i>
                                        ${escapeHtml(
                                            find.category
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            find.location
                                ? `
                                    <span class="find-tag">
                                        <i class="bi bi-geo-alt"></i>
                                        ${escapeHtml(
                                            find.location
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <!-- ==========================
                         ACTIONS
                    =========================== -->

                    <div class="find-actions">

                        <button
                            class="find-action reply-action"
                            type="button"
                            data-action="reply"
                            data-find-id="${escapeHtml(find.id)}"
                        >
                            <i class="bi bi-camera-video"></i>

                            <span>
                                Reply with video
                            </span>
                        </button>


                        <span class="find-reply-count">
                            <i class="bi bi-chat-video"></i>

                            ${replyCount}
                        </span>

                    </div>

                </div>


                <!-- ==========================
                     REPLIES
                =========================== -->

                <section
                    class="find-replies"
                    data-replies-for="${escapeHtml(find.id)}"
                >

                    ${
                        replies.length
                            ? `
                                <div class="replies-title">
                                    <span>
                                        Video replies
                                    </span>

                                    <strong>
                                        ${replies.length}
                                    </strong>
                                </div>

                                <div class="replies-list">
                                    ${replies
                                        .map(
                                            reply =>
                                                renderReply(
                                                    reply,
                                                    find.id
                                                )
                                        )
                                        .join("")}
                                </div>
                            `
                            : `
                                <div class="no-replies">
                                    No video replies yet.
                                    Be the first to help.
                                </div>
                            `
                    }

                </section>

            </article>
        `;

    }


    /* ==========================================
       GET CURRENT USER ID
    ========================================== */

    function getCurrentUserId() {

        const possibleKeys = [
            "user",
            "currentUser",
            "me"
        ];

        for (
            const key of possibleKeys
        ) {

            try {

                const stored =
                    localStorage.getItem(
                        key
                    );

                if (!stored) {
                    continue;
                }

                const user =
                    JSON.parse(
                        stored
                    );

                const id =
                    Number(
                        user?.id ||
                        user?.userId
                    );

                if (
                    Number.isFinite(id)
                ) {

                    return id;

                }

            }

            catch {}

        }

        return null;

    }


    /* ==========================================
       LOAD CURRENT USER ID FROM API
       ========================================== */

    let currentUserIdPromise = null;


    async function loadCurrentUserId() {

        const cached =
            getCurrentUserId();

        if (cached) {

            return cached;

        }

        if (
            !API_BASE_URL ||
            !getToken()
        ) {

            return null;

        }

        if (
            currentUserIdPromise
        ) {

            return currentUserIdPromise;

        }

        currentUserIdPromise =
            fetch(
                `${API_BASE_URL}/users/me`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }
            )
                .then(
                    response => {

                        if (
                            !response.ok
                        ) {

                            return null;

                        }

                        return response.json();

                    }
                )
                .then(
                    user => {

                        if (!user) {

                            return null;

                        }

                        const id =
                            Number(
                                user.id ||
                                user.userId
                            );

                        if (
                            Number.isFinite(id)
                        ) {

                            localStorage.setItem(
                                "currentUser",
                                JSON.stringify(
                                    user
                                )
                            );

                            return id;

                        }

                        return null;

                    }
                )
                .catch(
                    error => {

                        console.warn(
                            "Unable to load current user:",
                            error
                        );

                        return null;

                    }
                );

        return currentUserIdPromise;

    }


    /* ==========================================
       LOAD FINDS
    ========================================== */

    async function loadFinds(
        reset = false
    ) {

        if (loading) {
            return;
        }

        if (
            !reset &&
            !hasMore
        ) {

            return;

        }

        loading = true;

        if (reset) {

            currentPage = 1;

            hasMore = true;

            if (findFeed) {

                findFeed.innerHTML =
                    "";

            }

        }

        if (
            reset &&
            findFeed
        ) {

            showLoading();

        }

        try {

            await loadCurrentUserId();

            const url =
                `${FIND_ENDPOINT}` +
                `?page=${currentPage}` +
                `&limit=${PAGE_SIZE}`;

            const response =
                await apiRequest(
                    url
                );

            const data =
                Array.isArray(
                    response
                )
                    ? response
                    : response?.data || [];

            if (!data.length) {

                if (
                    reset &&
                    findFeed
                ) {

                    showEmptyState();

                }

                hasMore =
                    false;

                return;

            }

            hideEmptyState();

            if (findFeed) {

                findFeed.insertAdjacentHTML(
                    "beforeend",
                    data
                        .map(
                            find =>
                                renderFind(
                                    find
                                )
                        )
                        .join("")
                );

            }

            if (
                response &&
                typeof response === "object" &&
                "hasMore" in response
            ) {

                hasMore =
                    Boolean(
                        response.hasMore
                    );

            }

            else {

                hasMore =
                    data.length >=
                    PAGE_SIZE;

            }

            currentPage++;

        }

        catch (error) {

            console.error(
                "Vindarr Find feed error:",
                error
            );

            if (
                reset &&
                findFeed
            ) {

                findFeed.innerHTML = `
                    <div class="find-error">

                        <i class="bi bi-exclamation-circle"></i>

                        <h2>
                            Unable to load Finds
                        </h2>

                        <p>
                            ${escapeHtml(
                                error.message ||
                                "Please try again."
                            )}
                        </p>

                        <button
                            type="button"
                            id="retryFindBtn"
                        >
                            Try again
                        </button>

                    </div>
                `;

                document
                    .getElementById(
                        "retryFindBtn"
                    )
                    ?.addEventListener(
                        "click",
                        () => {
                            loadFinds(true);
                        }
                    );

            }

        }

        finally {

            loading = false;

            hideLoading();

        }

    }


    /* ==========================================
       LOAD MORE
    ========================================== */

    function createLoadMoreButton() {

        if (
            document.getElementById(
                "loadMoreFinds"
            )
        ) {

            return;

        }

        if (!findFeed) {
            return;
        }

        const button =
            document.createElement(
                "button"
            );

        button.id =
            "loadMoreFinds";

        button.className =
            "load-more-finds";

        button.type =
            "button";

        button.textContent =
            "Load more";

        button.addEventListener(
            "click",
            async () => {

                button.disabled =
                    true;

                button.textContent =
                    "Loading...";

                await loadFinds();

                button.remove();

                if (hasMore) {

                    createLoadMoreButton();

                }

            }
        );

        findFeed.parentNode?.appendChild(
            button
        );

    }


    /* ==========================================
       OBSERVER FOR PAGINATION
    ========================================== */

    function setupInfiniteScroll() {

        const sentinel =
            document.createElement(
                "div"
            );

        sentinel.id =
            "findFeedSentinel";

        sentinel.style.height =
            "1px";

        sentinel.style.width =
            "100%";

        document.body.appendChild(
            sentinel
        );

        const observer =
            new IntersectionObserver(
                entries => {

                    const entry =
                        entries[0];

                    if (
                        entry.isIntersecting &&
                        !loading &&
                        hasMore
                    ) {

                        loadFinds();

                    }

                },
                {
                    rootMargin:
                        "600px"
                }
            );

        observer.observe(
            sentinel
        );

    }


    /* ==========================================
       VIEW COUNT
    ========================================== */

    const viewedFinds =
        new Set();


    async function registerView(
        findId
    ) {

        if (
            viewedFinds.has(
                findId
            )
        ) {

            return;

        }

        viewedFinds.add(
            findId
        );

        try {

            await fetch(
                `${FIND_ENDPOINT}/${findId}/view`,
                {
                    method: "POST"
                }
            );

        }

        catch (error) {

            console.warn(
                "Find view count failed:",
                error
            );

        }

    }


    /* ==========================================
       REPLY MODAL
    ========================================== */

    function createReplyModal() {

        if (
            document.getElementById(
                "findReplyModal"
            )
        ) {

            return;

        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "findReplyModal";

        modal.className =
            "find-reply-modal";

        modal.innerHTML = `

            <div class="reply-modal-backdrop"></div>

            <div
                class="reply-modal-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="replyModalTitle"
            >

                <div class="reply-modal-header">

                    <h2 id="replyModalTitle">
                        Reply with a video
                    </h2>

                    <button
                        id="closeReplyModal"
                        type="button"
                        aria-label="Close"
                    >
                        <i class="bi bi-x-lg"></i>
                    </button>

                </div>


                <div class="reply-camera-stage">

                    <video
                        id="replyCamera"
                        autoplay
                        muted
                        playsinline
                    ></video>

                    <video
                        id="replyPlayback"
                        controls
                        playsinline
                    ></video>

                    <div
                        id="replyCameraMessage"
                        class="reply-camera-message"
                    >
                        Preparing camera...
                    </div>

                    <div
                        id="replyTimer"
                        class="reply-timer"
                    >
                        00:00
                    </div>

                </div>


                <div class="reply-camera-controls">

                    <button
                        id="switchReplyCamera"
                        type="button"
                    >
                        <i class="bi bi-arrow-repeat"></i>
                    </button>

                    <button
                        id="replyRecordBtn"
                        class="reply-record-btn"
                        type="button"
                    >
                        <span></span>
                    </button>

                    <button
                        id="retakeReplyBtn"
                        type="button"
                    >
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>

                </div>


                <button
                    id="sendReplyBtn"
                    class="send-reply-btn"
                    type="button"
                    disabled
                >
                    <i class="bi bi-send"></i>
                    Send video reply
                </button>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        document
            .getElementById(
                "closeReplyModal"
            )
            ?.addEventListener(
                "click",
                closeReplyModal
            );

        document
            .querySelector(
                "#findReplyModal .reply-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                closeReplyModal
            );

        document
            .getElementById(
                "replyRecordBtn"
            )
            ?.addEventListener(
                "click",
                toggleReplyRecording
            );

        document
            .getElementById(
                "retakeReplyBtn"
            )
            ?.addEventListener(
                "click",
                retakeReply
            );

        document
            .getElementById(
                "switchReplyCamera"
            )
            ?.addEventListener(
                "click",
                switchReplyCamera
            );

        document
            .getElementById(
                "sendReplyBtn"
            )
            ?.addEventListener(
                "click",
                sendVideoReply
            );

    }


    /* ==========================================
       OPEN REPLY MODAL
    ========================================== */

    async function openReplyModal(
        findId
    ) {

        const token =
            requireAuth();

        if (!token) {
            return;
        }

        createReplyModal();

        currentReplyFindId =
            Number(findId);

        clearReplyRecording();

        const modal =
            document.getElementById(
                "findReplyModal"
            );

        modal.classList.add(
            "open"
        );

        document.body.classList.add(
            "modal-open"
        );

        await startReplyCamera();

    }


    /* ==========================================
       CLOSE REPLY MODAL
    ========================================== */

    function closeReplyModal() {

        if (replyRecording) {

            stopReplyRecording();

        }

        stopReplyCamera();

        stopReplyTimer();

        clearReplyRecording();

        const modal =
            document.getElementById(
                "findReplyModal"
            );

        modal?.classList.remove(
            "open"
        );

        document.body.classList.remove(
            "modal-open"
        );

        currentReplyFindId =
            null;

    }


    /* ==========================================
       REPLY CAMERA MESSAGE
    ========================================== */

    function setReplyCameraMessage(
        message
    ) {

        const element =
            document.getElementById(
                "replyCameraMessage"
            );

        if (element) {

            element.textContent =
                message;

            element.style.display =
                "flex";

        }

    }


    function hideReplyCameraMessage() {

        const element =
            document.getElementById(
                "replyCameraMessage"
            );

        if (element) {

            element.style.display =
                "none";

        }

    }


    /* ==========================================
       REPLY CAMERA
    ========================================== */

    async function startReplyCamera() {

        const camera =
            document.getElementById(
                "replyCamera"
            );

        if (!camera) {
            return false;
        }

        try {

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                setReplyCameraMessage(
                    "Camera recording is not supported by this browser."
                );

                return false;

            }

            stopReplyCamera();

            setReplyCameraMessage(
                "Preparing camera..."
            );

            replyStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode:
                                currentReplyCamera,

                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        },

                        audio: true
                    }
                );

            camera.srcObject =
                replyStream;

            await camera.play().catch(
                () => {}
            );

            hideReplyCameraMessage();

            return true;

        }

        catch (error) {

            console.error(
                "Vindarr reply camera error:",
                error
            );

            let message =
                "Camera and microphone permission is required.";

            if (
                error.name ===
                "NotFoundError"
            ) {

                message =
                    "No camera or microphone was found.";

            }

            else if (
                error.name ===
                "NotReadableError"
            ) {

                message =
                    "Camera is already being used by another application.";

            }

            else if (
                error.name ===
                "NotAllowedError"
            ) {

                message =
                    "Please allow camera and microphone access.";

            }

            setReplyCameraMessage(
                message
            );

            return false;

        }

    }


    /* ==========================================
       STOP REPLY CAMERA
    ========================================== */

    function stopReplyCamera() {

        if (!replyStream) {
            return;
        }

        replyStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        replyStream =
            null;

        const camera =
            document.getElementById(
                "replyCamera"
            );

        if (camera) {

            camera.srcObject =
                null;

        }

    }


    /* ==========================================
       REPLY MIME TYPE
    ========================================== */

    function getReplyMimeType() {

        const types = [

            "video/webm;codecs=vp9,opus",

            "video/webm;codecs=vp8,opus",

            "video/webm"

        ];

        for (
            const type of types
        ) {

            if (
                typeof MediaRecorder !==
                    "undefined" &&
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
       START REPLY RECORDING
    ========================================== */

    function startReplyRecording() {

        if (!replyStream) {

            setReplyCameraMessage(
                "Camera is not ready."
            );

            return;

        }

        const mimeType =
            getReplyMimeType();

        if (!mimeType) {

            alert(
                "This browser does not support video recording."
            );

            return;

        }

        replyChunks = [];

        replyBlob = null;

        const camera =
            document.getElementById(
                "replyCamera"
            );

        const playback =
            document.getElementById(
                "replyPlayback"
            );

        const recordButton =
            document.getElementById(
                "replyRecordBtn"
            );

        try {

            replyRecorder =
                new MediaRecorder(
                    replyStream,
                    {
                        mimeType
                    }
                );

        }

        catch (error) {

            console.error(
                "Reply recorder error:",
                error
            );

            alert(
                "Unable to start recording."
            );

            return;

        }

        replyRecorder.ondataavailable =
            event => {

                if (
                    event.data &&
                    event.data.size
                ) {

                    replyChunks.push(
                        event.data
                    );

                }

            };

        replyRecorder.onerror =
            event => {

                console.error(
                    "Reply MediaRecorder error:",
                    event
                );

                replyRecording =
                    false;

                stopReplyTimer();

                recordButton?.classList.remove(
                    "recording"
                );

            };

        replyRecorder.onstop =
            () => {

                finishReplyRecording();

            };

        replyRecorder.start(
            1000
        );

        replyRecording =
            true;

        recordButton?.classList.add(
            "recording"
        );

        startReplyTimer();

        if (camera) {

            camera.style.display =
                "block";

        }

        if (playback) {

            playback.style.display =
                "none";

        }

    }


    /* ==========================================
       STOP REPLY RECORDING
    ========================================== */

    function stopReplyRecording() {

        if (!replyRecorder) {
            return;
        }

        if (
            replyRecorder.state ===
            "inactive"
        ) {

            return;

        }

        replyRecorder.stop();

        replyRecording =
            false;

        stopReplyTimer();

        document
            .getElementById(
                "replyRecordBtn"
            )
            ?.classList.remove(
                "recording"
            );

    }


    /* ==========================================
       FINISH REPLY RECORDING
    ========================================== */

    function finishReplyRecording() {

        const recorder =
            replyRecorder;

        const mimeType =
            recorder?.mimeType ||
            "video/webm";

        replyBlob =
            new Blob(
                replyChunks,
                {
                    type: mimeType
                }
            );

        if (!replyBlob.size) {

            replyBlob =
                null;

            alert(
                "No video was recorded."
            );

            return;

        }

        revokeReplyObjectUrl();

        replyObjectUrl =
            URL.createObjectURL(
                replyBlob
            );

        const camera =
            document.getElementById(
                "replyCamera"
            );

        const playback =
            document.getElementById(
                "replyPlayback"
            );

        const sendButton =
            document.getElementById(
                "sendReplyBtn"
            );

        if (camera) {

            camera.style.display =
                "none";

        }

        if (playback) {

            playback.src =
                replyObjectUrl;

            playback.style.display =
                "block";

            playback.load();

        }

        stopReplyCamera();

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }


    /* ==========================================
       TOGGLE REPLY RECORDING
    ========================================== */

    function toggleReplyRecording() {

        if (replyRecording) {

            stopReplyRecording();

        }

        else {

            startReplyRecording();

        }

    }


    /* ==========================================
       REPLY TIMER
    ========================================== */

    function startReplyTimer() {

        stopReplyTimer();

        replySeconds =
            0;

        const timerLabel =
            document.getElementById(
                "replyTimer"
            );

        if (timerLabel) {

            timerLabel.textContent =
                "00:00";

        }

        replyTimer =
            setInterval(
                () => {

                    replySeconds++;

                    if (timerLabel) {

                        timerLabel.textContent =
                            formatTime(
                                replySeconds
                            );

                    }

                    if (
                        replySeconds >=
                        MAX_REPLY_SECONDS
                    ) {

                        stopReplyRecording();

                    }

                },
                1000
            );

    }


    function stopReplyTimer() {

        if (replyTimer) {

            clearInterval(
                replyTimer
            );

        }

        replyTimer =
            null;

    }


    /* ==========================================
       RETAKE REPLY
    ========================================== */

    async function retakeReply() {

        if (replyRecording) {

            return;

        }

        clearReplyRecording();

        const playback =
            document.getElementById(
                "replyPlayback"
            );

        const camera =
            document.getElementById(
                "replyCamera"
            );

        if (playback) {

            playback.style.display =
                "none";

        }

        if (camera) {

            camera.style.display =
                "block";

        }

        await startReplyCamera();

    }


    /* ==========================================
       CLEAR REPLY RECORDING
    ========================================== */

    function clearReplyRecording() {

        replyBlob =
            null;

        replyChunks = [];

        stopReplyTimer();

        revokeReplyObjectUrl();

        if (
            replyRecorder &&
            replyRecorder.state !==
                "inactive"
        ) {

            try {

                replyRecorder.stop();

            }

            catch {}

        }

        replyRecorder =
            null;

        replyRecording =
            false;

        const playback =
            document.getElementById(
                "replyPlayback"
            );

        const sendButton =
            document.getElementById(
                "sendReplyBtn"
            );

        if (playback) {

            playback.pause();

            playback.removeAttribute(
                "src"
            );

            playback.load();

            playback.style.display =
                "none";

        }

        if (sendButton) {

            sendButton.disabled =
                true;

        }

        document
            .getElementById(
                "replyRecordBtn"
            )
            ?.classList.remove(
                "recording"
            );

    }


    /* ==========================================
       REPLY OBJECT URL
    ========================================== */

    function revokeReplyObjectUrl() {

        if (!replyObjectUrl) {
            return;
        }

        URL.revokeObjectURL(
            replyObjectUrl
        );

        replyObjectUrl =
            null;

    }


    /* ==========================================
       SWITCH REPLY CAMERA
    ========================================== */

    async function switchReplyCamera() {

        if (
            replyRecording ||
            !currentReplyFindId
        ) {

            return;

        }

        currentReplyCamera =
            currentReplyCamera ===
                "user"
                    ? "environment"
                    : "user";

        await startReplyCamera();

    }


    /* ==========================================
       SEND VIDEO REPLY
    ========================================== */

    async function sendVideoReply() {

        const token =
            requireAuth();

        if (!token) {
            return;
        }

        if (
            !currentReplyFindId
        ) {

            return;

        }

        if (!replyBlob) {

            alert(
                "Record a video reply first."
            );

            return;

        }

        const sendButton =
            document.getElementById(
                "sendReplyBtn"
            );

        if (sendButton) {

            sendButton.disabled =
                true;

            sendButton.innerHTML = `
                <i class="bi bi-arrow-repeat spin"></i>
                Sending...
            `;

        }

        try {

            const formData =
                new FormData();

            formData.append(
                "video",
                replyBlob,
                replyBlob.type.includes("mp4")
                    ? "find-reply.mp4"
                    : "find-reply.webm"
            );

            formData.append(
                "duration",
                String(
                    replySeconds
                )
            );

            const response =
                await fetch(
                    `${FIND_ENDPOINT}/${currentReplyFindId}/replies`,
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

            let data = null;

            try {

                data =
                    await response.json();

            }

            catch {}

            if (!response.ok) {

                const message =
                    Array.isArray(
                        data?.message
                    )
                        ? data.message.join(", ")
                        : (
                            data?.message ||
                            "Unable to send video reply."
                        );

                throw new Error(
                    message
                );

            }

            const findCard =
                document.querySelector(
                    `.find-card[data-find-id="${CSS.escape(
                        String(
                            currentReplyFindId
                        )
                    )}"]`
                );

            if (findCard) {

                await refreshFindCard(
                    currentReplyFindId
                );

            }

            alert(
                "Your video reply has been posted."
            );

            closeReplyModal();

        }

        catch (error) {

            console.error(
                "Find reply error:",
                error
            );

            alert(
                error.message ||
                "Unable to send video reply."
            );

            if (sendButton) {

                sendButton.disabled =
                    false;

                sendButton.innerHTML = `
                    <i class="bi bi-send"></i>
                    Send video reply
                `;

            }

        }

    }


    /* ==========================================
       REFRESH ONE FIND
    ========================================== */

    async function refreshFindCard(
        findId
    ) {

        try {

            const find =
                await apiRequest(
                    `${FIND_ENDPOINT}/${findId}`
                );

            const oldCard =
                document.querySelector(
                    `.find-card[data-find-id="${CSS.escape(
                        String(findId)
                    )}"]`
                );

            if (!oldCard) {

                return;

            }

            const temporary =
                document.createElement(
                    "div"
                );

            temporary.innerHTML =
                renderFind(
                    find
                );

            const newCard =
                temporary.firstElementChild;

            if (newCard) {

                oldCard.replaceWith(
                    newCard
                );

            }

        }

        catch (error) {

            console.warn(
                "Could not refresh Find:",
                error
            );

        }

    }


    /* ==========================================
       DELETE FIND
    ========================================== */

    async function deleteFind(
        findId
    ) {

        const token =
            requireAuth();

        if (!token) {
            return;
        }

        const confirmed =
            confirm(
                "Delete this Find? This cannot be undone."
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiRequest(
                `${FIND_ENDPOINT}/${findId}`,
                {
                    method: "DELETE"
                }
            );

            const card =
                document.querySelector(
                    `.find-card[data-find-id="${CSS.escape(
                        String(findId)
                    )}"]`
                );

            card?.remove();

            if (
                findFeed &&
                !findFeed.querySelector(
                    ".find-card"
                )
            ) {

                showEmptyState();

            }

        }

        catch (error) {

            console.error(
                "Delete Find error:",
                error
            );

            alert(
                error.message ||
                "Unable to delete Find."
            );

        }

    }


    /* ==========================================
       DELETE REPLY
    ========================================== */

    async function deleteReply(
        replyId
    ) {

        const token =
            requireAuth();

        if (!token) {
            return;
        }

        const confirmed =
            confirm(
                "Delete this video reply?"
            );

        if (!confirmed) {
            return;

        }

        try {

            await apiRequest(
                `${FIND_ENDPOINT}/replies/${replyId}`,
                {
                    method: "DELETE"
                }
            );

            const reply =
                document.querySelector(
                    `.find-reply[data-reply-id="${CSS.escape(
                        String(replyId)
                    )}"]`
                );

            const card =
                reply?.closest(
                    ".find-card"
                );

            const findId =
                card?.dataset.findId;

            reply?.remove();

            if (findId) {

                await refreshFindCard(
                    findId
                );

            }

        }

        catch (error) {

            console.error(
                "Delete reply error:",
                error
            );

            alert(
                error.message ||
                "Unable to delete reply."
            );

        }

    }


    /* ==========================================
       EVENT DELEGATION
    ========================================== */

    if (findFeed) {

        findFeed.addEventListener(
            "click",
            event => {

                const target =
                    event.target.closest(
                        "[data-action]"
                    );

                if (!target) {
                    return;
                }

                const action =
                    target.dataset.action;

                if (
                    action ===
                    "reply"
                ) {

                    const findId =
                        target.dataset.findId;

                    if (findId) {

                        openReplyModal(
                            findId
                        );

                    }

                    return;

                }


                if (
                    action ===
                    "delete-find"
                ) {

                    const findId =
                        target.dataset.findId;

                    if (findId) {

                        deleteFind(
                            findId
                        );

                    }

                    return;

                }


                if (
                    action ===
                    "delete-reply"
                ) {

                    const replyId =
                        target.dataset.replyId;

                    if (replyId) {

                        deleteReply(
                            replyId
                        );

                    }

                    return;

                }

            }
        );


        findFeed.addEventListener(
            "play",
            event => {

                const video =
                    event.target;

                if (
                    !video.matches(
                        ".find-video"
                    )
                ) {

                    return;

                }

                const findId =
                    video.dataset.findId;

                if (findId) {

                    registerView(
                        findId
                    );

                }

            },
            true
        );

    }


    /* ==========================================
       NAVIGATION
    ========================================== */

    function goToRecordFind() {

        window.location.href =
            "record-search.html";

    }


    recordFindBtn?.addEventListener(
        "click",
        goToRecordFind
    );


    emptyRecordBtn?.addEventListener(
        "click",
        goToRecordFind
    );


    backBtn?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );


    /* ==========================================
       INITIALIZE
    ========================================== */

    async function initialize() {

        if (!API_BASE_URL) {

            console.error(
                "API_BASE_URL is not defined."
            );

            if (loadingElement) {

                loadingElement.textContent =
                    "API configuration is missing.";

            }

            return;

        }

        await loadFinds(
            true
        );

        setupInfiniteScroll();

    }


    /* ==========================================
       CLEANUP
    ========================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            stopReplyTimer();

            stopReplyCamera();

            revokeReplyObjectUrl();

        }
    );


    /* ==========================================
       START
    ========================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    }

    else {

        initialize();

    }

})();