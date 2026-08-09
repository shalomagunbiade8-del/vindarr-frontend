/* ==========================================
   VINDARR — FIND DISCOVERY
   find.js
========================================== */

const FIND_ENDPOINT =
    `${API_BASE_URL}/find`;

const findFeed =
    document.getElementById("findFeed");

const loading =
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


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================
   DATE
========================================== */

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

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
   REPLIES
========================================== */

function renderReplies(replies) {

    if (
        !Array.isArray(replies) ||
        replies.length === 0
    ) {

        return "";

    }

    return `

        <section class="replies">

            <div class="replies-title">
                ${replies.length}
                ${replies.length === 1
                    ? "video reply"
                    : "video replies"}
            </div>

            ${replies.map(
                reply => `

                    <article class="reply">

                        <div class="reply-author">

                            <img
                                class="avatar"
                                src="${escapeHtml(
                                    reply.creatorAvatar ||
                                    "images/default-avatar.png"
                                )}"
                                alt=""
                                onerror="this.style.display='none'"
                            >

                            <div class="author-info">

                                <span class="author-name">
                                    ${escapeHtml(
                                        reply.creatorUsername ||
                                        "User"
                                    )}
                                </span>

                                <span class="find-date">
                                    ${formatDate(
                                        reply.createdAt
                                    )}
                                </span>

                            </div>

                        </div>

                        ${
                            reply.videoUrl
                                ? `
                                    <video
                                        class="reply-video"
                                        src="${escapeHtml(
                                            reply.videoUrl
                                        )}"
                                        controls
                                        playsinline
                                        preload="metadata"
                                    ></video>
                                  `
                                : ""
                        }

                        ${
                            reply.text
                                ? `
                                    <div class="reply-info">

                                        <p class="reply-text">
                                            ${escapeHtml(
                                                reply.text
                                            )}
                                        </p>

                                    </div>
                                  `
                                : ""
                        }

                    </article>

                `
            ).join("")}

        </section>

    `;

}


/* ==========================================
   FIND CARD
========================================== */

function renderFind(request) {

    const avatar =
        request.creatorAvatar ||
        "images/default-avatar.png";

    return `

        <article
            class="find-card"
            data-find-id="${request.id}"
        >

            <div class="find-author">

                <img
                    class="avatar"
                    src="${escapeHtml(avatar)}"
                    alt=""
                    onerror="this.style.display='none'"
                >

                <div class="author-info">

                    <span class="author-name">
                        ${escapeHtml(
                            request.creatorUsername ||
                            "User"
                        )}
                    </span>

                    <span class="find-date">
                        ${formatDate(
                            request.createdAt
                        )}
                    </span>

                </div>

            </div>


            ${
                request.videoUrl
                    ? `
                        <video
                            class="find-video"
                            src="${escapeHtml(
                                request.videoUrl
                            )}"
                            controls
                            playsinline
                            preload="metadata"
                        ></video>
                      `
                    : ""
            }


            <div class="find-details">

                <p class="find-caption">
                    ${escapeHtml(
                        request.caption
                    )}
                </p>


                <div class="find-meta">

                    ${
                        request.category
                            ? `
                                <span class="meta-pill">
                                    <i class="bi bi-grid"></i>
                                    ${escapeHtml(
                                        request.category
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        request.location
                            ? `
                                <span class="meta-pill">
                                    <i class="bi bi-geo-alt"></i>
                                    ${escapeHtml(
                                        request.location
                                    )}
                                </span>
                              `
                            : ""
                    }

                </div>

            </div>


            <div class="find-actions">

                <button
                    class="find-action"
                    type="button"
                    data-like="${request.id}"
                >
                    <i class="bi bi-heart"></i>

                    <span>
                        ${request.likeCount || 0}
                    </span>
                </button>


                <button
                    class="find-action"
                    type="button"
                >
                    <i class="bi bi-chat"></i>

                    <span>
                        ${request.replyCount || 0}
                    </span>
                </button>

            </div>


            ${renderReplies(
                request.replies
            )}

        </article>

    `;

}


/* ==========================================
   LOAD FINDS
========================================== */

async function loadFinds() {

    loading.style.display =
        "block";

    emptyState.style.display =
        "none";

    findFeed.innerHTML =
        "";

    try {

        const response =
            await fetch(
                FIND_ENDPOINT
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load Finds."
            );

        }

        const result =
            await response.json();

        const requests =
            Array.isArray(result)
                ? result
                : (
                    Array.isArray(result?.data)
                        ? result.data
                        : []
                );

        loading.style.display =
            "none";

        if (!requests.length) {

            emptyState.style.display =
                "block";

            return;

        }

        findFeed.innerHTML =
            requests
                .map(renderFind)
                .join("");

        attachActions();

    }

    catch (error) {

        console.error(
            "Find feed error:",
            error
        );

        loading.textContent =
            "Unable to load Finds. Please try again.";

    }

}


/* ==========================================
   LIKE
========================================== */

function attachActions() {

    document
        .querySelectorAll(
            "[data-like]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const token =
                            getToken();

                        if (!token) {

                            window.location.href =
                                "login.html";

                            return;

                        }

                        const id =
                            button.dataset.like;

                        try {

                            const response =
                                await fetch(
                                    `${FIND_ENDPOINT}/${id}/like`,
                                    {
                                        method: "POST",

                                        headers: {
                                            Authorization:
                                                `Bearer ${token}`
                                        }
                                    }
                                );

                            if (
                                response.ok
                            ) {

                                await loadFinds();

                            }

                        }

                        catch (error) {

                            console.error(
                                "Find like error:",
                                error
                            );

                        }

                    }
                );

            }
        );

}


/* ==========================================
   NAVIGATION
========================================== */

function openRecorder() {

    window.location.href =
        "record-search.html";

}

recordFindBtn?.addEventListener(
    "click",
    openRecorder
);

emptyRecordBtn?.addEventListener(
    "click",
    openRecorder
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

loadFinds();