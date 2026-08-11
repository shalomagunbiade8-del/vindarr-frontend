/* ==========================================
   VINDARR — POLL DISCOVERY
========================================== */

let polls = [];
let activeCategory = "All";
let searchTerm = "";
let loading = false;

const pollFeed =
    document.getElementById("pollFeed");

const loadingEl =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const categoryTabs =
    document.getElementById("categoryTabs");

const createPollBtn =
    document.getElementById("createPollBtn");

const emptyCreateBtn =
    document.getElementById("emptyCreateBtn");

const backBtn =
    document.getElementById("backBtn");

const modal =
    document.getElementById("pollModal");

const modalContent =
    document.getElementById("modalContent");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const modalBackdrop =
    document.getElementById("modalBackdrop");


/* ==========================================
   AUTH
========================================== */

function getToken() {
    return localStorage.getItem("token");
}


/* ==========================================
   HTML ESCAPE
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
   INITIALS
========================================== */

function initials(name) {

    return String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase();
}


/* ==========================================
   LOAD POLLS
========================================== */

async function loadPolls() {

    loading = true;

    loadingEl.hidden =
        false;

    emptyState.hidden =
        true;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/polls?page=1&limit=50`
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load polls."
            );

        }

        const result =
            await response.json();

        polls =
            Array.isArray(
                result?.data
            )
                ? result.data
                : [];

        renderPolls();

    }

    catch (error) {

        console.error(
            "Poll loading error:",
            error
        );

        pollFeed.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    <i class="bi bi-wifi-off"></i>
                </div>

                <h2>
                    Couldn't load polls
                </h2>

                <p>
                    Please check your connection and try again.
                </p>

                <button
                    type="button"
                    onclick="loadPolls()"
                >
                    Try Again
                </button>

            </div>
        `;

    }

    finally {

        loading = false;

        loadingEl.hidden =
            true;

    }
}


/* ==========================================
   FILTER
========================================== */

function getFilteredPolls() {

    return polls.filter(
        poll => {

            const categoryMatch =
                activeCategory === "All" ||
                poll.category ===
                    activeCategory;

            const term =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!term) {
                return categoryMatch;
            }

            const question =
                String(
                    poll.question || ""
                ).toLowerCase();

            const category =
                String(
                    poll.category || ""
                ).toLowerCase();

            const creator =
                String(
                    poll.creatorUsername || ""
                ).toLowerCase();

            const optionText =
                (
                    poll.options || []
                )
                    .map(
                        option =>
                            option.caption
                    )
                    .join(" ")
                    .toLowerCase();

            return (
                categoryMatch &&
                (
                    question.includes(term) ||
                    category.includes(term) ||
                    creator.includes(term) ||
                    optionText.includes(term)
                )
            );
        }
    );
}


/* ==========================================
   RENDER
========================================== */

function renderPolls() {

    const filtered =
        getFilteredPolls();

    if (!filtered.length) {

        pollFeed.innerHTML = "";

        emptyState.hidden =
            false;

        return;
    }

    emptyState.hidden =
        true;

    pollFeed.innerHTML =
        filtered
            .map(
                poll =>
                    renderPollCard(
                        poll
                    )
            )
            .join("");

    bindPollEvents();
}


/* ==========================================
   MEDIA
========================================== */

function renderMedia(
    option,
    className = "option-media"
) {

    if (
        option.mediaType ===
        "video"
    ) {

        return `

            <div class="${className}">

                <video
                    src="${escapeHtml(option.mediaUrl)}"
                    muted
                    playsinline
                    controls
                    preload="metadata"
                ></video>

                <div class="video-badge">
                    <i class="bi bi-play-fill"></i>
                </div>

            </div>
        `;
    }

    return `

        <div class="${className}">

            <img
                src="${escapeHtml(option.mediaUrl)}"
                alt="${escapeHtml(option.caption)}"
                loading="lazy"
            >

        </div>
    `;
}


/* ==========================================
   CARD
========================================== */

function renderPollCard(
    poll
) {

    const token =
        getToken();

    const options =
        poll.options || [];

    const total =
        Number(
            poll.totalVotes || 0
        );

    const avatar =
        poll.creatorAvatar
            ? `
                <img
                    class="creator-avatar"
                    src="${escapeHtml(
                        poll.creatorAvatar
                    )}"
                    alt=""
                >
              `
            : `
                <div
                    class="
                        creator-avatar
                        creator-avatar-fallback
                    "
                >
                    ${initials(
                        poll.creatorUsername
                    )}
                </div>
              `;

    return `

        <article
            class="poll-card"
            data-poll-id="${poll.id}"
        >

            <div class="poll-card-header">

                <div class="creator">

                    ${avatar}

                    <div>

                        <div class="creator-name">
                            ${escapeHtml(
                                poll.creatorUsername
                            )}
                        </div>

                        <div class="poll-category">
                            ${escapeHtml(
                                poll.category
                            )}
                        </div>

                    </div>

                </div>

                ${
                    token &&
                    String(
                        getCurrentUserId()
                    ) ===
                    String(
                        poll.creatorId
                    )
                        ? `
                            <button
                                class="
                                    small-action
                                    delete
                                "
                                data-action="delete"
                                data-id="${poll.id}"
                                type="button"
                                title="Delete poll"
                            >
                                <i class="bi bi-trash3"></i>
                            </button>
                          `
                        : ""
                }

            </div>


            <div class="poll-question">

                ${escapeHtml(
                    poll.question
                )}

            </div>


            <div class="poll-options">

                ${
                    options
                        .map(
                            option => `

                                <div
                                    class="poll-option"
                                    data-option-id="${option.id}"
                                >

                                    ${renderMedia(
                                        option
                                    )}

                                    <div class="option-info">

                                        <div class="option-caption">
                                            ${escapeHtml(
                                                option.caption
                                            )}
                                        </div>

                                    </div>

                                    <div class="vote-area">

                                        <button
                                            class="vote-button"
                                            data-action="vote"
                                            data-poll-id="${poll.id}"
                                            data-option-id="${option.id}"
                                            type="button"
                                        >
                                            <i class="bi bi-hand-thumbs-up"></i>
                                            Vote
                                        </button>

                                    </div>

                                </div>
                            `
                        )
                        .join("")
                }

            </div>


            ${
                total > 0
                    ? renderResults(
                        poll
                    )
                    : ""
            }


            <div class="poll-footer">

                <span>
                    ${
                        total
                    }
                    ${
                        total === 1
                            ? "vote"
                            : "votes"
                    }
                </span>

                <div class="poll-footer-actions">

                    <button
                        class="small-action"
                        data-action="open"
                        data-id="${poll.id}"
                        type="button"
                        title="Open poll"
                    >
                        <i class="bi bi-arrows-angle-expand"></i>
                    </button>

                </div>

            </div>

        </article>

    `;
}


/* ==========================================
   RESULTS
========================================== */

function renderResults(
    poll
) {

    return `

        <div class="results-area">

            <div class="results-title">

                <span>
                    Current results
                </span>

                <span>
                    ${poll.totalVotes} votes
                </span>

            </div>

            ${
                (poll.options || [])
                    .map(
                        option => `

                            <div class="result-row">

                                <div class="result-head">

                                    <strong>
                                        ${escapeHtml(
                                            option.caption
                                        )}
                                    </strong>

                                    <span>
                                        ${option.percentage || 0}%
                                    </span>

                                </div>

                                <div class="result-track">

                                    <div
                                        class="result-fill"
                                        style="
                                            width:
                                            ${
                                                option.percentage || 0
                                            }%;
                                        "
                                    ></div>

                                </div>

                            </div>
                        `
                    )
                    .join("")
            }

        </div>
    `;
}


/* ==========================================
   EVENTS
========================================== */

function bindPollEvents() {

    document
        .querySelectorAll(
            '[data-action="vote"]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        vote(
                            Number(
                                button.dataset.pollId
                            ),
                            Number(
                                button.dataset.optionId
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '[data-action="delete"]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();

                        deletePoll(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '[data-action="open"]'
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openPoll(
                            Number(
                                button.dataset.id
                            )
                        );

                    }
                );

            }
        );

}


/* ==========================================
   VOTE
========================================== */

async function vote(
    pollId,
    optionId
) {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    const card =
        document.querySelector(
            `[data-poll-id="${pollId}"]`
        );

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/polls/${pollId}/vote`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify({
                            optionId,
                        }),
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                Array.isArray(
                    result?.message
                )
                    ? result.message.join(", ")
                    : result?.message ||
                      "Unable to vote."
            );

        }

        const index =
            polls.findIndex(
                poll =>
                    Number(poll.id) ===
                    Number(pollId)
            );

        if (index !== -1) {

            polls[index] =
                result;

        }

        renderPolls();

    }

    catch (error) {

        console.error(
            "Poll vote error:",
            error
        );

        alert(
            error.message
        );

    }
}


/* ==========================================
   DELETE
========================================== */

async function deletePoll(
    pollId
) {

    const token =
        getToken();

    if (!token) {
        return;
    }

    const confirmed =
        confirm(
            "Delete this poll?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/polls/${pollId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result?.message ||
                "Unable to delete poll."
            );

        }

        polls =
            polls.filter(
                poll =>
                    Number(poll.id) !==
                    Number(pollId)
            );

        renderPolls();

    }

    catch (error) {

        console.error(
            "Poll delete error:",
            error
        );

        alert(
            error.message
        );

    }
}


/* ==========================================
   OPEN POLL
========================================== */

async function openPoll(
    pollId
) {

    const poll =
        polls.find(
            item =>
                Number(item.id) ===
                Number(pollId)
        );

    if (!poll) {
        return;
    }

    modalContent.innerHTML = `

        <div class="modal-question">

            ${escapeHtml(
                poll.question
            )}

        </div>

        <div class="modal-options">

            ${
                (poll.options || [])
                    .map(
                        option => `

                            <div>

                                ${renderMedia(
                                    option,
                                    "modal-option-media"
                                )}

                                <div class="modal-option-caption">

                                    ${escapeHtml(
                                        option.caption
                                    )}

                                </div>

                            </div>
                        `
                    )
                    .join("")
            }

        </div>

        ${
            poll.totalVotes > 0
                ? renderResults(
                    poll
                )
                : ""
        }

    `;

    modal.hidden =
        false;

    document.body.style.overflow =
        "hidden";
}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal() {

    modal.hidden =
        true;

    document.body.style.overflow =
        "";
}


/* ==========================================
   SEARCH
========================================== */

searchInput?.addEventListener(
    "input",
    event => {

        searchTerm =
            event.target.value;

        renderPolls();

    }
);


/* ==========================================
   CATEGORY
========================================== */

categoryTabs?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".category-tab"
            );

        if (!button) {
            return;
        }

        activeCategory =
            button.dataset.category;

        document
            .querySelectorAll(
                ".category-tab"
            )
            .forEach(
                tab =>
                    tab.classList.remove(
                        "active"
                    )
            );

        button.classList.add(
            "active"
        );

        renderPolls();

    }
);


/* ==========================================
   CURRENT USER
========================================== */

function getCurrentUserId() {

    try {

        const stored =
            localStorage.getItem(
                "user"
            );

        if (!stored) {
            return null;
        }

        const user =
            JSON.parse(
                stored
            );

        return user?.id ||
            user?.userId ||
            null;

    }

    catch {

        return null;

    }
}


/* ==========================================
   NAVIGATION
========================================== */

createPollBtn?.addEventListener(
    "click",
    () => {

        if (!getToken()) {

            window.location.href =
                "login.html";

            return;
        }

        window.location.href =
            "create-poll.html";

    }
);


emptyCreateBtn?.addEventListener(
    "click",
    () => {

        if (!getToken()) {

            window.location.href =
                "login.html";

            return;
        }

        window.location.href =
            "create-poll.html";

    }
);


backBtn?.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


closeModalBtn?.addEventListener(
    "click",
    closeModal
);


modalBackdrop?.addEventListener(
    "click",
    closeModal
);


/* ==========================================
   ESCAPE MODAL
========================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !modal.hidden
        ) {

            closeModal();

        }

    }
);


/* ==========================================
   INIT
========================================== */

loadPolls();