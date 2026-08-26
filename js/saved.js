/* =========================================================
   VINDARR SAVED
   SAVE • COLLECTIONS • STREAKS • SHARING
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


/* =========================================================
   AUTH
========================================================= */

function getToken() {

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return null;

  }

  return token;

}


/* =========================================================
   FETCH HELPER
========================================================= */

async function apiFetch(
  url,
  options = {}
) {

  const token =
    getToken();

  if (!token) {

    throw new Error(
      "Authentication required."
    );

  }

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : {
          "Content-Type":
            "application/json"
        }),

    Authorization:
      `Bearer ${token}`,

    ...(options.headers || {})
  };


  const response =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    );


  const text =
    await response.text();


  let data = null;


  if (text) {

    try {

      data =
        JSON.parse(text);

    }
    catch {

      data = {
        message: text
      };

    }

  }


  if (response.status === 401) {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href =
      "login.html";

    throw new Error(
      "Session expired."
    );

  }


  if (!response.ok) {

    throw new Error(
      data?.message ||
      "Request failed."
    );

  }


  return data;

}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadSavedPage() {

  try {

    renderSavedLoading();

    const [
      savedResponse,
      collectionsResponse,
      streakResponse
    ] =
      await Promise.all([

        apiFetch(
          SAVED_API
        ),

        apiFetch(
          COLLECTION_API
        ),

        apiFetch(
          `${SAVED_API}/streaks`
        )

      ]);


    savedItems =
      Array.isArray(savedResponse?.data)
        ? savedResponse.data
        : Array.isArray(savedResponse)
          ? savedResponse
          : [];


    collections =
      Array.isArray(collectionsResponse?.data)
        ? collectionsResponse.data
        : Array.isArray(collectionsResponse)
          ? collectionsResponse
          : [];


    updateStreaks(
      streakResponse
    );


    renderCollections();

    renderSaved();

    migrateLegacyLocalStorage();

  }
  catch (error) {

    console.error(
      "SAVED PAGE ERROR:",
      error
    );

    renderError(
      error.message
    );

  }

}


/* =========================================================
   STREAKS
========================================================= */

function updateStreaks(
  data
) {

  const saving =
    data?.saving || {};

  const collection =
    data?.collection || {};


  const savingDays =
    Number(
      saving.currentStreak || 0
    );


  const collectionDays =
    Number(
      collection.currentStreak || 0
    );


  savingStreak.textContent =
    `${savingDays} ${
      savingDays === 1
        ? "day"
        : "days"
    }`;


  collectionStreak.textContent =
    `${collectionDays} ${
      collectionDays === 1
        ? "day"
        : "days"
    }`;


  savingStreakMessage.textContent =
    savingDays > 0
      ? "Keep saving to continue."
      : "Save something today to start.";


  collectionStreakMessage.textContent =
    collectionDays > 0
      ? "Keep organizing your saves."
      : "Add something to a collection today.";

}


/* =========================================================
   FILTER
========================================================= */

function setFilter(
  filter
) {

  currentFilter =
    filter;


  document
    .querySelectorAll(
      ".saved-filter"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.filter === filter
        );

      }
    );


  renderSaved();

}


/* =========================================================
   FILTER ITEMS
========================================================= */

function getFilteredItems() {

  if (
    currentFilter ===
    "all"
  ) {

    return savedItems;

  }


  return savedItems.filter(
    item =>
      item.content?.type ===
        currentFilter ||
      item.type ===
        currentFilter
  );

}


/* =========================================================
   RENDER SAVED
========================================================= */

function renderSaved() {

  const items =
    getFilteredItems();


  savedCount.textContent =
    `${items.length} ${
      items.length === 1
        ? "save"
        : "saves"
    }`;


  if (!items.length) {

    renderSavedEmpty();

    return;

  }


  savedGrid.innerHTML =
    items
      .map(
        renderSavedCard
      )
      .join("");

}


/* =========================================================
   SAVED CARD
========================================================= */

function renderSavedCard(
  item
) {

  const content =
    item.content ||
    item;


  const id =
    Number(
      content.id
    );


  const type =
    content.type ||
    item.type ||
    "video";


  const title =
    content.title ||
    "Untitled";


  const creator =
    content.creatorUsername ||
    "creator";


  const avatar =
    normalizeMediaUrl(
      content.creatorAvatar
    );


  const media =
    getPrimaryMedia(
      content
    );


  const typeLabel =
    getTypeLabel(
      type
    );


  const icon =
    getTypeIcon(
      type
    );


  const price =
    content.price != null &&
    Number(content.price) > 0
      ? formatNaira(
          content.price
        )
      : "";


  const understands =
    Number(
      content.understandCount || 0
    );


  return `

    <article
      class="saved-card"
      onclick="openSavedContent(${id})"
    >

      <div class="saved-thumbnail">

        ${renderMedia(
          content,
          type,
          media
        )}

        <span class="saved-type-badge">

          <i class="bi ${icon}"></i>

          ${escapeHtml(typeLabel)}

        </span>


        <button
          class="saved-action-btn"
          onclick="event.stopPropagation(); openItemActions(${Number(item.id || 0)})"
          aria-label="Saved item options"
        >

          <i class="bi bi-three-dots"></i>

        </button>

      </div>


      <div class="saved-content">

        <h3>
          ${escapeHtml(title)}
        </h3>


        <div class="saved-creator">

          <img
            src="${escapeHtml(avatar)}"
            alt=""
            onerror="this.style.display='none'"
          >

          <span>
            @${escapeHtml(creator)}
          </span>

        </div>


        <div class="saved-meta">

          <span class="saved-understands">

            ${
              understands.toLocaleString()
            }
            Understands

          </span>


          ${
            price
              ? `
                <span class="saved-price">
                  ${escapeHtml(price)}
                </span>
              `
              : ""
          }

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   MEDIA
========================================================= */

function renderMedia(
  content,
  type,
  media
) {

  if (
    type ===
    "ebook"
  ) {

    const cover =
      normalizeMediaUrl(
        content.coverUrl
      );


    if (cover) {

      return `
        <img
          class="saved-book-cover"
          src="${escapeHtml(cover)}"
          alt=""
          loading="lazy"
        >
      `;

    }


    return `
      <div class="book-placeholder">
        <i class="bi bi-book"></i>
      </div>
    `;

  }


  if (
    type ===
      "fashion" ||
    type ===
      "essential"
  ) {

    if (
      media
    ) {

      if (
        isVideoUrl(
          media
        )
      ) {

        return `
          <video
            src="${escapeHtml(media)}"
            muted
            playsinline
            preload="metadata"
          ></video>
        `;

      }


      return `
        <img
          src="${escapeHtml(media)}"
          alt=""
          loading="lazy"
        >
      `;

    }

  }


  if (
    media
  ) {

    if (
      isVideoUrl(
        media
      )
    ) {

      return `
        <video
          src="${escapeHtml(media)}"
          muted
          playsinline
          preload="metadata"
        ></video>
      `;

    }


    return `
      <img
        src="${escapeHtml(media)}"
        alt=""
        loading="lazy"
      >
    `;

  }


  return `
    <div class="book-placeholder">
      <i class="bi bi-file-earmark"></i>
    </div>
  `;

}


/* =========================================================
   MEDIA URL
========================================================= */

function getPrimaryMedia(
  content
) {

  return normalizeMediaUrl(
    content.coverUrl ||
    content.videoUrl ||
    content.fileUrl
  );

}


function normalizeMediaUrl(
  url
) {

  if (!url) {

    return "";

  }


  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {

    return url;

  }


  return `${API_BASE_URL}${url}`;

}


function isVideoUrl(
  url
) {

  return (
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(
      url
    ) ||
    url.includes(
      "/video/upload/"
    )
  );

}


/* =========================================================
   TYPE HELPERS
========================================================= */

function getTypeLabel(
  type
) {

  if (
    type === "ebook"
  ) {

    return "Book";

  }


  if (
    type === "fashion"
  ) {

    return "Product";

  }


  if (
    type === "essential"
  ) {

    return "Essential";

  }


  return "Video";

}


function getTypeIcon(
  type
) {

  if (
    type === "ebook"
  ) {

    return "bi-book-fill";

  }


  if (
    type === "fashion"
  ) {

    return "bi-bag-fill";

  }


  if (
    type === "essential"
  ) {

    return "bi-box-seam-fill";

  }


  return "bi-play-btn-fill";

}


/* =========================================================
   COLLECTIONS
========================================================= */

function renderCollections() {

  if (!collections.length) {

    collectionsGrid.innerHTML = `

      <div class="saved-empty">

        <div class="saved-empty-icon">

          <i class="bi bi-collection"></i>

        </div>

        <h3>
          Create your first collection
        </h3>

        <p>
          Group saved videos, books and products
          into collections you name yourself.
        </p>

        <button
          onclick="openCreateCollection()"
        >
          Create collection
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


function renderCollectionCard(
  collection
) {

  const items =
    collection.items ||
    collection.collectionItems ||
    [];


  const previews =
    items
      .slice(0,4)
      .map(
        item => {

          const content =
            item.savedItem?.content ||
            item.content ||
            item.savedItem ||
            null;


          return normalizeMediaUrl(
            content?.coverUrl ||
            content?.videoUrl ||
            content?.fileUrl
          );

        }
      )
      .filter(Boolean);


  const collage =
    previews.length
      ? previews
          .map(
            url => `
              <img
                src="${escapeHtml(url)}"
                alt=""
                loading="lazy"
              >
            `
          )
          .join("")
      : `
          <div
            style="
              width:100%;
              height:100%;
              background:
              linear-gradient(
                135deg,
                #180000,
                #d10000
              );
            "
          ></div>
        `;


  return `

    <article
      class="collection-card"
      onclick="openCollection(${Number(collection.id)})"
    >

      <div class="collection-collage">

        ${collage}

      </div>

      <div class="collection-overlay"></div>


      <button
        class="collection-menu"
        onclick="
          event.stopPropagation();
          openCollectionMenu(${Number(collection.id)});
        "
      >
        <i class="bi bi-three-dots"></i>
      </button>


      <div class="collection-info">

        <h3>
          ${escapeHtml(
            collection.name ||
            "Collection"
          )}
        </h3>

        <span>

          ${
            Number(
              collection.itemCount ??
              items.length ??
              0
            )
          }
          ${
            Number(
              collection.itemCount ??
              items.length ??
              0
            ) === 1
              ? "save"
              : "saves"
          }

        </span>

      </div>

    </article>

  `;

}


/* =========================================================
   CREATE COLLECTION
========================================================= */

function openCreateCollection() {

  const modal =
    document.getElementById(
      "collectionModal"
    );


  modal.classList.add(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(
    () =>
      document
        .getElementById(
          "collectionName"
        )
        ?.focus(),
    100
  );

}


function closeCreateCollection() {

  const modal =
    document.getElementById(
      "collectionModal"
    );


  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document
    .getElementById(
      "collectionName"
    ).value = "";

}


async function createCollection() {

  const input =
    document.getElementById(
      "collectionName"
    );


  const name =
    input.value.trim();


  if (!name) {

    input.focus();

    return;

  }


  try {

    const result =
      await apiFetch(
        COLLECTION_API,
        {
          method: "POST",

          body:
            JSON.stringify({
              name
            })
        }
      );


    const collection =
      result?.data ||
      result;


    if (collection) {

      collections.unshift(
        collection
      );

    }


    closeCreateCollection();

    renderCollections();

    showToast(
      "Collection created."
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   COLLECTION DETAIL
========================================================= */

async function openCollection(
  collectionId
) {

  try {

    const result =
      await apiFetch(
        `${COLLECTION_API}/${collectionId}`
      );


    currentCollection =
      result?.data ||
      result;


    renderCollectionDetail(
      currentCollection
    );


    const modal =
      document.getElementById(
        "collectionDetailModal"
      );


    modal.classList.add(
      "open"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


function renderCollectionDetail(
  collection
) {

  const container =
    document.getElementById(
      "collectionDetailContent"
    );


  const items =
    collection.items ||
    collection.collectionItems ||
    [];


  container.innerHTML = `

    <span class="modal-kicker">
      COLLECTION
    </span>

    <h2>
      ${escapeHtml(
        collection.name
      )}
    </h2>

    <p>
      Drag saved content to rearrange it.
    </p>

    <div
      id="collectionItems"
      class="collection-detail-items"
    >

      ${
        items.length
          ? items
              .map(
                renderCollectionItem
              )
              .join("")
          : `
            <div class="saved-empty">
              <div class="saved-empty-icon">
                <i class="bi bi-collection"></i>
              </div>

              <h3>
                This collection is empty.
              </h3>

              <p>
                Add saved content to start building it.
              </p>
            </div>
          `
      }

    </div>

  `;


  enableCollectionDrag();
}


function renderCollectionItem(
  item,
  index
) {

  const saved =
    item.savedItem ||
    item;


  const content =
    saved.content ||
    saved;


  const media =
    normalizeMediaUrl(
      content.coverUrl ||
      content.videoUrl ||
      content.fileUrl
    );


  return `

    <article
      class="collection-detail-item"
      draggable="true"
      data-item-id="${Number(
        item.id ||
        saved.id
      )}"
    >

      <div class="drag-handle">

        <i class="bi bi-grip-vertical"></i>

      </div>


      <div class="collection-item-media">

        ${
          media
            ? `
              <img
                src="${escapeHtml(media)}"
                alt=""
              >
            `
            : `
              <i class="bi bi-file-earmark"></i>
            `
        }

      </div>


      <div class="collection-item-copy">

        <strong>
          ${escapeHtml(
            content.title ||
            "Untitled"
          )}
        </strong>

        <small>
          ${escapeHtml(
            getTypeLabel(
              content.type ||
              saved.type
            )
          )}
        </small>

      </div>


      <button
        class="collection-remove-btn"
        onclick="
          removeFromCollection(
            ${Number(
              item.id ||
              saved.id
            )}
          )
        "
      >
        <i class="bi bi-x"></i>
      </button>

    </article>

  `;

}


function closeCollectionDetail() {

  const modal =
    document.getElementById(
      "collectionDetailModal"
    );


  modal.classList.remove(
    "open"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  currentCollection =
    null;

}


/* =========================================================
   DRAG REORDER
========================================================= */

function enableCollectionDrag() {

  const container =
    document.getElementById(
      "collectionItems"
    );


  if (!container) {

    return;

  }


  let dragged = null;


  container
    .querySelectorAll(
      ".collection-detail-item"
    )
    .forEach(
      item => {

        item.addEventListener(
          "dragstart",
          () => {

            dragged =
              item;

            item.classList.add(
              "dragging"
            );

          }
        );


        item.addEventListener(
          "dragend",
          async () => {

            item.classList.remove(
              "dragging"
            );

            await saveCollectionOrder();

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


            const after =
              event.clientY -
              rect.top >
              rect.height / 2;


            if (after) {

              item.after(
                dragged
              );

            }
            else {

              item.before(
                dragged
              );

            }

          }
        );

      }
    );

}


async function saveCollectionOrder() {

  if (!currentCollection) {

    return;

  }


  const container =
    document.getElementById(
      "collectionItems"
    );


  if (!container) {

    return;

  }


  const ids =
    [
      ...container.querySelectorAll(
        ".collection-detail-item"
      )
    ]
      .map(
        item =>
          Number(
            item.dataset.itemId
          )
      );


  try {

    await apiFetch(
      `${COLLECTION_API}/${currentCollection.id}/reorder`,
      {
        method: "PATCH",

        body:
          JSON.stringify({
            itemIds: ids
          })
      }
    );

    showToast(
      "Collection reordered."
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   ITEM ACTIONS
========================================================= */

function openItemActions(
  savedId
) {

  currentActionItem =
    savedItems.find(
      item =>
        Number(item.id) ===
        Number(savedId)
    );


  if (!currentActionItem) {

    return;

  }


  const content =
    currentActionItem.content ||
    currentActionItem;


  document.getElementById(
    "itemActionTitle"
  ).textContent =
    content.title ||
    "Saved item";


  const modal =
    document.getElementById(
      "itemActionModal"
    );


  modal.classList.add(
    "open"
  );

}


function closeItemActions() {

  document
    .getElementById(
      "itemActionModal"
    )
    .classList.remove(
      "open"
    );

}


async function removeCurrentSavedItem() {

  if (
    !currentActionItem
  ) {

    return;

  }


  const id =
    Number(
      currentActionItem.id
    );


  try {

    await apiFetch(
      `${SAVED_API}/${id}`,
      {
        method:
          "DELETE"
      }
    );


    savedItems =
      savedItems.filter(
        item =>
          Number(item.id) !==
          id
      );


    closeItemActions();

    renderSaved();

    showToast(
      "Removed from saved."
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   MOVE TO COLLECTION
========================================================= */

function openMoveCollection() {

  if (!currentActionItem) {

    return;

  }


  closeItemActions();


  const list =
    document.getElementById(
      "moveCollectionList"
    );


  if (!collections.length) {

    list.innerHTML = `

      <div class="saved-empty">

        <h3>
          No collections yet.
        </h3>

        <p>
          Create a collection first.
        </p>

      </div>

    `;

  }
  else {

    list.innerHTML =
      collections
        .map(
          collection => `

            <button
              class="move-collection-item"
              onclick="
                moveCurrentItemToCollection(
                  ${Number(collection.id)}
                )
              "
            >

              <i class="bi bi-collection-fill"></i>

              <span>

                <strong>
                  ${escapeHtml(
                    collection.name
                  )}
                </strong>

                <small>
                  ${
                    Number(
                      collection.itemCount ||
                      0
                    )
                  }
                  saves
                </small>

              </span>

            </button>

          `
        )
        .join("");

  }


  const modal =
    document.getElementById(
      "moveCollectionModal"
    );


  modal.classList.add(
    "open"
  );

}


function closeMoveCollection() {

  document
    .getElementById(
      "moveCollectionModal"
    )
    .classList.remove(
      "open"
    );

}


async function moveCurrentItemToCollection(
  collectionId
) {

  if (!currentActionItem) {

    return;

  }


  try {

    await apiFetch(
      `${COLLECTION_API}/${collectionId}/items`,
      {
        method: "POST",

        body:
          JSON.stringify({
            savedItemId:
              Number(
                currentActionItem.id
              )
          })
      }
    );


    closeMoveCollection();

    showToast(
      "Added to collection."
    );


    await refreshCollections();

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


function openCreateCollectionFromMove() {

  closeMoveCollection();

  openCreateCollection();

}


/* =========================================================
   REMOVE FROM COLLECTION
========================================================= */

async function removeFromCollection(
  collectionItemId
) {

  if (!currentCollection) {

    return;

  }


  try {

    await apiFetch(
      `${COLLECTION_API}/items/${collectionItemId}`,
      {
        method: "DELETE"
      }
    );


    currentCollection.items =
      (
        currentCollection.items ||
        []
      ).filter(
        item =>
          Number(item.id) !==
          Number(collectionItemId)
      );


    renderCollectionDetail(
      currentCollection
    );

    refreshCollections();

    showToast(
      "Removed from collection."
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   SHARE
========================================================= */

async function shareCurrentItem() {

  if (!currentActionItem) {

    return;

  }


  const content =
    currentActionItem.content ||
    currentActionItem;


  await shareContent(
    content
  );

}


async function shareContent(
  content
) {

  const url =
    `${window.location.origin}/video.html?id=${content.id}`;


  const title =
    content.title ||
    "Something I saved on Vindarr";


  const text =
    `Check this out on Vindarr: ${title}`;


  try {

    if (
      navigator.share
    ) {

      await navigator.share({
        title,
        text,
        url
      });

      return;

    }


    await navigator.clipboard.writeText(
      url
    );


    showToast(
      "Link copied. You can share it anywhere."
    );

  }
  catch (error) {

    if (
      error?.name ===
      "AbortError"
    ) {

      return;

    }


    showSocialShareFallback(
      url,
      title
    );

  }

}


function showSocialShareFallback(
  url,
  title
) {

  const encodedUrl =
    encodeURIComponent(
      url
    );


  const encodedText =
    encodeURIComponent(
      title
    );


  const choice =
    window.confirm(
      "Share on WhatsApp?\n\nCancel to copy the link."
    );


  if (choice) {

    window.open(
      `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      "_blank",
      "noopener,noreferrer"
    );

    return;

  }


  navigator.clipboard
    ?.writeText(
      url
    );


  showToast(
    "Link copied."
  );

}


/* =========================================================
   OPEN CONTENT
========================================================= */

function openSavedContent(
  id
) {

  window.location.href =
    `video.html?id=${Number(id)}`;

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
      Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];


    renderCollections();

  }
  catch (error) {

    console.error(
      error
    );

  }

}


/* =========================================================
   LEGACY LOCAL STORAGE MIGRATION
========================================================= */

async function migrateLegacyLocalStorage() {

  const raw =
    localStorage.getItem(
      "savedVideos"
    );


  if (!raw) {

    return;

  }


  let ids = [];


  try {

    ids =
      JSON.parse(
        raw
      );

  }
  catch {

    return;

  }


  if (
    !Array.isArray(ids) ||
    !ids.length
  ) {

    return;

  }


  let migrated =
    false;


  for (
    const videoId of ids
  ) {

    try {

      await apiFetch(
        SAVED_API,
        {
          method: "POST",

          body:
            JSON.stringify({
              contentId:
                Number(videoId)
            })
        }
      );

      migrated =
        true;

    }
    catch (
      error
    ) {

      console.warn(
        "Legacy save migration:",
        error.message
      );

    }

  }


  if (migrated) {

    localStorage.removeItem(
      "savedVideos"
    );

    const response =
      await apiFetch(
        SAVED_API
      );


    savedItems =
      Array.isArray(response?.data)
        ? response.data
        : [];


    renderSaved();

  }

}


/* =========================================================
   EMPTY / ERROR
========================================================= */

function renderSavedEmpty() {

  savedGrid.innerHTML = `

    <div class="saved-empty">

      <div class="saved-empty-icon">

        <i class="bi bi-bookmark-heart"></i>

      </div>

      <h3>
        Nothing saved here yet.
      </h3>

      <p>
        Save videos, books and products
        while exploring Vindarr. They'll
        stay here until you're ready.
      </p>

      <button
        onclick="location.href='index.html'"
      >
        Explore Vindarr
      </button>

    </div>

  `;

}


function renderSavedLoading() {

  savedGrid.innerHTML = `

    <div class="saved-loading">

      <div class="loading-spinner"></div>

      <span>
        Loading your saved content...
      </span>

    </div>

  `;

}


function renderError(
  message
) {

  savedGrid.innerHTML = `

    <div class="saved-empty">

      <div class="saved-empty-icon">

        <i class="bi bi-exclamation-circle"></i>

      </div>

      <h3>
        We couldn't load your saves.
      </h3>

      <p>
        ${escapeHtml(
          message ||
          "Please try again."
        )}
      </p>

      <button
        onclick="loadSavedPage()"
      >
        Try again
      </button>

    </div>

  `;

}


/* =========================================================
   MENU
========================================================= */

function openSavedMenu() {

  document
    .getElementById(
      "savedMenu"
    )
    .classList.add(
      "open"
    );

}


function closeSavedMenu() {

  document
    .getElementById(
      "savedMenu"
    )
    .classList.remove(
      "open"
    );

}


function scrollToCollections() {

  document
    .querySelector(
      ".collections-section"
    )
    ?.scrollIntoView({
      behavior:
        "smooth"
    });

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
        Number(item.id) ===
        Number(collectionId)
    );


  if (!collection) {

    return;

  }


  const action =
    window.prompt(
      `${collection.name}\n\nType DELETE to delete this collection, or CANCEL.`
    );


  if (
    action?.toUpperCase() ===
    "DELETE"
  ) {

    deleteCollection(
      collectionId
    );

  }

}


async function deleteCollection(
  collectionId
) {

  try {

    await apiFetch(
      `${COLLECTION_API}/${collectionId}`,
      {
        method:
          "DELETE"
      }
    );


    collections =
      collections.filter(
        collection =>
          Number(collection.id) !==
          Number(collectionId)
      );


    renderCollections();

    showToast(
      "Collection deleted."
    );

  }
  catch (error) {

    showToast(
      error.message,
      true
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  error = false
) {

  let toast =
    document.getElementById(
      "savedToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "savedToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:25px;
      transform:translateX(-50%);
      z-index:3000;
      padding:12px 18px;
      border-radius:30px;
      background:${error ? "#a90000" : "#111"};
      color:#fff;
      font-size:12px;
      font-weight:800;
      box-shadow:0 12px 35px rgba(0,0,0,.2);
      max-width:calc(100% - 30px);
      text-align:center;
    `;

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () => {

        toast.remove();

      },
      3000
    );

}


/* =========================================================
   FORMATTERS
========================================================= */

function formatNaira(
  value
) {

  return `₦${Number(value).toLocaleString(
    "en-NG"
  )}`;

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadSavedPage();

  }
);


/* =========================================================
   GLOBAL
========================================================= */

window.setFilter =
  setFilter;

window.openCreateCollection =
  openCreateCollection;

window.closeCreateCollection =
  closeCreateCollection;

window.createCollection =
  createCollection;

window.openCollection =
  openCollection;

window.closeCollectionDetail =
  closeCollectionDetail;

window.openItemActions =
  openItemActions;

window.closeItemActions =
  closeItemActions;

window.openMoveCollection =
  openMoveCollection;

window.closeMoveCollection =
  closeMoveCollection;

window.moveCurrentItemToCollection =
  moveCurrentItemToCollection;

window.openCreateCollectionFromMove =
  openCreateCollectionFromMove;

window.removeCurrentSavedItem =
  removeCurrentSavedItem;

window.shareCurrentItem =
  shareCurrentItem;

window.removeFromCollection =
  removeFromCollection;

window.openSavedContent =
  openSavedContent;

window.openSavedMenu =
  openSavedMenu;

window.closeSavedMenu =
  closeSavedMenu;

window.scrollToCollections =
  scrollToCollections;

window.openCollectionMenu =
  openCollectionMenu;