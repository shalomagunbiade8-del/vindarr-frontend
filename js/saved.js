/* =========================================================
   VINDARR — SAVED
   ========================================================= */


"use strict";



/* =========================================================
   STATE
========================================================= */

let savedItems = [];

let collections = [];

let currentFilter = "all";

let currentActionItem = null;

let currentCollection = null;

let currentCollectionItem = null;

let collectionCoverMode = "auto";

let creatingCollectionFromMove = false;



/* =========================================================
   API
========================================================= */

const SAVED_API =
  `${API_BASE_URL}/saved`;

const COLLECTION_API =
  `${API_BASE_URL}/collections`;



/* =========================================================
   DOM
========================================================= */

const savedGrid =
  document.getElementById("savedGrid");

const collectionsGrid =
  document.getElementById("collectionsGrid");

const savedCount =
  document.getElementById("savedCount");

const savingStreak =
  document.getElementById("savingStreak");

const collectionStreak =
  document.getElementById("collectionStreak");

const savingStreakMessage =
  document.getElementById("savingStreakMessage");

const collectionStreakMessage =
  document.getElementById("collectionStreakMessage");

const collectionModal =
  document.getElementById("collectionModal");

const collectionNameInput =
  document.getElementById("collectionName");

const collectionDetailModal =
  document.getElementById("collectionDetailModal");

const collectionDetailContent =
  document.getElementById("collectionDetailContent");

const itemActionModal =
  document.getElementById("itemActionModal");

const itemActionTitle =
  document.getElementById("itemActionTitle");

const moveCollectionModal =
  document.getElementById("moveCollectionModal");

const moveCollectionList =
  document.getElementById("moveCollectionList");

const savedMenu =
  document.getElementById("savedMenu");



/* =========================================================
   AUTH
========================================================= */

function requireAuth() {

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return false;

  }

  return true;

}



/* =========================================================
   API FETCH
========================================================= */

async function apiFetch(
  url,
  options = {}
) {

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    throw new Error(
      "Authentication required."
    );

  }


  const headers =
    new Headers(
      options.headers || {}
    );


  headers.set(
    "Authorization",
    `Bearer ${token}`
  );


  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {

    headers.set(
      "Content-Type",
      "application/json"
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


  if (response.status === 401) {

    localStorage.removeItem("token");

    window.location.href =
      "login.html";

    throw new Error(
      "Session expired."
    );

  }


  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const text =
        await response.text();

      data =
        text
          ? { message: text }
          : null;

    }

  } catch {

    data = null;

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${response.status})`
    );

  }


  return data;

}



/* =========================================================
   RESPONSE DATA HELPER
========================================================= */

function extractData(response) {

  if (!response) {
    return null;
  }


  if (
    response.data !== undefined
  ) {

    return response.data;

  }


  return response;

}



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}



/* =========================================================
   NORMALIZE MEDIA URL
========================================================= */

function normalizeMediaUrl(url) {

  if (!url) {
    return "";
  }


  if (
    typeof url !== "string"
  ) {

    return "";

  }


  return url.trim();

}



/* =========================================================
   CONTENT TYPE
========================================================= */

function normalizeContentType(
  content
) {

  const raw =
    String(
      content?.type ||
      content?.contentType ||
      ""
    )
      .toLowerCase()
      .trim();


  if (
    raw.includes("ebook") ||
    raw.includes("book")
  ) {

    return "ebook";

  }


  if (
    raw.includes("fashion") ||
    raw.includes("product") ||
    raw.includes("item")
  ) {

    return "fashion";

  }


  if (
    raw.includes("essential")
  ) {

    return "essential";

  }


  return "video";

}



/* =========================================================
   GET SAVED CONTENT
========================================================= */

function getSavedContent(saved) {

  if (!saved) {
    return null;
  }


  return (
    saved.content ||
    saved.video ||
    saved.product ||
    saved.ebook ||
    null
  );

}



/* =========================================================
   GET PRIMARY MEDIA
   Used for thumbnails.
========================================================= */

function getPrimaryMedia(
  content
) {

  if (!content) {
    return "";
  }


  const type =
    normalizeContentType(content);


  if (type === "ebook") {

    return normalizeMediaUrl(
      content.coverUrl ||
      content.cover ||
      content.thumbnailUrl ||
      content.imageUrl ||
      ""
    );

  }


  return normalizeMediaUrl(
    content.coverUrl ||
    content.thumbnailUrl ||
    content.imageUrl ||
    content.videoUrl ||
    content.fileUrl ||
    ""
  );

}



/* =========================================================
   GET CONTENT ID
========================================================= */

function getContentId(
  saved
) {

  return (
    saved?.contentId ||
    saved?.content?.id ||
    saved?.videoId ||
    saved?.id ||
    null
  );

}



/* =========================================================
   GET SAVED ID
========================================================= */

function getSavedId(
  saved
) {

  return (
    saved?.id ||
    saved?.savedItemId ||
    null
  );

}



/* =========================================================
   DATE HELPERS
========================================================= */

function parseDateOnly(
  value
) {

  if (!value) {
    return null;
  }


  if (
    value instanceof Date
  ) {

    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

  }


  const text =
    String(value);


  /*
   * Handle YYYY-MM-DD directly.
   * This prevents timezone shifts.
   */

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );


  if (match) {

    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}



/* =========================================================
   TODAY
========================================================= */

function getToday() {

  const now =
    new Date();


  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

}



/* =========================================================
   CALENDAR DAY DIFFERENCE
========================================================= */

function calendarDayDifference(
  olderDate,
  newerDate
) {

  if (
    !olderDate ||
    !newerDate
  ) {

    return null;

  }


  const oneDay =
    24 * 60 * 60 * 1000;


  return Math.round(
    (
      newerDate.getTime() -
      olderDate.getTime()
    ) / oneDay
  );

}



/* =========================================================
   ACTIVE STREAK
========================================================= */

function getDisplayStreak(
  streak,
  dateKey
) {

  if (!streak) {
    return 0;
  }


  const lastDate =
    parseDateOnly(
      streak[dateKey]
    );


  if (!lastDate) {
    return 0;
  }


  const today =
    getToday();


  const difference =
    calendarDayDifference(
      lastDate,
      today
    );


  /*
   * Today or yesterday = active.
   *
   * Anything older means the streak
   * should visually be reset.
   *
   * The backend itself should eventually
   * perform this reset too.
   */

  if (
    difference === 0 ||
    difference === 1
  ) {

    return Math.max(
      0,
      Number(
        streak.currentStreak
      ) || 0
    );

  }


  return 0;

}



/* =========================================================
   STREAK MESSAGE
========================================================= */

function buildStreakMessage(
  streak,
  dateKey,
  type
) {

  const lastDate =
    parseDateOnly(
      streak?.[dateKey]
    );


  const value =
    getDisplayStreak(
      streak,
      dateKey
    );


  if (!value) {

    if (type === "saving") {

      return "Save something today to start.";

    }


    return "Organize something today.";

  }


  const difference =
    calendarDayDifference(
      lastDate,
      getToday()
    );


  if (difference === 0) {

    if (type === "saving") {

      return "Great work. Your streak is active today.";

    }


    return "Keep organizing to build your streak.";

  }


  if (difference === 1) {

    if (type === "saving") {

      return "Save something today to keep it going.";

    }


    return "Add something today to keep it going.";

  }


  return "Start a new streak today.";

}



/* =========================================================
   UPDATE STREAKS
========================================================= */

function updateStreaks(
  streakData
) {

  const saving =
    streakData?.saving ||
    streakData?.savingStreak ||
    streakData?.save ||
    streakData ||
    {};


  const collection =
    streakData?.collection ||
    streakData?.collectionStreak ||
    {};


  const savingValue =
    getDisplayStreak(
      saving,
      "lastSavedDate"
    );


  const collectionValue =
    getDisplayStreak(
      collection,
      "lastCollectionDate"
    );


  if (savingStreak) {

    savingStreak.textContent =
      `${savingValue} ${
        savingValue === 1
          ? "day"
          : "days"
      }`;

  }


  if (collectionStreak) {

    collectionStreak.textContent =
      `${collectionValue} ${
        collectionValue === 1
          ? "day"
          : "days"
      }`;

  }


  if (savingStreakMessage) {

    savingStreakMessage.textContent =
      buildStreakMessage(
        saving,
        "lastSavedDate",
        "saving"
      );

  }


  if (collectionStreakMessage) {

    collectionStreakMessage.textContent =
      buildStreakMessage(
        collection,
        "lastCollectionDate",
        "collection"
      );

  }

}



/* =========================================================
   LOAD PAGE
========================================================= */

async function loadSavedPage() {

  if (!requireAuth()) {
    return;
  }


  try {

    if (savedGrid) {

      savedGrid.innerHTML = `
        <div class="saved-loading">
          <div class="loading-spinner"></div>
          <span>Loading your saved content...</span>
        </div>
      `;

    }


    if (collectionsGrid) {

      collectionsGrid.innerHTML = `
        <div class="collections-loading">
          <div class="loading-pulse"></div>
          <div class="loading-pulse short"></div>
        </div>
      `;

    }


    const [
      savedResponse,
      collectionsResponse,
      streakResponse
    ] =
      await Promise.all([
        apiFetch(SAVED_API),
        apiFetch(COLLECTION_API),
        apiFetch(`${SAVED_API}/streaks`)
      ]);


    savedItems =
      extractData(
        savedResponse
      ) || [];


    collections =
      extractData(
        collectionsResponse
      ) || [];


    if (!Array.isArray(savedItems)) {

      savedItems = [];

    }


    if (!Array.isArray(collections)) {

      collections = [];

    }


    updateStreaks(
      streakResponse || {}
    );


    renderCollections();

    renderSaved();


    /*
     * If a collection ID is present in the URL,
     * open it after the initial page has rendered.
     */

    const params =
      new URLSearchParams(
        window.location.search
      );


    const collectionId =
      params.get("collection");


    if (collectionId) {

      setTimeout(
        () => openCollection(collectionId),
        100
      );

    }

  } catch (error) {

    console.error(
      "Failed to load saved page:",
      error
    );


    if (savedGrid) {

      savedGrid.innerHTML = `
        <div class="saved-empty-state">
          <i class="bi bi-exclamation-circle"></i>
          <h3>Could not load your saves</h3>
          <p>${escapeHtml(error.message)}</p>
          <button
            class="modal-secondary-btn"
            onclick="loadSavedPage()"
          >
            Try again
          </button>
        </div>
      `;

    }


    if (collectionsGrid) {

      collectionsGrid.innerHTML = `
        <div class="saved-empty-state compact">
          <i class="bi bi-exclamation-circle"></i>
          <p>Could not load collections.</p>
        </div>
      `;

    }

  }

}



/* =========================================================
   FILTER
========================================================= */

function setFilter(
  filter
) {

  currentFilter =
    filter || "all";


  document
    .querySelectorAll(
      ".saved-filter"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter ===
          currentFilter
      );

    });


  renderSaved();

}



/* =========================================================
   FILTER MATCH
========================================================= */

function itemMatchesFilter(
  saved
) {

  if (
    currentFilter === "all"
  ) {

    return true;

  }


  const content =
    getSavedContent(saved);


  if (!content) {
    return false;
  }


  return (
    normalizeContentType(
      content
    ) === currentFilter
  );

}



/* =========================================================
   RENDER SAVED
========================================================= */

function renderSaved() {

  if (!savedGrid) {
    return;
  }


  const filtered =
    savedItems.filter(
      itemMatchesFilter
    );


  if (savedCount) {

    savedCount.textContent =
      `${savedItems.length} ${
        savedItems.length === 1
          ? "save"
          : "saves"
      }`;

  }


  if (!filtered.length) {

    const message =
      currentFilter === "all"
        ? "You haven't saved anything yet."
        : `No saved ${
            currentFilter === "ebook"
              ? "books"
              : currentFilter === "fashion"
                ? "products"
                : currentFilter === "essential"
                  ? "essentials"
                  : "videos"
          } yet.`;


    savedGrid.innerHTML = `
      <div class="saved-empty-state">

        <i class="bi bi-bookmark"></i>

        <h3>
          Nothing here yet
        </h3>

        <p>
          ${escapeHtml(message)}
        </p>

      </div>
    `;

    return;

  }


  savedGrid.innerHTML =
    filtered
      .map(
        renderSavedCard
      )
      .join("");

}



/* =========================================================
   RENDER SAVED CARD
========================================================= */

function renderSavedCard(
  saved
) {

  const content =
    getSavedContent(saved);


  if (!content) {
    return "";
  }


  const savedId =
    getSavedId(saved);


  const contentId =
    getContentId(saved);


  const type =
    normalizeContentType(
      content
    );


  const title =
    content.title ||
    content.name ||
    "Untitled";


  const description =
    content.description ||
    content.context ||
    "";


  const media =
    getPrimaryMedia(
      content
    );


  const mediaHtml =
    media
      ? `
        <img
          src="${escapeHtml(media)}"
          alt="${escapeHtml(title)}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      `
      : `
        <div class="saved-card-placeholder">
          <i class="bi ${
            type === "ebook"
              ? "bi-book"
              : type === "fashion"
                ? "bi-bag"
                : type === "essential"
                  ? "bi-box-seam"
                  : "bi-play-circle"
          }"></i>
        </div>
      `;


  const badge =
    type === "ebook"
      ? "Book"
      : type === "fashion"
        ? "Product"
        : type === "essential"
          ? "Essential"
          : "Video";


  return `
    <article
      class="saved-card"
      data-saved-id="${escapeHtml(savedId)}"
      data-content-id="${escapeHtml(contentId)}"
      onclick="openSavedContent('${escapeHtml(contentId)}')"
    >

      <div class="saved-card-media">

        ${mediaHtml}

        <span class="saved-type-badge">
          ${escapeHtml(badge)}
        </span>

        <button
          class="saved-card-menu"
          onclick="event.stopPropagation(); openItemActions('${escapeHtml(savedId)}')"
          aria-label="Saved item options"
        >
          <i class="bi bi-three-dots"></i>
        </button>

      </div>


      <div class="saved-card-body">

        <h3>
          ${escapeHtml(title)}
        </h3>


        ${
          description
            ? `
              <p>
                ${escapeHtml(
                  truncate(
                    description,
                    100
                  )
                )}
              </p>
            `
            : ""
        }


        <div class="saved-card-footer">

          <span>
            <i class="bi bi-bookmark-fill"></i>
            Saved
          </span>

          ${
            content.price !== null &&
            content.price !== undefined &&
            content.price !== ""
              ? `
                <strong>
                  ${formatPrice(content.price)}
                </strong>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;

}



/* =========================================================
   TRUNCATE
========================================================= */

function truncate(
  value,
  maxLength
) {

  const text =
    String(value || "");


  if (
    text.length <= maxLength
  ) {

    return text;

  }


  return (
    text.slice(
      0,
      maxLength - 1
    ) + "…"
  );

}



/* =========================================================
   PRICE
========================================================= */

function formatPrice(
  value
) {

  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return escapeHtml(
      value
    );

  }


  return (
    "₦" +
    number.toLocaleString(
      "en-NG",
      {
        maximumFractionDigits: 2
      }
    )
  );

}



/* =========================================================
   CONTENT URL
========================================================= */

function getContentUrl(
  content
) {

  const id =
    content?.id;


  if (!id) {

    return window.location.href;

  }


  const type =
    normalizeContentType(
      content
    );


  const origin =
    window.location.origin;


  if (type === "ebook") {

    return (
      `${origin}/ebook.html?id=${encodeURIComponent(id)}`
    );

  }


  if (
    type === "fashion" ||
    type === "essential"
  ) {

    return (
      `${origin}/product.html?id=${encodeURIComponent(id)}`
    );

  }


  return (
    `${origin}/video.html?id=${encodeURIComponent(id)}`
  );

}



/* =========================================================
   OPEN SAVED CONTENT
========================================================= */

function openSavedContent(
  contentId
) {

  const saved =
    savedItems.find(
      item =>
        String(
          getContentId(item)
        ) === String(contentId)
    );


  const content =
    getSavedContent(saved);


  if (!content) {

    window.location.href =
      `video.html?id=${encodeURIComponent(contentId)}`;

    return;

  }


  const type =
    normalizeContentType(
      content
    );


  if (type === "ebook") {

    window.location.href =
      `ebook.html?id=${encodeURIComponent(contentId)}`;

    return;

  }


  if (
    type === "fashion" ||
    type === "essential"
  ) {

    window.location.href =
      `product.html?id=${encodeURIComponent(contentId)}`;

    return;

  }


  window.location.href =
    `video.html?id=${encodeURIComponent(contentId)}`;

}



/* =========================================================
   ITEM ACTIONS
========================================================= */

function openItemActions(
  savedId
) {

  const item =
    savedItems.find(
      saved =>
        String(
          getSavedId(saved)
        ) === String(savedId)
    );


  if (!item) {

    console.warn(
      "Saved item not found:",
      savedId
    );

    return;

  }


  currentActionItem =
    item;


  const content =
    getSavedContent(item);


  if (itemActionTitle) {

    itemActionTitle.textContent =
      content?.title ||
      content?.name ||
      "Saved item";

  }


  openModal(
    itemActionModal
  );

}



/* =========================================================
   CLOSE ITEM ACTIONS
========================================================= */

function closeItemActions() {

  closeModal(
    itemActionModal
  );

  currentActionItem = null;

}



/* =========================================================
   SHARE CURRENT ITEM
========================================================= */

async function shareCurrentItem() {

  if (!currentActionItem) {
    return;
  }


  const content =
    getSavedContent(
      currentActionItem
    );


  if (!content) {
    return;
  }


  await shareContent(
    content
  );

}



/* =========================================================
   SHARE CONTENT
========================================================= */

async function shareContent(
  content
) {

  const url =
    getContentUrl(
      content
    );


  const title =
    content.title ||
    content.name ||
    "Vindarr";


  const text =
    `Check this out on Vindarr: ${title}`;


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        {
          title,
          text,
          url
        }
      );


      return;

    }

  } catch (error) {

    /*
     * User cancelling the native share
     * should not be treated as an error.
     */

    if (
      error?.name ===
      "AbortError"
    ) {

      return;

    }

  }


  try {

    await navigator.clipboard.writeText(
      url
    );


    showToast(
      "Link copied to clipboard."
    );


    closeItemActions();

    return;

  } catch {

    /*
     * Clipboard can be unavailable
     * on non-secure contexts.
     */

  }


  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      `${text}\n${url}`
    )}`;


  window.open(
    whatsappUrl,
    "_blank",
    "noopener,noreferrer"
  );

}



/* =========================================================
   SHARE COLLECTION
========================================================= */

async function shareCollection(
  collectionId
) {

  if (!collectionId) {
    return;
  }


  const collection =
    currentCollection &&
    String(
      currentCollection.id
    ) === String(collectionId)
      ? currentCollection
      : collections.find(
          item =>
            String(item.id) ===
            String(collectionId)
        );


  const name =
    collection?.name ||
    "My Vindarr collection";


  /*
   * This is the frontend share URL.
   *
   * The backend currently protects GET /collections/:id
   * to the owner. Therefore another user will need a
   * public collection endpoint before this link can be
   * viewed by someone else.
   */

  const url =
    `${window.location.origin}${window.location.pathname}?collection=${encodeURIComponent(collectionId)}`;


  const text =
    `Check out my Vindarr collection: ${name}`;


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        {
          title: name,
          text,
          url
        }
      );


      return;

    }

  } catch (error) {

    if (
      error?.name ===
      "AbortError"
    ) {

      return;

    }

  }


  try {

    await navigator.clipboard.writeText(
      url
    );


    showToast(
      "Collection link copied."
    );


    return;

  } catch {

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(
        `${text}\n${url}`
      )}`;


    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

  }

}



/* =========================================================
   REMOVE CURRENT SAVED ITEM
========================================================= */

async function removeCurrentSavedItem() {

  if (!currentActionItem) {
    return;
  }


  const savedId =
    getSavedId(
      currentActionItem
    );


  if (!savedId) {
    return;
  }


  const confirmed =
    window.confirm(
      "Remove this item from your saved content?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await apiFetch(
      `${SAVED_API}/${encodeURIComponent(savedId)}`,
      {
        method: "DELETE"
      }
    );


    savedItems =
      savedItems.filter(
        item =>
          String(
            getSavedId(item)
          ) !== String(savedId)
      );


    closeItemActions();

    renderSaved();

    await refreshCollections();

    /*
     * If the currently open collection contains
     * this saved item, refresh its detail too.
     */

    if (
      currentCollection?.id
    ) {

      await openCollection(
        currentCollection.id,
        false
      );

    }


    showToast(
      "Removed from saved."
    );

  } catch (error) {

    console.error(
      "Remove saved error:",
      error
    );


    showToast(
      error.message ||
      "Could not remove item."
    );

  }

}



/* =========================================================
   COLLECTIONS
========================================================= */

function renderCollections() {

  if (!collectionsGrid) {
    return;
  }


  if (!collections.length) {

    collectionsGrid.innerHTML = `
      <div class="collections-empty">

        <i class="bi bi-collection"></i>

        <h3>
          No collections yet
        </h3>

        <p>
          Group your saved content into
          collections you can return to.
        </p>

        <button
          class="modal-secondary-btn"
          onclick="openCreateCollection()"
        >
          <i class="bi bi-plus-lg"></i>
          Create your first collection
        </button>

      </div>
    `;

    return;

  }


  collectionsGrid.innerHTML =
    collections
      .map(
        renderCollectionCard
      )
      .join("");

}



/* =========================================================
   COLLECTION CARD
========================================================= */

function renderCollectionCard(
  collection
) {

  const id =
    collection.id;


  const name =
    collection.name ||
    "Untitled collection";


  const items =
    getCollectionItems(
      collection
    );


  const preview =
    getCollectionPreviewItems(
      items
    );


  const previewHtml =
    preview.length
      ? preview
          .map(
            item => {

              const content =
                getCollectionItemContent(
                  item
                );


              const media =
                getPrimaryMedia(
                  content
                );


              if (!media) {

                return `
                  <div class="collection-preview-placeholder">
                    <i class="bi bi-bookmark"></i>
                  </div>
                `;

              }


              return `
                <img
                  src="${escapeHtml(media)}"
                  alt=""
                  loading="lazy"
                  onerror="this.style.display='none'"
                >
              `;

            }
          )
          .join("")
      : `
          <div class="collection-preview-placeholder">
            <i class="bi bi-collection"></i>
          </div>
        `;


  return `
    <article
      class="collection-card"
      onclick="openCollection('${escapeHtml(id)}')"
    >

      <div class="collection-card-preview">

        ${previewHtml}

      </div>


      <div class="collection-card-body">

        <div>

          <h3>
            ${escapeHtml(name)}
          </h3>

          <span>
            ${items.length}
            ${items.length === 1 ? "item" : "items"}
          </span>

        </div>


        <button
          class="collection-card-arrow"
          onclick="event.stopPropagation(); openCollection('${escapeHtml(id)}')"
          aria-label="Open collection"
        >
          <i class="bi bi-arrow-up-right"></i>
        </button>

      </div>

    </article>
  `;

}



/* =========================================================
   COLLECTION ITEMS
========================================================= */

function getCollectionItems(
  collection
) {

  if (
    Array.isArray(
      collection?.items
    )
  ) {

    return collection.items;

  }


  if (
    Array.isArray(
      collection?.collectionItems
    )
  ) {

    return collection.collectionItems;

  }


  return [];

}



/* =========================================================
   COLLECTION ITEM CONTENT
========================================================= */

function getCollectionItemContent(
  item
) {

  return (
    item?.savedItem?.content ||
    item?.savedItem?.video ||
    item?.savedItem?.product ||
    item?.savedItem?.ebook ||
    item?.content ||
    item?.video ||
    item?.product ||
    item?.ebook ||
    null
  );

}



/* =========================================================
   COLLECTION ITEM SAVED ID
========================================================= */

function getCollectionItemSavedId(
  item
) {

  return (
    item?.savedItem?.id ||
    item?.savedItemId ||
    null
  );

}



/* =========================================================
   COLLECTION PREVIEW
========================================================= */

function getCollectionPreviewItems(
  items
) {

  return items
    .filter(
      item =>
        getCollectionItemContent(item)
    )
    .slice(0, 4);

}



/* =========================================================
   OPEN COLLECTION
========================================================= */

async function openCollection(
  id,
  showLoading = true
) {

  if (!id) {
    return;
  }


  try {

    if (
      showLoading &&
      collectionDetailContent
    ) {

      collectionDetailContent.innerHTML = `
        <div class="saved-loading">
          <div class="loading-spinner"></div>
          <span>Loading collection...</span>
        </div>
      `;

      openModal(
        collectionDetailModal
      );

    }


    const response =
      await apiFetch(
        `${COLLECTION_API}/${encodeURIComponent(id)}`
      );


    const collection =
      extractData(
        response
      );


    if (!collection) {

      throw new Error(
        "Collection not found."
      );

    }


    currentCollection =
      collection;


    /*
     * Keep the local collection list synchronized.
     */

    const index =
      collections.findIndex(
        item =>
          String(item.id) ===
          String(collection.id)
      );


    if (index >= 0) {

      collections[index] =
        collection;

    } else {

      collections.push(
        collection
      );

    }


    renderCollectionDetail(
      collection
    );


    openModal(
      collectionDetailModal
    );

  } catch (error) {

    console.error(
      "Open collection error:",
      error
    );


    if (collectionDetailContent) {

      collectionDetailContent.innerHTML = `
        <div class="saved-empty-state">

          <i class="bi bi-exclamation-circle"></i>

          <h3>
            Could not open collection
          </h3>

          <p>
            ${escapeHtml(error.message)}
          </p>

        </div>
      `;

    }


    openModal(
      collectionDetailModal
    );

  }

}



/* =========================================================
   RENDER COLLECTION DETAIL
========================================================= */

function renderCollectionDetail(
  collection
) {

  if (!collectionDetailContent) {
    return;
  }


  const id =
    collection.id;


  const name =
    collection.name ||
    "Untitled collection";


  const items =
    getCollectionItems(
      collection
    );


  collectionDetailContent.innerHTML = `

    <div class="collection-detail-header">

      <span class="modal-kicker">
        COLLECTION
      </span>


      <div class="collection-detail-title-row">

        <div>

          <h2>
            ${escapeHtml(name)}
          </h2>

          <p>
            ${items.length}
            ${items.length === 1 ? "item" : "items"}
          </p>

        </div>


        <button
          class="collection-share-btn"
          onclick="shareCollection('${escapeHtml(id)}')"
        >
          <i class="bi bi-share"></i>
          Share
        </button>

      </div>

    </div>


    ${
      items.length
        ? `
          <div
            class="collection-detail-items"
            data-collection-id="${escapeHtml(id)}"
          >

            ${items
              .map(
                renderCollectionItem
              )
              .join("")}

          </div>

          <small class="collection-drag-hint">
            <i class="bi bi-arrows-move"></i>
            Drag items to rearrange them.
          </small>
        `
        : `
          <div class="saved-empty-state compact">

            <i class="bi bi-collection"></i>

            <h3>
              This collection is empty
            </h3>

            <p>
              Add saved content from the
              item actions menu.
            </p>

          </div>
        `
    }


    <div class="collection-detail-actions">

      <button
        class="modal-secondary-btn"
        onclick="openCollectionMenu('${escapeHtml(id)}')"
      >
        <i class="bi bi-three-dots"></i>
        Collection options
      </button>

    </div>

  `;


  enableCollectionDragging(
    collectionDetailContent
  );

}



/* =========================================================
   RENDER COLLECTION ITEM
========================================================= */

function renderCollectionItem(
  item,
  index
) {

  const collectionItemId =
    item?.id;


  const savedId =
    getCollectionItemSavedId(
      item
    );


  const content =
    getCollectionItemContent(
      item
    );


  if (!content) {
    return "";
  }


  const contentId =
    content.id;


  const title =
    content.title ||
    content.name ||
    "Untitled";


  const media =
    getPrimaryMedia(
      content
    );


  const type =
    normalizeContentType(
      content
    );


  const mediaHtml =
    media
      ? `
        <img
          src="${escapeHtml(media)}"
          alt="${escapeHtml(title)}"
          loading="lazy"
        >
      `
      : `
        <div class="collection-item-placeholder">
          <i class="bi ${
            type === "ebook"
              ? "bi-book"
              : type === "fashion"
                ? "bi-bag"
                : "bi-play-circle"
          }"></i>
        </div>
      `;


  return `
    <article
      class="collection-item"
      draggable="true"
      data-collection-item-id="${escapeHtml(collectionItemId)}"
      data-saved-id="${escapeHtml(savedId)}"
      data-index="${index}"
    >

      <div class="collection-item-drag">
        <i class="bi bi-grip-vertical"></i>
      </div>


      <div
        class="collection-item-media"
        onclick="openSavedContent('${escapeHtml(contentId)}')"
      >
        ${mediaHtml}
      </div>


      <div
        class="collection-item-info"
        onclick="openSavedContent('${escapeHtml(contentId)}')"
      >

        <strong>
          ${escapeHtml(title)}
        </strong>

        <small>
          ${
            type === "ebook"
              ? "Book"
              : type === "fashion"
                ? "Product"
                : type === "essential"
                  ? "Essential"
                  : "Video"
          }
        </small>

      </div>


      <button
        class="collection-item-menu"
        onclick="event.stopPropagation(); openCollectionItemActions('${escapeHtml(collectionItemId)}', '${escapeHtml(savedId)}')"
        aria-label="Collection item options"
      >
        <i class="bi bi-three-dots"></i>
      </button>

    </article>
  `;

}



/* =========================================================
   DRAGGING
========================================================= */

function enableCollectionDragging(
  root
) {

  const container =
    root.querySelector(
      ".collection-detail-items"
    );


  if (!container) {
    return;
  }


  let dragged = null;


  container
    .querySelectorAll(
      ".collection-item"
    )
    .forEach(item => {

      item.addEventListener(
        "dragstart",
        event => {

          dragged =
            item;

          item.classList.add(
            "dragging"
          );


          event.dataTransfer.effectAllowed =
            "move";

        }
      );


      item.addEventListener(
        "dragend",
        async () => {

          item.classList.remove(
            "dragging"
          );


          if (!dragged) {
            return;
          }


          dragged = null;


          await persistCollectionOrder();

        }
      );


      item.addEventListener(
        "dragover",
        event => {

          event.preventDefault();


          if (
            !dragged ||
            dragged === item
          ) {

            return;

          }


          const rect =
            item.getBoundingClientRect();


          const midpoint =
            rect.top +
            rect.height / 2;


          if (
            event.clientY <
            midpoint
          ) {

            container.insertBefore(
              dragged,
              item
            );

          } else {

            container.insertBefore(
              dragged,
              item.nextSibling
            );

          }

        }
      );

    });

}



/* =========================================================
   PERSIST COLLECTION ORDER
========================================================= */

async function persistCollectionOrder() {

  if (
    !currentCollection?.id
  ) {

    return;

  }


  const container =
    collectionDetailContent?.querySelector(
      ".collection-detail-items"
    );


  if (!container) {
    return;
  }


  /*
   * IMPORTANT:
   * This uses COLLECTION ITEM IDs,
   * not saved IDs.
   */

  const itemIds =
    Array.from(
      container.querySelectorAll(
        ".collection-item"
      )
    )
      .map(
        element =>
          Number(
            element.dataset
              .collectionItemId
          )
      )
      .filter(
        Number.isFinite
      );


  if (!itemIds.length) {
    return;
  }


  try {

    await apiFetch(
      `${COLLECTION_API}/${encodeURIComponent(currentCollection.id)}/reorder`,
      {
        method: "PATCH",
        body: JSON.stringify({
          itemIds
        })
      }
    );


    showToast(
      "Collection order saved."
    );


  } catch (error) {

    console.error(
      "Reorder error:",
      error
    );


    showToast(
      "Could not save the new order."
    );


    /*
     * Re-fetch the collection so the UI
     * returns to the server's actual order.
     */

    await openCollection(
      currentCollection.id
    );

  }

}



/* =========================================================
   COLLECTION ITEM ACTIONS
========================================================= */

function openCollectionItemActions(
  collectionItemId,
  savedId
) {

  currentCollectionItem = {
    collectionItemId,
    savedId
  };


  /*
   * Reuse the existing item action modal.
   * The remove button will remove the save.
   * Move will move the saved item.
   */

  const saved =
    savedItems.find(
      item =>
        String(
          getSavedId(item)
        ) === String(savedId)
    );


  currentActionItem =
    saved || null;


  if (itemActionTitle) {

    const content =
      getSavedContent(saved);


    itemActionTitle.textContent =
      content?.title ||
      content?.name ||
      "Saved item";

  }


  openModal(
    itemActionModal
  );

}



/* =========================================================
   REMOVE FROM CURRENT COLLECTION
========================================================= */

async function removeFromCollection(
  collectionItemId
) {

  if (!collectionItemId) {
    return;
  }


  try {

    await apiFetch(
      `${COLLECTION_API}/items/${encodeURIComponent(collectionItemId)}`,
      {
        method: "DELETE"
      }
    );


    showToast(
      "Removed from collection."
    );


    if (
      currentCollection?.id
    ) {

      await openCollection(
        currentCollection.id
      );

    }


    await refreshCollections();

  } catch (error) {

    console.error(
      "Remove collection item error:",
      error
    );


    showToast(
      error.message ||
      "Could not remove item."
    );

  }

}



/* =========================================================
   COLLECTION MENU
========================================================= */

function openCollectionMenu(
  collectionId
) {

  const collection =
    collections.find(
      item =>
        String(item.id) ===
        String(collectionId)
    );


  if (!collection) {
    return;
  }


  const choice =
    window.prompt(
      "Type DELETE to delete this collection, or Cancel to close.",
      ""
    );


  if (
    String(choice)
      .trim()
      .toUpperCase() ===
    "DELETE"
  ) {

    deleteCollection(
      collectionId
    );

  }

}



/* =========================================================
   DELETE COLLECTION
========================================================= */

async function deleteCollection(
  collectionId
) {

  if (!collectionId) {
    return;
  }


  const confirmed =
    window.confirm(
      "Delete this collection? Your saved content will not be deleted."
    );


  if (!confirmed) {
    return;
  }


  try {

    await apiFetch(
      `${COLLECTION_API}/${encodeURIComponent(collectionId)}`,
      {
        method: "DELETE"
      }
    );


    collections =
      collections.filter(
        item =>
          String(item.id) !==
          String(collectionId)
      );


    if (
      currentCollection?.id &&
      String(
        currentCollection.id
      ) === String(collectionId)
    ) {

      currentCollection = null;

      closeCollectionDetail();

    }


    renderCollections();


    showToast(
      "Collection deleted."
    );

  } catch (error) {

    console.error(
      "Delete collection error:",
      error
    );


    showToast(
      error.message ||
      "Could not delete collection."
    );

  }

}



/* =========================================================
   MOVE COLLECTION
========================================================= */

function openMoveCollection() {

  if (!currentActionItem) {

    showToast(
      "No saved item selected."
    );

    return;

  }


  closeItemActions();


  renderMoveCollectionList();


  openModal(
    moveCollectionModal
  );

}



/* =========================================================
   CLOSE MOVE COLLECTION
========================================================= */

function closeMoveCollection() {

  closeModal(
    moveCollectionModal
  );

}



/* =========================================================
   RENDER MOVE COLLECTION LIST
========================================================= */

function renderMoveCollectionList() {

  if (!moveCollectionList) {
    return;
  }


  if (!collections.length) {

    moveCollectionList.innerHTML = `
      <div class="saved-empty-state compact">

        <i class="bi bi-collection"></i>

        <p>
          You don't have any collections yet.
        </p>

      </div>
    `;

    return;

  }


  moveCollectionList.innerHTML =
    collections
      .map(
        collection => {

          const id =
            collection.id;


          const name =
            collection.name ||
            "Untitled collection";


          const itemCount =
            getCollectionItems(
              collection
            ).length;


          return `
            <button
              class="move-collection-option"
              onclick="moveCurrentItem('${escapeHtml(id)}')"
            >

              <span class="move-collection-icon">
                <i class="bi bi-collection"></i>
              </span>

              <span>

                <strong>
                  ${escapeHtml(name)}
                </strong>

                <small>
                  ${itemCount}
                  ${itemCount === 1 ? "item" : "items"}
                </small>

              </span>

              <i class="bi bi-chevron-right"></i>

            </button>
          `;

        }
      )
      .join("");

}



/* =========================================================
   MOVE CURRENT ITEM
========================================================= */

async function moveCurrentItem(
  collectionId
) {

  if (!currentActionItem) {
    return;
  }


  const savedId =
    getSavedId(
      currentActionItem
    );


  if (!savedId) {
    return;
  }


  try {

    const response =
      await apiFetch(
        `${COLLECTION_API}/${encodeURIComponent(collectionId)}/items`,
        {
          method: "POST",
          body: JSON.stringify({
            savedItemId: Number(savedId)
          })
        }
      );


    /*
     * Backend duplicate protection may return
     * a message instead of creating a duplicate.
     */

    const message =
      response?.message ||
      "";


    if (
      String(message)
        .toLowerCase()
        .includes("already")
    ) {

      showToast(
        "This item is already in that collection."
      );

    } else {

      showToast(
        "Added to collection."
      );

    }


    closeMoveCollection();


    await refreshCollections();


    if (
      currentCollection?.id
    ) {

      await openCollection(
        currentCollection.id
      );

    }

  } catch (error) {

    console.error(
      "Move item error:",
      error
    );


    showToast(
      error.message ||
      "Could not add item to collection."
    );

  } finally {

    currentActionItem = null;

  }

}



/* =========================================================
   CREATE COLLECTION
========================================================= */

function openCreateCollection() {

  creatingCollectionFromMove =
    false;


  if (collectionNameInput) {

    collectionNameInput.value =
      "";

  }


  collectionCoverMode =
    "auto";


  selectCoverOption(
    "auto"
  );


  openModal(
    collectionModal
  );


  setTimeout(
    () => {

      collectionNameInput?.focus();

    },
    100
  );

}



/* =========================================================
   CREATE COLLECTION FROM MOVE
========================================================= */

function openCreateCollectionFromMove() {

  creatingCollectionFromMove =
    true;


  closeMoveCollection();

  openCreateCollection();

}



/* =========================================================
   CLOSE CREATE COLLECTION
========================================================= */

function closeCreateCollection() {

  closeModal(
    collectionModal
  );


  creatingCollectionFromMove =
    false;

}



/* =========================================================
   COVER OPTION
========================================================= */

function selectCoverOption(
  mode
) {

  collectionCoverMode =
    mode || "auto";


  document
    .querySelectorAll(
      ".cover-option"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.cover ===
          collectionCoverMode
      );

    });

}



/* =========================================================
   CREATE COLLECTION
========================================================= */

async function createCollection() {

  const name =
    collectionNameInput?.value
      ?.trim();


  if (!name) {

    showToast(
      "Give your collection a name."
    );


    collectionNameInput?.focus();

    return;

  }


  if (
    name.length > 80
  ) {

    showToast(
      "Collection name is too long."
    );

    return;

  }


  const button =
    document.querySelector(
      ".modal-primary-btn"
    );


  const originalText =
    button?.textContent;


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Creating...";

    }


    const response =
      await apiFetch(
        COLLECTION_API,
        {
          method: "POST",
          body: JSON.stringify({
            name
          })
        }
      );


    const created =
      extractData(
        response
      );


    if (created) {

      collections.push(
        created
      );

    }


    closeCreateCollection();


    renderCollections();


    showToast(
      "Collection created."
    );


    /*
     * If this creation came from the Move modal,
     * immediately move the current saved item into it.
     */

    if (
      creatingCollectionFromMove &&
      created?.id &&
      currentActionItem
    ) {

      await moveCurrentItem(
        created.id
      );

    }


  } catch (error) {

    console.error(
      "Create collection error:",
      error
    );


    showToast(
      error.message ||
      "Could not create collection."
    );

  } finally {

    creatingCollectionFromMove =
      false;


    if (button) {

      button.disabled =
        false;

      button.textContent =
        originalText ||
        "Create collection";

    }

  }

}



/* =========================================================
   REFRESH COLLECTIONS
========================================================= */

async function refreshCollections() {

  try {

    const response =
      await apiFetch(
        COLLECTION_API
      );


    collections =
      extractData(
        response
      ) || [];


    if (!Array.isArray(collections)) {

      collections = [];

    }


    renderCollections();


    /*
     * Refresh currently open collection
     * as well, so removing/moving/reordering
     * never leaves stale collection UI.
     */

    if (
      currentCollection?.id
    ) {

      const fresh =
        collections.find(
          item =>
            String(item.id) ===
            String(currentCollection.id)
        );


      if (fresh) {

        /*
         * The list endpoint may not contain
         * complete items, so use the detail
         * endpoint for the open collection.
         */

        try {

          const detailResponse =
            await apiFetch(
              `${COLLECTION_API}/${encodeURIComponent(currentCollection.id)}`
            );


          const detail =
            extractData(
              detailResponse
            );


          if (detail) {

            currentCollection =
              detail;

            renderCollectionDetail(
              detail
            );

          }

        } catch (detailError) {

          console.warn(
            "Could not refresh collection detail:",
            detailError
          );

        }

      }

    }

  } catch (error) {

    console.error(
      "Refresh collections error:",
      error
    );

  }

}



/* =========================================================
   SCROLL
========================================================= */

function scrollToCollections() {

  const section =
    document.querySelector(
      ".collections-section"
    );


  if (!section) {
    return;
  }


  section.scrollIntoView(
    {
      behavior: "smooth",
      block: "start"
    }
  );

}



/* =========================================================
   SAVED PAGE MENU
========================================================= */

function openSavedMenu() {

  savedMenu?.classList.add(
    "open"
  );

}



/* =========================================================
   CLOSE SAVED MENU
========================================================= */

function closeSavedMenu() {

  savedMenu?.classList.remove(
    "open"
  );

}



/* =========================================================
   MODAL HELPERS
========================================================= */

function openModal(
  modal
) {

  if (!modal) {
    return;
  }


  modal.classList.add(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "modal-open"
  );

}



/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal(
  modal
) {

  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  if (
    !document.querySelector(
      ".saved-modal.open"
    )
  ) {

    document.body.classList.remove(
      "modal-open"
    );

  }

}



/* =========================================================
   CLOSE COLLECTION DETAIL
========================================================= */

function closeCollectionDetail() {

  closeModal(
    collectionDetailModal
  );


  currentCollection =
    null;


  /*
   * Remove collection query parameter
   * after closing a shared/opened collection.
   */

  const url =
    new URL(
      window.location.href
    );


  url.searchParams.delete(
    "collection"
  );


  window.history.replaceState(
    {},
    "",
    url
  );

}



/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  const existing =
    document.querySelector(
      ".saved-toast"
    );


  existing?.remove();


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    "saved-toast";


  toast.textContent =
    message;


  document.body.appendChild(
    toast
  );


  requestAnimationFrame(
    () => {

      toast.classList.add(
        "show"
      );

    }
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );


      setTimeout(
        () => toast.remove(),
        250
      );

    },
    2800
  );

}



/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeSavedMenu();

      closeCreateCollection();

      closeCollectionDetail();

      closeItemActions();

      closeMoveCollection();

    }

  }
);



/* =========================================================
   OUTSIDE PAGE MENU
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      !savedMenu ||
      !savedMenu.classList.contains(
        "open"
      )
    ) {

      return;

    }


    if (
      !savedMenu.contains(
        event.target
      ) &&
      !event.target.closest(
        ".saved-icon-btn"
      )
    ) {

      closeSavedMenu();

    }

  }
);



/* =========================================================
   COLLECTION NAME ENTER KEY
========================================================= */

collectionNameInput?.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      createCollection();

    }

  }
);



/* =========================================================
   LEGACY SAVED MIGRATION
========================================================= */

function migrateLegacySaved() {

  /*
   * Kept as a compatibility hook.
   *
   * Older Vindarr versions may have stored
   * local saved IDs. We intentionally don't
   * automatically POST them because doing so
   * could create duplicate saves.
   */

  try {

    const legacy =
      localStorage.getItem(
        "savedVideos"
      );


    if (!legacy) {
      return;
    }


    /*
     * Don't delete legacy data automatically.
     * This makes the migration safe.
     */

  } catch (error) {

    console.warn(
      "Legacy saved migration skipped:",
      error
    );

  }

}



/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSavedPage();

  }
);



/* =========================================================
   GLOBAL EXPORTS
   Required because saved.html uses inline
   onclick handlers.
========================================================= */

window.setFilter =
  setFilter;

window.openSavedMenu =
  openSavedMenu;

window.closeSavedMenu =
  closeSavedMenu;

window.openCreateCollection =
  openCreateCollection;

window.closeCreateCollection =
  closeCreateCollection;

window.createCollection =
  createCollection;

window.selectCoverOption =
  selectCoverOption;

window.openCollection =
  openCollection;

window.closeCollectionDetail =
  closeCollectionDetail;

window.shareCollection =
  shareCollection;

window.openItemActions =
  openItemActions;

window.closeItemActions =
  closeItemActions;

window.shareCurrentItem =
  shareCurrentItem;

window.removeCurrentSavedItem =
  removeCurrentSavedItem;

window.openMoveCollection =
  openMoveCollection;

window.closeMoveCollection =
  closeMoveCollection;

window.moveCurrentItem =
  moveCurrentItem;

window.openCreateCollectionFromMove =
  openCreateCollectionFromMove;

window.removeFromCollection =
  removeFromCollection;

window.openCollectionItemActions =
  openCollectionItemActions;

window.openCollectionMenu =
  openCollectionMenu;

window.deleteCollection =
  deleteCollection;

window.scrollToCollections =
  scrollToCollections;

window.openSavedContent =
  openSavedContent;

window.shareContent =
  shareContent;

window.refreshCollections =
  refreshCollections;