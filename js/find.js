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

    const MAX_REPLY_SECONDS = 300;


    /* ==========================================
       STATE
    ========================================== */

    let finds = [];

    let currentTab = "recent";

    let searchTerm = "";

    let loading = false;

    let currentUser = null;

    let currentReplyFind = null;

    let replyStream = null;

    let replyRecorder = null;

    let replyChunks = [];

    let replyBlob = null;

    let replyObjectUrl = null;

    let replyRecording = false;

    let replyUsingFrontCamera = true;

    let replySeconds = 0;

    let replyTimer = null;

    let sendingReply = false;


    /* ==========================================
       ELEMENTS
    ========================================== */

    const backBtn =
        document.getElementById("backBtn");

    const recordFindBtn =
        document.getElementById("recordFindBtn");

    const emptyRecordBtn =
        document.getElementById("emptyRecordBtn");

    const findSearch =
        document.getElementById("findSearch");

    const clearSearchBtn =
        document.getElementById("clearSearchBtn");

    const findTabs =
        document.querySelectorAll(".find-tab");

    const loadingBox =
        document.getElementById("loading");

    const errorState =
        document.getElementById("errorState");

    const errorText =
        document.getElementById("errorText");

    const retryBtn =
        document.getElementById("retryBtn");

    const findFeed =
        document.getElementById("findFeed");

    const emptyState =
        document.getElementById("emptyState");

    const emptyTitle =
        document.getElementById("emptyTitle");

    const emptyText =
        document.getElementById("emptyText");


    /* ==========================================
       REPLY MODAL ELEMENTS
    ========================================== */

    const replyModal =
        document.getElementById("replyModal");

    const closeReplyModalBtn =
        document.getElementById(
            "closeReplyModalBtn"
        );

    const cancelReplyBtn =
        document.getElementById(
            "cancelReplyBtn"
        );

    const replyTargetVideo =
        document.getElementById(
            "replyTargetVideo"
        );

    const replyTargetCaption =
        document.getElementById(
            "replyTargetCaption"
        );

    const replyCamera =
        document.getElementById(
            "replyCamera"
        );

    const replyPlayback =
        document.getElementById(
            "replyPlayback"
        );

    const replyCameraMessage =
        document.getElementById(
            "replyCameraMessage"
        );

    const replyTimerLabel =
        document.getElementById(
            "replyTimer"
        );

    const replySwitchCameraBtn =
        document.getElementById(
            "replySwitchCameraBtn"
        );

    const replyRecordBtn =
        document.getElementById(
            "replyRecordBtn"
        );

    const replyRetakeBtn =
        document.getElementById(
            "replyRetakeBtn"
        );

    const replyRecordingInfo =
        document.getElementById(
            "replyRecordingInfo"
        );

    const sendReplyBtn =
        document.getElementById(
            "sendReplyBtn"
        );

    const replyUploadStatus =
        document.getElementById(
            "replyUploadStatus"
        );

    const replyUploadText =
        document.getElementById(
            "replyUploadText"
        );


    /* ==========================================
       AUTH
    ========================================== */

    function getToken() {

        return localStorage.getItem("token");

    }


    function requireLogin() {

        if (!getToken()) {

            window.location.href =
                "login.html";

            return false;

        }

        return true;

    }


    /* ==========================================
       ESCAPE HTML
    ========================================== */

    function escapeHtml(value) {

        return String(
            value ?? ""
        )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    /* ==========================================
       TIME
    ========================================== */

    function timeAgo(dateValue) {

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

        const seconds =
            Math.floor(
                (
                    Date.now() -
                    date.getTime()
                ) / 1000
            );

        if (seconds < 60) {
            return "just now";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        if (minutes < 60) {
            return `${minutes}m`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {
            return `${hours}h`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 7) {
            return `${days}d`;
        }

        return date.toLocaleDateString();

    }


    /* ==========================================
       AVATAR
    ========================================== */

    function avatarHtml(
        avatar,
        username,
        className
    ) {

        const safeName =
            escapeHtml(
                username || "User"
            );

        if (avatar) {

            return `
                <div class="${className}">
                    <img
                        src="${escapeHtml(avatar)}"
                        alt=""
                        loading="lazy"
                    >
                </div>
            `;

        }

        return `
            <div class="${className}">
                ${safeName
                    .charAt(0)
                    .toUpperCase()}
            </div>
        `;

    }


    /* ==========================================
       CURRENT USER
    ========================================== */

    async function loadCurrentUser() {

        const token =
            getToken();

        if (!token) {
            return null;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/users/me`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                return null;
            }

            currentUser =
                await response.json();

            return currentUser;

        }

        catch (error) {

            console.warn(
                "Unable to load current user:",
                error
            );

            return null;

        }

    }


    /* ==========================================
       API
    ========================================== */

    async function apiFetch(
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
                    headers,
                }
            );

        let data = null;

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        }

        else {

            const text =
                await response.text();

            data =
                text || null;

        }

        if (!response.ok) {

            const message =
                Array.isArray(
                    data?.message
                )
                    ? data.message.join(", ")
                    : data?.message ||
                      "Request failed.";

            throw new Error(
                message
            );

        }

        return data;

    }


    /* ==========================================
       LOAD FINDS
    ========================================== */

    async function loadFinds() {

        if (loading) {
            return;
        }

        loading = true;

        showLoading();

        hideError();

        try {

            const response =
                await apiFetch(
                    `${FIND_ENDPOINT}?page=1&limit=50`
                );

            if (
                Array.isArray(response)
            ) {

                finds = response;

            }

            else if (
                Array.isArray(
                    response?.data
                )
            ) {

                finds =
                    response.data;

            }

            else {

                finds = [];

            }

            renderFeed();

        }

        catch (error) {

            console.error(
                "Find feed error:",
                error
            );

            showError(
                error.message
            );

        }

        finally {

            loading = false;

            hideLoading();

        }

    }


    /* ==========================================
       FILTER
    ========================================== */

    function getFilteredFinds() {

        let result =
            [...finds];

        if (
            currentTab === "mine"
        ) {

            const currentUserId =
                Number(
                    currentUser?.id ??
                    currentUser?.userId
                );

            if (
                Number.isFinite(
                    currentUserId
                )
            ) {

                result =
                    result.filter(
                        find =>
                            Number(
                                find.creatorId
                            ) ===
                            currentUserId
                    );

            }

            else {

                result = [];

            }

        }


        if (
            currentTab === "unanswered"
        ) {

            result =
                result.filter(
                    find =>
                        Number(
                            find.replyCount || 0
                        ) === 0
                );

        }


        if (searchTerm) {

            const query =
                searchTerm
                    .toLowerCase()
                    .trim();

            result =
                result.filter(
                    find => {

                        const text = [

                            find.caption,

                            find.category,

                            find.location,

                            find.creatorUsername,

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                        return text.includes(
                            query
                        );

                    }
                );

        }

        return result;

    }


    /* ==========================================
       RENDER FEED
    ========================================== */

    function renderFeed() {

        const filtered =
            getFilteredFinds();

        findFeed.innerHTML = "";

        if (!filtered.length) {

            showEmpty();

            return;

        }

        hideEmpty();

        filtered.forEach(
            find => {

                findFeed.insertAdjacentHTML(
                    "beforeend",
                    renderFindCard(find)
                );

            }
        );

    }


    /* ==========================================
       RENDER FIND CARD
    ========================================== */

    function renderFindCard(find) {

        const replies =
            Array.isArray(
                find.replies
            )
                ? find.replies
                : [];

        const username =
            find.creatorUsername ||
            "User";

        const creatorId =
            Number(
                find.creatorId
            );

        const currentUserId =
            Number(
                currentUser?.id ??
                currentUser?.userId
            );

        const isOwner =
            Number.isFinite(
                currentUserId
            ) &&
            creatorId === currentUserId;

        return `
            <article
                class="find-card"
                data-find-id="${find.id}"
            >

                <div class="find-card-top">

                    <div class="creator">

                        ${avatarHtml(
                            find.creatorAvatar,
                            username,
                            "creator-avatar"
                        )}

                        <div class="creator-details">

                            <div class="creator-name">
                                ${escapeHtml(username)}
                            </div>

                            <div class="find-meta">

                                <span class="category-badge">
                                    ${escapeHtml(
                                        find.category ||
                                        "Other"
                                    )}
                                </span>

                                <span>•</span>

                                <span>
                                    ${timeAgo(
                                        find.createdAt
                                    )}
                                </span>

                            </div>

                        </div>

                    </div>


                    <div class="find-menu-wrap">

                        <button
                            class="find-menu-btn"
                            type="button"
                            data-action="menu"
                            data-id="${find.id}"
                            aria-label="Find options"
                        >
                            <i class="bi bi-three-dots"></i>
                        </button>

                        <div
                            class="find-menu"
                            data-menu-for="${find.id}"
                        >

                            ${
                                isOwner
                                    ? `
                                        <button
                                            type="button"
                                            class="delete-btn"
                                            data-action="delete-find"
                                            data-id="${find.id}"
                                        >
                                            <i class="bi bi-trash3"></i>
                                            Delete Find
                                        </button>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            data-action="copy-link"
                                            data-id="${find.id}"
                                        >
                                            <i class="bi bi-link-45deg"></i>
                                            Copy link
                                        </button>
                                    `
                            }

                        </div>

                    </div>

                </div>


                <div class="find-video-wrap">

                    <video
                        class="find-video"
                        src="${escapeHtml(find.videoUrl)}"
                        controls
                        playsinline
                        preload="metadata"
                    ></video>

                    <div class="video-gradient"></div>

                    ${
                        find.location
                            ? `
                                <div class="video-location">
                                    <i class="bi bi-geo-alt"></i>
                                    ${escapeHtml(
                                        find.location
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="find-content">

                    <p class="find-caption">
                        ${escapeHtml(
                            find.caption
                        )}
                    </p>

                </div>


                <div class="find-actions">

                    <button
                        class="action-btn reply-btn"
                        type="button"
                        data-action="reply"
                        data-id="${find.id}"
                    >
                        <i class="bi bi-camera-video"></i>
                        Reply with video
                    </button>

                    <span class="action-spacer"></span>

                    <span class="reply-count">
                        ${
                            Number(
                                find.replyCount || 0
                            )
                        }
                        ${
                            Number(
                                find.replyCount || 0
                            ) === 1
                                ? "reply"
                                : "replies"
                        }
                    </span>

                </div>


                ${
                    replies.length
                        ? renderReplies(
                            replies
                        )
                        : ""
                }

            </article>
        `;

    }


    /* ==========================================
       RENDER REPLIES
    ========================================== */

    function renderReplies(
        replies
    ) {

        return `
            <section class="replies-section">

                <div class="replies-header">

                    <span>
                        VIDEO ANSWERS
                    </span>

                    <span>
                        ${replies.length}
                    </span>

                </div>

                <div class="replies-list">

                    ${
                        replies
                            .map(
                                reply =>
                                    renderReplyCard(
                                        reply
                                    )
                            )
                            .join("")
                    }

                </div>

            </section>
        `;

    }


    /* ==========================================
       RENDER REPLY
    ========================================== */

    function renderReplyCard(
        reply
    ) {

        const currentUserId =
            Number(
                currentUser?.id ??
                currentUser?.userId
            );

        const isOwner =
            Number.isFinite(
                currentUserId
            ) &&
            Number(
                reply.creatorId
            ) ===
            currentUserId;

        return `
            <article
                class="reply-card"
                data-reply-id="${reply.id}"
            >

                <div class="reply-card-header">

                    ${avatarHtml(
                        reply.creatorAvatar,
                        reply.creatorUsername,
                        "reply-avatar"
                    )}

                    <span class="reply-name">
                        ${escapeHtml(
                            reply.creatorUsername ||
                            "User"
                        )}
                    </span>

                    <span class="reply-time">
                        ${timeAgo(
                            reply.createdAt
                        )}
                    </span>

                </div>

                <video
                    class="reply-video"
                    src="${escapeHtml(
                        reply.videoUrl
                    )}"
                    controls
                    playsinline
                    preload="metadata"
                ></video>

                ${
                    isOwner
                        ? `
                            <div class="reply-actions">

                                <button
                                    class="reply-delete"
                                    type="button"
                                    data-action="delete-reply"
                                    data-id="${reply.id}"
                                >
                                    <i class="bi bi-trash3"></i>
                                    Delete reply
                                </button>

                            </div>
                        `
                        : ""
                }

            </article>
        `;

    }


    /* ==========================================
       UI STATES
    ========================================== */

    function showLoading() {

        loadingBox.style.display =
            "flex";

        findFeed.style.display =
            "none";

        emptyState.style.display =
            "none";

    }


    function hideLoading() {

        loadingBox.style.display =
            "none";

        findFeed.style.display =
            "flex";

    }


    function showEmpty() {

        emptyState.style.display =
            "block";

        findFeed.style.display =
            "none";

        if (
            currentTab === "mine"
        ) {

            emptyTitle.textContent =
                "No Finds yet";

            emptyText.textContent =
                "You have not recorded a Find yet.";

        }

        else if (
            currentTab === "unanswered"
        ) {

            emptyTitle.textContent =
                "All Finds have replies";

            emptyText.textContent =
                "There are currently no unanswered Finds.";

        }

        else if (searchTerm) {

            emptyTitle.textContent =
                "No results";

            emptyText.textContent =
                "Try another search term.";

        }

        else {

            emptyTitle.textContent =
                "Nothing here yet";

            emptyText.textContent =
                "Be the first person to record something you want the Vindarr community to help find.";

        }

    }


    function hideEmpty() {

        emptyState.style.display =
            "none";

    }


    function showError(
        message
    ) {

        errorState.style.display =
            "flex";

        errorText.textContent =
            message ||
            "Something went wrong.";

        findFeed.style.display =
            "none";

        emptyState.style.display =
            "none";

    }


    function hideError() {

        errorState.style.display =
            "none";

    }


    /* ==========================================
       NAVIGATION
    ========================================== */

    function openRecordPage() {

        window.location.href =
            "record-search.html";

    }


    recordFindBtn?.addEventListener(
        "click",
        openRecordPage
    );

    emptyRecordBtn?.addEventListener(
        "click",
        openRecordPage
    );


    backBtn?.addEventListener(
        "click",
        () => {

            window.history.back();

        }
    );


    /* ==========================================
       TABS
    ========================================== */

    findTabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    findTabs.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                    tab.classList.add(
                        "active"
                    );

                    currentTab =
                        tab.dataset.tab ||
                        "recent";

                    renderFeed();

                }
            );

        }
    );


    /* ==========================================
       SEARCH
    ========================================== */

    findSearch?.addEventListener(
        "input",
        () => {

            searchTerm =
                findSearch.value.trim();

            clearSearchBtn?.classList.toggle(
                "visible",
                Boolean(searchTerm)
            );

            renderFeed();

        }
    );


    clearSearchBtn?.addEventListener(
        "click",
        () => {

            findSearch.value = "";

            searchTerm = "";

            clearSearchBtn.classList.remove(
                "visible"
            );

            renderFeed();

            findSearch.focus();

        }
    );


    /* ==========================================
       RETRY
    ========================================== */

    retryBtn?.addEventListener(
        "click",
        loadFinds
    );


    /* ==========================================
       MENU
    ========================================== */

    document.addEventListener(
        "click",
        event => {

            const menuButton =
                event.target.closest(
                    '[data-action="menu"]'
                );

            if (menuButton) {

                event.stopPropagation();

                const id =
                    menuButton.dataset.id;

                document
                    .querySelectorAll(
                        ".find-menu.open"
                    )
                    .forEach(
                        menu =>
                            menu.classList.remove(
                                "open"
                            )
                    );

                document
                    .querySelector(
                        `[data-menu-for="${id}"]`
                    )
                    ?.classList.toggle(
                        "open"
                    );

                return;

            }


            if (
                !event.target.closest(
                    ".find-menu"
                )
            ) {

                document
                    .querySelectorAll(
                        ".find-menu.open"
                    )
                    .forEach(
                        menu =>
                            menu.classList.remove(
                                "open"
                            )
                    );

            }

        }
    );


    /* ==========================================
       CARD ACTIONS
    ========================================== */

    findFeed.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );

            if (!button) {
                return;
            }

            const action =
                button.dataset.action;

            const id =
                Number(
                    button.dataset.id
                );

            if (!Number.isFinite(id)) {
                return;
            }


            /* DELETE FIND */

            if (
                action ===
                "delete-find"
            ) {

                await deleteFind(id);

                return;

            }


            /* DELETE REPLY */

            if (
                action ===
                "delete-reply"
            ) {

                await deleteReply(
                    id
                );

                return;

            }


            /* COPY LINK */

            if (
                action ===
                "copy-link"
            ) {

                copyFindLink(id);

                return;

            }


            /* REPLY */

            if (
                action ===
                "reply"
            ) {

                const find =
                    finds.find(
                        item =>
                            Number(
                                item.id
                            ) === id
                    );

                if (find) {

                    openReplyModal(
                        find
                    );

                }

            }

        }
    );


    /* ==========================================
       DELETE FIND
    ========================================== */

    async function deleteFind(
        id
    ) {

        if (!requireLogin()) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this Find and all of its video replies?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiFetch(
                `${FIND_ENDPOINT}/${id}`,
                {
                    method: "DELETE",
                }
            );

            finds =
                finds.filter(
                    find =>
                        Number(
                            find.id
                        ) !== id
                );

            renderFeed();

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

        if (!requireLogin()) {
            return;
        }

        const confirmed =
            window.confirm(
                "Delete this video reply?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await apiFetch(
                `${FIND_ENDPOINT}/replies/${replyId}`,
                {
                    method: "DELETE",
                }
            );

            finds =
                finds.map(
                    find => {

                        if (
                            !Array.isArray(
                                find.replies
                            )
                        ) {
                            return find;
                        }

                        const existed =
                            find.replies.some(
                                reply =>
                                    Number(
                                        reply.id
                                    ) === replyId
                            );

                        if (!existed) {
                            return find;
                        }

                        return {
                            ...find,

                            replies:
                                find.replies.filter(
                                    reply =>
                                        Number(
                                            reply.id
                                        ) !==
                                        replyId
                                ),

                            replyCount:
                                Math.max(
                                    0,
                                    Number(
                                        find.replyCount ||
                                        0
                                    ) - 1
                                ),

                        };

                    }
                );

            renderFeed();

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
       COPY LINK
    ========================================== */

    async function copyFindLink(
        id
    ) {

        const url =
            `${window.location.origin}${window.location.pathname}?find=${id}`;

        try {

            await navigator.clipboard.writeText(
                url
            );

            alert(
                "Find link copied."
            );

        }

        catch {

            window.prompt(
                "Copy this Find link:",
                url
            );

        }

    }


    /* ==========================================
       REPLY MODAL
    ========================================== */

    async function openReplyModal(
        find
    ) {

        if (!requireLogin()) {
            return;
        }

        currentReplyFind =
            find;

        replyBlob = null;

        replyChunks = [];

        revokeReplyObjectUrl();

        replyPlayback.pause();

        replyPlayback.removeAttribute(
            "src"
        );

        replyPlayback.load();

        replyPlayback.style.display =
            "none";

        replyCamera.style.display =
            "block";

        replyTargetVideo.src =
            find.videoUrl;

        replyTargetVideo.load();

        replyTargetCaption.textContent =
            find.caption ||
            "";

        replyRecordingInfo.textContent =
            "Record a video answer. You can review it before sending.";

        replyUploadStatus.style.display =
            "none";

        replyRecordBtn.disabled =
            false;

        replyRetakeBtn.disabled =
            false;

        replySwitchCameraBtn.disabled =
            false;

        sendReplyBtn.disabled =
            true;

        resetReplyTimer();

        replyModal.classList.add(
            "open"
        );

        replyModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        await startReplyCamera();

    }


    /* ==========================================
       CLOSE MODAL
    ========================================== */

    async function closeReplyModal() {

        if (sendingReply) {
            return;
        }

        if (replyRecording) {

            stopReplyRecording();

        }

        stopReplyCamera();

        replyModal.classList.remove(
            "open"
        );

        replyModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        currentReplyFind =
            null;

        replyBlob = null;

        replyChunks = [];

        revokeReplyObjectUrl();

        replyTargetVideo.pause();

        replyTargetVideo.removeAttribute(
            "src"
        );

        replyTargetVideo.load();

    }


    closeReplyModalBtn?.addEventListener(
        "click",
        closeReplyModal
    );

    cancelReplyBtn?.addEventListener(
        "click",
        closeReplyModal
    );

    document
        .querySelector(
            ".modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeReplyModal
        );


    /* ==========================================
       REPLY CAMERA MESSAGE
    ========================================== */

    function showReplyCameraMessage(
        message
    ) {

        replyCameraMessage.style.display =
            "flex";

        const span =
            replyCameraMessage.querySelector(
                "span"
            );

        if (span) {
            span.textContent =
                message;
        }

    }


    function hideReplyCameraMessage() {

        replyCameraMessage.style.display =
            "none";

    }


    /* ==========================================
       REPLY CAMERA
    ========================================== */

    async function startReplyCamera() {

        try {

            stopReplyCamera();

            showReplyCameraMessage(
                "Preparing camera..."
            );

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                showReplyCameraMessage(
                    "Camera access is not supported by this browser."
                );

                return false;

            }

            replyStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        facingMode:
                            replyUsingFrontCamera
                                ? "user"
                                : "environment",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: true,

                });

            replyCamera.srcObject =
                replyStream;

            replyCamera.style.display =
                "block";

            await replyCamera.play()
                .catch(
                    () => {}
                );

            hideReplyCameraMessage();

            return true;

        }

        catch (error) {

            console.error(
                "Reply camera error:",
                error
            );

            showReplyCameraMessage(
                "Camera and microphone permission is required to reply with a video."
            );

            return false;

        }

    }


    function stopReplyCamera() {

        if (!replyStream) {
            return;
        }

        replyStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

        replyStream = null;

        replyCamera.srcObject =
            null;

    }


    /* ==========================================
       REPLY CAMERA SWITCH
    ========================================== */

    replySwitchCameraBtn?.addEventListener(
        "click",
        async () => {

            if (
                replyRecording ||
                sendingReply
            ) {
                return;
            }

            replyUsingFrontCamera =
                !replyUsingFrontCamera;

            await startReplyCamera();

        }
    );


    /* ==========================================
       REPLY MIME
    ========================================== */

    function getReplyMimeType() {

        const types = [

            "video/webm;codecs=vp9,opus",

            "video/webm;codecs=vp8,opus",

            "video/webm",

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
       REPLY TIMER
    ========================================== */

    function formatReplyTime(
        value
    ) {

        const minutes =
            String(
                Math.floor(
                    value / 60
                )
            ).padStart(
                2,
                "0"
            );

        const seconds =
            String(
                value % 60
            ).padStart(
                2,
                "0"
            );

        return `${minutes}:${seconds}`;

    }


    function resetReplyTimer() {

        if (replyTimer) {

            clearInterval(
                replyTimer
            );

        }

        replyTimer = null;

        replySeconds = 0;

        replyTimerLabel.textContent =
            "00:00";

    }


    function startReplyTimer() {

        resetReplyTimer();

        replyTimer =
            setInterval(
                () => {

                    replySeconds++;

                    replyTimerLabel.textContent =
                        formatReplyTime(
                            replySeconds
                        );

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


    /* ==========================================
       START REPLY RECORDING
    ========================================== */

    function startReplyRecording() {

        if (!replyStream) {

            showReplyCameraMessage(
                "Camera is not ready. Please allow camera and microphone access."
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

        replyRecorder =
            new MediaRecorder(
                replyStream,
                {
                    mimeType,
                }
            );

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
            error => {

                console.error(
                    "Reply recorder error:",
                    error
                );

                stopReplyTimer();

                replyRecording = false;

                replyRecordBtn.classList.remove(
                    "recording"
                );

            };

        replyRecorder.onstop =
            finishReplyRecording;

        replyRecorder.start(
            1000
        );

        replyRecording = true;

        replyRecordBtn.classList.add(
            "recording"
        );

        replyRecordBtn.setAttribute(
            "aria-label",
            "Stop recording reply"
        );

        replySwitchCameraBtn.disabled =
            true;

        startReplyTimer();

        replyRecordingInfo.textContent =
            "Recording your video answer...";

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

        replyRecording = false;

        replyRecordBtn.classList.remove(
            "recording"
        );

        replyRecordBtn.setAttribute(
            "aria-label",
            "Start recording reply"
        );

        replySwitchCameraBtn.disabled =
            false;

        resetReplyTimer();

    }


    /* ==========================================
       FINISH REPLY
    ========================================== */

    function finishReplyRecording() {

        const mimeType =
            replyRecorder?.mimeType ||
            "video/webm";

        replyBlob =
            new Blob(
                replyChunks,
                {
                    type: mimeType,
                }
            );

        if (!replyBlob.size) {

            replyBlob = null;

            alert(
                "No reply video was recorded."
            );

            return;

        }

        revokeReplyObjectUrl();

        replyObjectUrl =
            URL.createObjectURL(
                replyBlob
            );

        replyPlayback.src =
            replyObjectUrl;

        replyPlayback.style.display =
            "block";

        replyCamera.style.display =
            "none";

        replyPlayback.load();

        stopReplyCamera();

        sendReplyBtn.disabled =
            false;

        replyRetakeBtn.disabled =
            false;

        replyRecordingInfo.textContent =
            "Preview your answer. If you are happy with it, send the reply.";

    }


    /* ==========================================
       REPLY RECORD BUTTON
    ========================================== */

    replyRecordBtn?.addEventListener(
        "click",
        () => {

            if (sendingReply) {
                return;
            }

            if (!replyRecording) {

                startReplyRecording();

            }

            else {

                stopReplyRecording();

            }

        }
    );


    /* ==========================================
       RETAKE REPLY
    ========================================== */

    replyRetakeBtn?.addEventListener(
        "click",
        async () => {

            if (
                replyRecording ||
                sendingReply
            ) {
                return;
            }

            replyBlob = null;

            replyChunks = [];

            sendReplyBtn.disabled =
                true;

            replyPlayback.pause();

            replyPlayback.removeAttribute(
                "src"
            );

            replyPlayback.load();

            replyPlayback.style.display =
                "none";

            replyCamera.style.display =
                "block";

            replyRecordingInfo.textContent =
                "Record a new video answer.";

            revokeReplyObjectUrl();

            await startReplyCamera();

        }
    );


    /* ==========================================
       SEND REPLY
    ========================================== */

    sendReplyBtn?.addEventListener(
        "click",
        async () => {

            if (
                sendingReply ||
                !replyBlob ||
                !currentReplyFind
            ) {
                return;
            }

            if (!requireLogin()) {
                return;
            }

            sendingReply = true;

            sendReplyBtn.disabled =
                true;

            replyRecordBtn.disabled =
                true;

            replyRetakeBtn.disabled =
                true;

            replySwitchCameraBtn.disabled =
                true;

            replyUploadStatus.style.display =
                "flex";

            replyUploadText.textContent =
                "Uploading reply...";

            try {

                const formData =
                    new FormData();

                formData.append(
                    "video",
                    replyBlob,
                    replyBlob.type.includes(
                        "mp4"
                    )
                        ? "find-reply.mp4"
                        : "find-reply.webm"
                );

                formData.append(
                    "duration",
                    String(
                        replySeconds || 0
                    )
                );

                const createdReply =
                    await apiFetch(
                        `${FIND_ENDPOINT}/${currentReplyFind.id}/replies`,
                        {
                            method: "POST",
                            body: formData,
                        }
                    );

                const reply =
                    createdReply?.data ||
                    createdReply;

                const findIndex =
                    finds.findIndex(
                        item =>
                            Number(
                                item.id
                            ) ===
                            Number(
                                currentReplyFind.id
                            )
                    );

                if (
                    findIndex !== -1
                ) {

                    const existing =
                        Array.isArray(
                            finds[
                                findIndex
                            ].replies
                        )
                            ? finds[
                                findIndex
                            ].replies
                            : [];

                    finds[
                        findIndex
                    ] = {

                        ...finds[
                            findIndex
                        ],

                        replies: [
                            ...existing,
                            reply,
                        ],

                        replyCount:
                            Number(
                                finds[
                                    findIndex
                                ].replyCount ||
                                0
                            ) + 1,

                    };

                }

                await closeReplyModal();

                renderFeed();

            }

            catch (error) {

                console.error(
                    "Send Find reply error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to send video reply."
                );

                sendReplyBtn.disabled =
                    false;

            }

            finally {

                sendingReply = false;

                replyRecordBtn.disabled =
                    false;

                replyRetakeBtn.disabled =
                    false;

                replySwitchCameraBtn.disabled =
                    false;

                replyUploadStatus.style.display =
                    "none";

            }

        }
    );


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
       ESCAPE / MODAL KEYBOARD
    ========================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                replyModal.classList.contains(
                    "open"
                )
            ) {

                closeReplyModal();

            }

        }
    );


    /* ==========================================
       INITIALIZE
    ========================================== */

    async function initialize() {

        if (!requireLogin()) {
            return;
        }

        await loadCurrentUser();

        await loadFinds();

    }


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


    /* ==========================================
       CLEANUP
    ========================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            if (replyRecording) {

                stopReplyRecording();

            }

            stopReplyCamera();

            revokeReplyObjectUrl();

        }
    );

})();