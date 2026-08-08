let page = 1;

const LIMIT = 15;

let currentFilter = "recent";

let searchTimer = null;

let loading = false;

let hasMore = true;

let allRequests = [];

const findGrid =
document.getElementById("findGrid");

const loadingState =
document.getElementById("loadingState");

const emptyState =
document.getElementById("emptyState");

const loadMoreWrap =
document.getElementById("loadMoreWrap");

const loadMoreBtn =
document.getElementById("loadMoreBtn");

const searchInput =
document.getElementById("searchInput");

const clearSearchBtn =
document.getElementById("clearSearchBtn");

const createFindBtn =
document.getElementById("createFindBtn");

const emptyCreateBtn =
document.getElementById("emptyCreateBtn");

const bottomRecordBtn =
document.getElementById("bottomRecordBtn");

const backBtn =
document.getElementById("backBtn");

const filterButtons =
document.querySelectorAll(".filter-chip");

/* ==========================================
HELPERS
========================================== */

function escapeHtml(value) {


return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


}

function getToken() {


return localStorage.getItem("token");


}

function formatDate(value) {


if (!value) {
    return "";
}

const date =
    new Date(value);

if (Number.isNaN(date.getTime())) {
    return "";
}

const diff =
    Date.now() - date.getTime();

const minutes =
    Math.floor(diff / 60000);

if (minutes < 1) {
    return "Just now";
}

if (minutes < 60) {
    return `${minutes}m ago`;
}

const hours =
    Math.floor(minutes / 60);

if (hours < 24) {
    return `${hours}h ago`;
}

const days =
    Math.floor(hours / 24);

if (days < 7) {
    return `${days}d ago`;
}

return date.toLocaleDateString(
    undefined,
    {
        day: "numeric",
        month: "short"
    }
);


}

function formatDuration(seconds) {


const value =
    Number(seconds);

if (
    !Number.isFinite(value) ||
    value <= 0
) {
    return "";
}

const mins =
    Math.floor(value / 60);

const secs =
    Math.floor(value % 60);

return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;


}

function normalizeResponse(response) {


if (Array.isArray(response)) {
    return {
        data: response,
        total: response.length,
        hasMore: false
    };
}

if (Array.isArray(response?.data)) {
    return response;
}

if (Array.isArray(response?.items)) {
    return {
        ...response,
        data: response.items
    };
}

return {
    data: [],
    total: 0,
    hasMore: false
};


}

function getInitials(name) {


const value =
    String(name || "User")
        .trim();

if (!value) {
    return "U";
}

return value
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();


}

/* ==========================================
NAVIGATION
========================================== */

function goToRecord() {


window.location.href =
    "record-search.html";


}

createFindBtn?.addEventListener(
"click",
goToRecord
);

emptyCreateBtn?.addEventListener(
"click",
goToRecord
);

bottomRecordBtn?.addEventListener(
"click",
goToRecord
);

backBtn?.addEventListener(
"click",
() => {
history.back();
}
);

/* ==========================================
CARD
========================================== */

function renderCard(request) {


const id =
    Number(request?.id);

const caption =
    escapeHtml(
        request?.caption ||
        "Someone is looking for something."
    );

const username =
    escapeHtml(
        request?.creatorUsername ||
        "User"
    );

const avatar =
    request?.creatorAvatar;

const category =
    escapeHtml(
        request?.category ||
        "OTHER"
    );

const location =
    escapeHtml(
        request?.location ||
        ""
    );

const status =
    String(
        request?.status ||
        "OPEN"
    ).toUpperCase();

const duration =
    formatDuration(
        request?.duration
    );

const avatarHtml =
    avatar
        ? `
            <img
                class="find-avatar"
                src="${escapeHtml(avatar)}"
                alt="${username}"
                loading="lazy"
            >
        `
        : `
            <div class="find-avatar-placeholder">
                ${escapeHtml(
                    getInitials(username)
                )}
            </div>
        `;

const videoUrl =
    request?.videoUrl;

const thumbnailUrl =
    request?.thumbnailUrl;

return `
    <article
        class="find-card"
        data-id="${id}"
        tabindex="0"
        role="button"
        aria-label="Open Find request"
    >

        <div class="find-card-video">

            ${
                thumbnailUrl
                    ? `
                        <img
                            src="${escapeHtml(thumbnailUrl)}"
                            alt=""
                            loading="lazy"
                        >
                    `
                    : videoUrl
                        ? `
                            <video
                                src="${escapeHtml(videoUrl)}"
                                muted
                                playsinline
                                preload="metadata"
                            ></video>
                        `
                        : `
                            <div
                                style="
                                    width:100%;
                                    height:100%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:#111;
                                    color:#555;
                                "
                            >
                                <i
                                    class="bi bi-camera-video"
                                    style="font-size:2rem;"
                                ></i>
                            </div>
                        `
            }

            <div class="find-video-overlay">

                <div class="find-play">

                    <i class="bi bi-play-fill"></i>

                </div>

            </div>

            <span
                class="find-status ${
                    status === "SOLVED"
                        ? "solved"
                        : "open"
                }"
            >
                ${
                    status === "SOLVED"
                        ? "Solved"
                        : "Open"
                }
            </span>

            ${
                duration
                    ? `
                        <span class="find-duration">
                            ${duration}
                        </span>
                    `
                    : ""
            }

        </div>


        <div class="find-card-body">

            <div class="find-user">

                ${avatarHtml}

                <div class="find-user-name">

                    <strong>
                        @${username}
                    </strong>

                    <span>
                        ${formatDate(request?.createdAt)}
                    </span>

                </div>

            </div>


            <p class="find-caption">
                ${caption}
            </p>


            <div class="find-meta">

                <span class="find-category">
                    ${category}
                </span>

                ${
                    location
                        ? `
                            <span class="find-location">
                                <i class="bi bi-geo-alt"></i>
                                <span>
                                    ${location}
                                </span>
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="find-stats">

                <span class="find-stat">
                    <i class="bi bi-heart"></i>
                    ${Number(request?.likeCount || 0)}
                </span>

                <span class="find-stat">
                    <i class="bi bi-chat"></i>
                    ${Number(request?.replyCount || 0)}
                </span>

                <span class="find-stat">
                    <i class="bi bi-eye"></i>
                    ${Number(request?.viewCount || 0)}
                </span>

            </div>

        </div>

    </article>
`;


}

/* ==========================================
RENDER
========================================== */

function renderRequests(requests) {


if (!findGrid) {
    return;
}

if (!requests.length) {

    findGrid.innerHTML = "";

    emptyState.style.display =
        "flex";

    return;

}

emptyState.style.display =
    "none";

findGrid.innerHTML =
    requests
        .map(renderCard)
        .join("");


}

/* ==========================================
LOAD ENDPOINT
========================================== */

function getEndpoint() {


switch (currentFilter) {

    case "trending":
        return `${API_BASE_URL}/find/trending?limit=${LIMIT}`;

    case "open":
        return `${API_BASE_URL}/find/open`;

    case "solved":
        return `${API_BASE_URL}/find/solved`;

    default:
        return `${API_BASE_URL}/find?page=${page}&limit=${LIMIT}`;

}


}

/* ==========================================
LOAD REQUESTS
========================================== */

async function loadRequests(
reset = false
) {


if (loading) {
    return;
}

if (!hasMore && !reset) {
    return;
}

loading = true;

if (reset) {

    page = 1;

    hasMore = true;

    allRequests = [];

    findGrid.innerHTML = "";

    emptyState.style.display =
        "none";

    loadingState.style.display =
        "flex";

}

try {

    const response =
        await fetch(
            getEndpoint(),
            {
                headers: {
                    Authorization:
                        `Bearer ${getToken()}`
                }
            }
        );

    if (!response.ok) {

        throw new Error(
            `Failed to load Find requests (${response.status})`
        );

    }

    const json =
        await response.json();

    const normalized =
        normalizeResponse(json);

    let incoming =
        normalized.data || [];

    /*
     * Category filtering is performed
     * client-side because the current
     * backend endpoints are status/order
     * based.
     */

    if (
        ![
            "recent",
            "trending",
            "open",
            "solved"
        ].includes(currentFilter)
    ) {

        incoming =
            incoming.filter(
                request =>
                    String(
                        request?.category ||
                        ""
                    ).toUpperCase() ===
                    currentFilter
            );

    }

    allRequests =
        reset
            ? incoming
            : [
                ...allRequests,
                ...incoming
            ];

    renderRequests(
        allRequests
    );

    hasMore =
        Boolean(
            normalized.hasMore
        );

    if (
        currentFilter === "recent" &&
        incoming.length
    ) {

        page++;

    }

    loadMoreWrap.style.display =
        hasMore
            ? "flex"
            : "none";

}

catch (error) {

    console.error(
        "Find load error:",
        error
    );

    findGrid.innerHTML = `
        <div
            style="
                grid-column:1/-1;
                padding:60px 20px;
                text-align:center;
                color:#777;
            "
        >
            <i
                class="bi bi-exclamation-circle"
                style="
                    display:block;
                    font-size:2rem;
                    margin-bottom:12px;
                "
            ></i>

            <strong
                style="
                    display:block;
                    color:#ddd;
                    margin-bottom:6px;
                "
            >
                Unable to load Find requests
            </strong>

            <span>
                Please try again.
            </span>

        </div>
    `;

}

finally {

    loading = false;

    loadingState.style.display =
        "none";

}


}

/* ==========================================
FILTERS
========================================== */

filterButtons.forEach(
button => {


    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            button.classList.add(
                "active"
            );

            currentFilter =
                button.dataset.filter;

            loadRequests(true);

        }
    );

}


);

/* ==========================================
SEARCH
========================================== */

searchInput?.addEventListener(
"input",
() => {


    clearTimeout(
        searchTimer
    );

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    clearSearchBtn.style.display =
        query
            ? "flex"
            : "none";

    searchTimer =
        setTimeout(
            () => {

                if (!query) {

                    renderRequests(
                        allRequests
                    );

                    return;

                }

                const filtered =
                    allRequests.filter(
                        request => {

                            const text =
                                [
                                    request?.caption,
                                    request?.category,
                                    request?.location,
                                    request?.creatorUsername
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .toLowerCase();

                            return text.includes(
                                query
                            );

                        }
                    );

                renderRequests(
                    filtered
                );

            },
            250
        );

}


);

/* ==========================================
CLEAR SEARCH
========================================== */

clearSearchBtn?.addEventListener(
"click",
() => {


    searchInput.value = "";

    clearSearchBtn.style.display =
        "none";

    renderRequests(
        allRequests
    );

    searchInput.focus();

}


);

/* ==========================================
OPEN FIND
========================================== */

findGrid?.addEventListener(
"click",
event => {


    const card =
        event.target.closest(
            ".find-card"
        );

    if (!card) {
        return;
    }

    const id =
        card.dataset.id;

    if (!id) {
        return;
    }

    window.location.href =
        `find.html?id=${encodeURIComponent(id)}`;

}


);

/* ==========================================
KEYBOARD ACCESS
========================================== */

findGrid?.addEventListener(
"keydown",
event => {


    if (
        event.key !== "Enter" &&
        event.key !== " "
    ) {
        return;
    }

    const card =
        event.target.closest(
            ".find-card"
        );

    if (!card) {
        return;
    }

    event.preventDefault();

    const id =
        card.dataset.id;

    if (id) {

        window.location.href =
            `find.html?id=${encodeURIComponent(id)}`;

    }

}


);

/* ==========================================
LOAD MORE
========================================== */

loadMoreBtn?.addEventListener(
"click",
() => {


    loadRequests();

}


);

/* ==========================================
INITIALIZE
========================================== */

async function initializeFindSearch() {


const token =
    getToken();

if (!token) {

    window.location.href =
        "login.html";

    return;

}

clearSearchBtn.style.display =
    "none";

await loadRequests(true);


}

if (
document.readyState ===
"loading"
) {


document.addEventListener(
    "DOMContentLoaded",
    initializeFindSearch
);


}

else {


initializeFindSearch();


}
