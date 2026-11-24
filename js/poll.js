
/* ==========================================
   VINDARR — SOCIAL POLL EXPERIENCE
========================================== */

let polls = [];
let activeCategory = "All";
let searchTerm = "";
let loading = false;

const votingPolls = new Set();

const pollFeed = document.getElementById("pollFeed");
const loadingEl = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryTabs = document.getElementById("categoryTabs");

const createPollBtn = document.getElementById("createPollBtn");
const emptyCreateBtn = document.getElementById("emptyCreateBtn");
const heroCreateBtn = document.getElementById("heroCreateBtn");
const sidebarCreateBtn = document.getElementById("sidebarCreateBtn");

const backBtn = document.getElementById("backBtn");

const modal = document.getElementById("pollModal");
const modalContent = document.getElementById("modalContent");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalBackdrop = document.getElementById("modalBackdrop");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let toastTimer = null;


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
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================
   SAFE MEDIA URL
========================================== */

function safeMediaUrl(value) {

    if (!value) {
        return "";
    }

    try {

        const url = new URL(value, window.location.origin);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }

        return url.href;

    } catch {

        return "";

    }
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
   TOAST
========================================== */

function showToast(message) {

    if (!toast || !toastMessage) {
        return;
    }

    toastMessage.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* ==========================================
   CURRENT USER
========================================== */

function getCurrentUserId() {

    try {

        const stored = localStorage.getItem("user");

        if (!stored) {
            return null;
        }

        const user = JSON.parse(stored);

        return user?.id || user?.userId || null;

    } catch {

        return null;

    }
}


/* ==========================================
   LOAD POLLS
========================================== */

async function loadPolls() {

    if (loading) {
        return;
    }

    loading = true;

    loadingEl.hidden = false;
    emptyState.hidden = true;

    try {

        const response = await fetch(
            `${API_BASE_URL}/polls?page=1&limit=50`
        );

        if (!response.ok) {
            throw new Error("Unable to load polls.");
        }

        const result = await response.json();

        polls = Array.isArray(result?.data)
            ? result.data
            : [];

        renderPolls();

    } catch (error) {

        console.error("Poll loading error:", error);

        pollFeed.innerHTML = `
            <div class="empty-state">

                <div class="empty-visual">
                    <i class="bi bi-wifi-off"></i>
                </div>

                <span class="section-kicker">
                    CONNECTION INTERRUPTED
                </span>

                <h2>Couldn't load polls.</h2>

                <p>
                    Something went wrong while loading conversations.
                    Please try again.
                </p>

                <button type="button" data-action="retry">
                    <i class="bi bi-arrow-clockwise"></i>
                    Try again
                </button>

            </div>
        `;

    } finally {

        loading = false;
        loadingEl.hidden = true;

    }
}


/* ==========================================
   FILTER POLLS
========================================== */

function getFilteredPolls() {

    const term = searchTerm.trim().toLowerCase();

    return polls.filter(poll => {

        const categoryMatch =
            activeCategory === "All" ||
            String(poll.category || "").toLowerCase() ===
            activeCategory.toLowerCase();

        if (!categoryMatch) {
            return false;
        }

        if (!term) {
            return true;
        }

        const question = String(poll.question || "").toLowerCase();

        const category = String(poll.category || "").toLowerCase();

        const creator = String(poll.creatorUsername || "").toLowerCase();

        const optionText = (poll.options || [])
            .map(option => option.caption || "")
            .join(" ")
            .toLowerCase();

        return (
            question.includes(term) ||
            category.includes(term) ||
            creator.includes(term) ||
            optionText.includes(term)
        );

    });
}


/* ==========================================
   RENDER FEED
========================================== */

function renderPolls() {

    const filtered = getFilteredPolls();

    if (!filtered.length) {

        pollFeed.innerHTML = "";
        emptyState.hidden = false;

        return;
    }

    emptyState.hidden = true;

    pollFeed.innerHTML = filtered
        .map(poll => renderPollCard(poll))
        .join("");

    animateResultBars();
}


/* ==========================================
   MEDIA
========================================== */

function renderMedia(option, className = "option-media") {

    const mediaUrl = safeMediaUrl(option.mediaUrl);

    if (!mediaUrl) {

        return `
            <div class="${className} media-placeholder">
                <i class="bi bi-image"></i>
            </div>
        `;

    }

    if (option.mediaType === "video") {

        return `
            <div class="${className}">

                <video
                    src="${escapeHtml(mediaUrl)}"
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
                src="${escapeHtml(mediaUrl)}"
                alt="${escapeHtml(option.caption)}"
                loading="lazy"
            >

        </div>
    `;
}


/* ==========================================
   POLL CARD
========================================== */

function renderPollCard(poll) {

    const token = getToken();

    const options = Array.isArray(poll.options)
        ? poll.options
        : [];

    const total = Number(poll.totalVotes || 0);

    const isOwner =
        token &&
        String(getCurrentUserId()) === String(poll.creatorId);

    const avatarUrl = safeMediaUrl(poll.creatorAvatar);

    const avatar = avatarUrl
        ? `
            <img
                class="creator-avatar"
                src="${escapeHtml(avatarUrl)}"
                alt=""
                loading="lazy"
            >
        `
        : `
            <div class="creator-avatar creator-avatar-fallback">
                ${escapeHtml(initials(poll.creatorUsername))}
            </div>
        `;

    return `
        <article
            class="poll-card"
            data-poll-id="${escapeHtml(poll.id)}"
        >

            <div class="poll-card-header">

                <div class="creator">

                    ${avatar}

                    <div class="creator-details">

                        <div class="creator-name">
                            ${escapeHtml(poll.creatorUsername || "Vindarr user")}
                        </div>

                        <div class="creator-subtitle">
                            <span>Started a poll</span>
                            <span class="dot"></span>
                            <span>Community voice</span>
                        </div>

                    </div>

                </div>

                <div class="poll-header-actions">

                    <span class="poll-category">
                        ${escapeHtml(poll.category || "Other")}
                    </span>

                    ${
                        isOwner
                            ? `
                                <button
                                    class="small-action delete"
                                    data-action="delete"
                                    data-id="${escapeHtml(poll.id)}"
                                    type="button"
                                    aria-label="Delete poll"
                                    title="Delete poll"
                                >
                                    <i class="bi bi-trash3"></i>
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="poll-question">
                ${escapeHtml(poll.question)}
            </div>


            <div class="poll-options">

                ${
                    options.map(option => `

                        <div
                            class="poll-option"
                            data-option-id="${escapeHtml(option.id)}"
                            data-poll-id="${escapeHtml(poll.id)}"
                        >

                            ${renderMedia(option)}

                            <div class="option-info">

                                <div class="option-caption">
                                    ${escapeHtml(option.caption)}
                                </div>

                            </div>

                            <div class="vote-area">

                                <button
                                    class="vote-button"
                                    data-action="vote"
                                    data-poll-id="${escapeHtml(poll.id)}"
                                    data-option-id="${escapeHtml(option.id)}"
                                    type="button"
                                >
                                    <i class="bi bi-check2-circle"></i>
                                    Cast vote
                                </button>

                            </div>

                        </div>

                    `).join("")}

            </div>


            ${
                total > 0
                    ? renderResults(poll)
                    : `
                        <div class="results-area">
                            <div class="results-title">
                                <span>Be the first to vote</span>
                                <span>Your opinion matters</span>
                            </div>
                        </div>
                    `
            }


            <div class="poll-footer">

                <div class="poll-footer-stats">
                    <i class="bi bi-bar-chart-fill"></i>

                    <span>
                        <strong>${total}</strong>
                        ${total === 1 ? "vote" : "votes"}
                    </span>
                </div>

                <div class="poll-footer-actions">

                    <button
                        class="small-action"
                        data-action="open"
                        data-id="${escapeHtml(poll.id)}"
                        type="button"
                        aria-label="View poll"
                        title="View poll"
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

function renderResults(poll) {

    const options = Array.isArray(poll.options)
        ? poll.options
        : [];

    return `
        <div class="results-area">

            <div class="results-title">
                <span>What the community thinks</span>

                <span>
                    <strong>${Number(poll.totalVotes || 0)}</strong>
                    total votes
                </span>
            </div>

            ${
                options.map(option => {

                    const percentage = Math.min(
                        100,
                        Math.max(0, Number(option.percentage || 0))
                    );

                    return `
                        <div class="result-row">

                            <div class="result-head">

                                <strong>
                                    ${escapeHtml(option.caption)}
                                </strong>

                                <span>
                                    ${percentage}%
                                </span>

                            </div>

                            <div class="result-track">

                                <div
                                    class="result-fill"
                                    data-width="${percentage}"
                                ></div>

                            </div>

                        </div>
                    `;

                }).join("")
            }

        </div>
    `;
}


/* ==========================================
   ANIMATE RESULT BARS
========================================== */

function animateResultBars() {

    requestAnimationFrame(() => {

        document.querySelectorAll(".result-fill").forEach(bar => {

            const width = Math.min(
                100,
                Math.max(0, Number(bar.dataset.width || 0))
            );

            bar.style.width = `${width}%`;

        });

    });
}


/* ==========================================
   FEED EVENT DELEGATION
========================================== */

pollFeed.addEventListener("click", event => {

    const retryButton = event.target.closest('[data-action="retry"]');

    if (retryButton) {
        loadPolls();
        return;
    }

    const voteButton = event.target.closest('[data-action="vote"]');

    if (voteButton) {

        event.stopPropagation();

        const pollId = Number(voteButton.dataset.pollId);
        const optionId = Number(voteButton.dataset.optionId);

        vote(pollId, optionId, voteButton);

        return;
    }

    const deleteButton = event.target.closest('[data-action="delete"]');

    if (deleteButton) {

        event.stopPropagation();

        deletePoll(Number(deleteButton.dataset.id));

        return;
    }

    const openButton = event.target.closest('[data-action="open"]');

    if (openButton) {

        openPoll(Number(openButton.dataset.id));

        return;
    }

    const optionCard = event.target.closest(".poll-option");

    if (optionCard) {

        const card = optionCard.closest(".poll-card");

        if (!card) {
            return;
        }

        card.querySelectorAll(".poll-option").forEach(option => {
            option.classList.remove("selected");
        });

        optionCard.classList.add("selected");

    }

});


/* ==========================================
   VOTE
========================================== */

async function vote(pollId, optionId, button) {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

        return;
    }

    if (votingPolls.has(pollId)) {
        return;
    }

    const card = document.querySelector(
        `[data-poll-id="${pollId}"]`
    );

    if (!card) {
        return;
    }

    votingPolls.add(pollId);

    const originalContent = button.innerHTML;

    button.disabled = true;

    button.innerHTML = `
        <i class="bi bi-arrow-repeat"></i>
        Voting...
    `;

    card.querySelectorAll(".vote-button").forEach(item => {
        item.disabled = true;
    });

    try {

        const response = await fetch(
            `${API_BASE_URL}/polls/${pollId}/vote`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    optionId
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                Array.isArray(result?.message)
                    ? result.message.join(", ")
                    : result?.message || "Unable to vote."
            );

        }

        const index = polls.findIndex(
            poll => Number(poll.id) === Number(pollId)
        );

        if (index !== -1) {
            polls[index] = result;
        }

        renderPolls();

        showToast("Your vote has been counted!");

    } catch (error) {

        console.error("Poll vote error:", error);

        showToast(error.message || "Unable to submit your vote.");

        button.innerHTML = originalContent;

        button.disabled = false;

        card.querySelectorAll(".vote-button").forEach(item => {
            item.disabled = false;
        });

    } finally {

        votingPolls.delete(pollId);

    }
}


/* ==========================================
   DELETE POLL
========================================== */

async function deletePoll(pollId) {

    const token = getToken();

    if (!token) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this poll?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/polls/${pollId}`,
            {
                method: "DELETE",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result?.message || "Unable to delete poll."
            );

        }

        polls = polls.filter(
            poll => Number(poll.id) !== Number(pollId)
        );

        renderPolls();

        showToast("Poll deleted successfully.");

    } catch (error) {

        console.error("Poll delete error:", error);

        alert(error.message);

    }
}


/* ==========================================
   OPEN POLL MODAL
========================================== */

async function openPoll(pollId) {

    const poll = polls.find(
        item => Number(item.id) === Number(pollId)
    );

    if (!poll) {
        return;
    }

    modalContent.innerHTML = `

        <div class="modal-question">
            ${escapeHtml(poll.question)}
        </div>

        <div class="modal-options">

            ${
                (poll.options || []).map(option => `

                    <div>

                        ${renderMedia(option, "modal-option-media")}

                        <div class="modal-option-caption">
                            ${escapeHtml(option.caption)}
                        </div>

                    </div>

                `).join("")
            }

        </div>

        ${
            Number(poll.totalVotes || 0) > 0
                ? renderResults(poll)
                : ""
        }

    `;

    modal.hidden = false;

    document.body.style.overflow = "hidden";

    animateResultBars();
}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeModal() {

    modal.hidden = true;

    document.body.style.overflow = "";
}


/* ==========================================
   SEARCH
========================================== */

searchInput?.addEventListener("input", event => {

    searchTerm = event.target.value;

    renderPolls();

});


/* ==========================================
   CATEGORY FILTER
========================================== */

categoryTabs?.addEventListener("click", event => {

    const button = event.target.closest(".category-tab");

    if (!button) {
        return;
    }

    activeCategory = button.dataset.category;

    document.querySelectorAll(".category-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    button.classList.add("active");

    renderPolls();

});


/* ==========================================
   CREATE POLL NAVIGATION
========================================== */

function goToCreatePoll() {

    if (!getToken()) {

        window.location.href = "login.html";

        return;
    }

    window.location.href = "create-poll.html";

}

createPollBtn?.addEventListener("click", goToCreatePoll);

emptyCreateBtn?.addEventListener("click", goToCreatePoll);

heroCreateBtn?.addEventListener("click", goToCreatePoll);

sidebarCreateBtn?.addEventListener("click", goToCreatePoll);


/* ==========================================
   NAVIGATION
========================================== */

backBtn?.addEventListener("click", () => {
    window.history.back();
});


/* ==========================================
   MODAL EVENTS
========================================== */

closeModalBtn?.addEventListener("click", closeModal);

modalBackdrop?.addEventListener("click", closeModal);

document.addEventListener("keydown", event => {

    if (event.key === "Escape" && !modal.hidden) {
        closeModal();
    }

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {

        event.preventDefault();

        searchInput?.focus();

    }

});


/* ==========================================
   INIT
========================================== */

loadPolls();
