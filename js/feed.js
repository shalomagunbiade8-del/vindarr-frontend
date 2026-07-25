// =====================================
// VINDARR FEED SYSTEM
// js/feed.js
// =====================================


// =====================================
// STATE
// =====================================

let posts = [];

let page = 1;

let loadingMore = false;

let hasMore = true;

let loadTrigger = null;

let videoObserver = null;

let lastTap = 0;


// =====================================
// FEED
// =====================================

const feed =
  document.getElementById("feed");


// =====================================
// URL PARAMETERS
// =====================================

const params =
  new URLSearchParams(
    window.location.search
  );

const videoId =
  params.get("video");


// =====================================
// LOAD VIDEOS
// =====================================

async function loadVideos(reset = true) {

  try {

    if (loadingMore && !reset) {
      return;
    }

    if (reset) {

      page = 1;

      hasMore = true;

    }

    const res =
      await fetch(
        `${API_BASE_URL}/videos?page=${page}&limit=10`
      );


    if (!res.ok) {

      throw new Error(
        `Video request failed: ${res.status}`
      );

    }


    const result =
      await res.json();


    const videos =
      Array.isArray(result)
        ? result
        : result.data || [];


    hasMore =
      result.hasMore ?? false;


    if (reset) {

      posts = videos;

    } else {

      const existingIds =
        new Set(
          posts.map(
            post => post.id
          )
        );


      const uniqueVideos =
        videos.filter(
          video =>
            !existingIds.has(
              video.id
            )
        );


      posts = [
        ...posts,
        ...uniqueVideos
      ];

    }


    renderVideos();


  } catch (err) {

    console.error(
      "Load videos failed:",
      err
    );


    if (feed && !posts.length) {

      feed.innerHTML = `

        <div class="empty-feed">

          <i class="bi bi-exclamation-circle"></i>

          <h3>
            Unable to load videos
          </h3>

          <p>
            Please try again later.
          </p>

          <button
            onclick="loadVideos()"
          >
            Try Again
          </button>

        </div>

      `;

    }

  }

}


// =====================================
// MEDIA URL
// =====================================

function getMediaUrl(video) {

  let media = "";


  if (video.type === "ebook") {

    media =
      video.coverUrl || "";

  } else {

    media =
      video.videoUrl ||
      video.fileUrl ||
      video.coverUrl ||
      "";

  }


  if (!media) {
    return "";
  }


  if (
    media.startsWith("http://") ||
    media.startsWith("https://")
  ) {

    return media;

  }


  return (
    API_BASE_URL +
    media
  );

}


// =====================================
// CREATOR AVATAR
// =====================================

function getCreatorAvatar(video) {

  const avatar =
    video.creatorAvatar;


  if (!avatar) {

    return "https://i.pravatar.cc/100";

  }


  if (
    avatar.startsWith("http://") ||
    avatar.startsWith("https://")
  ) {

    return avatar;

  }


  return (
    API_BASE_URL +
    avatar
  );

}


// =====================================
// RENDER VIDEOS
// =====================================

function renderVideos() {

  if (!feed) {
    return;
  }


  if (!posts.length) {

    feed.innerHTML = `

      <div class="empty-feed">

        <i class="bi bi-camera-video"></i>

        <h3>
          No content yet
        </h3>

        <p>
          Be the first person to publish something.
        </p>

      </div>

    `;

    return;

  }


  let html = "";


  posts.forEach(
    (v, i) => {

      const mediaUrl =
        getMediaUrl(v);


      const isVideo =
        v.type === "video" ||
        mediaUrl.includes(".mp4") ||
        mediaUrl.includes(".mov") ||
        mediaUrl.includes(".webm");


      const avatar =
        getCreatorAvatar(v);


      const description =
        v.context ||
        "";


      const understandCount =
        Number(
          v.understandCount || 0
        );


      const commentCount =
        Array.isArray(v.comments)
          ? v.comments.length
          : Number(
              v.commentCount || 0
            );


      const saved =
        isVideoSaved(v.id);


      html += `

        <article
          class="video-card"
          id="video-${v.id}"
        >


          <!-- =================================
               MEDIA
          ================================= -->

          ${
            isVideo

              ? `

                <video
                  id="video${i}"
                  src="${escapeHtml(mediaUrl)}"
                  class="feed-video"
                  loop
                  muted
                  playsinline
                  preload="metadata"
                  onclick="handleVideoTap(${i}, ${v.id}, event)"
                ></video>

              `

              : `

                <img
                  src="${escapeHtml(mediaUrl)}"
                  class="feed-image"
                  alt="${escapeHtml(v.title || "Vindarr content")}"
                  onclick="openProduct('${v.id}')"
                >

              `
          }


          <!-- =================================
               DARK GRADIENT
          ================================= -->

          <div class="feed-video-gradient"></div>


          <!-- =================================
               TOP CONTROLS
          ================================= -->

          <div class="video-card-top">

            <button
              class="glass-circle"
              onclick="openNotifications()"
              aria-label="Notifications"
            >

              <i class="bi bi-bell"></i>

            </button>


            <button
              class="glass-circle"
              onclick="openFeedMenu()"
              aria-label="Menu"
            >

              <i class="bi bi-three-dots"></i>

            </button>

          </div>


          <!-- =================================
               RIGHT ACTIONS
          ================================= -->

          <div class="video-overlay-right">


            <!-- UNDERSTAND -->

            <button
              class="video-action"
              onclick="pressUnderstand(${v.id}, event)"
            >

              <i class="bi bi-heart"></i>

              <span
                id="understand-${v.id}"
              >
                ${formatCount(understandCount)}
              </span>

            </button>


            <!-- COMMENTS -->

            <button
              class="video-action"
              onclick="openCommentsPage(${v.id}, event)"
            >

              <i class="bi bi-chat-circle"></i>

              <span>
                ${formatCount(commentCount)}
              </span>

            </button>


            <!-- SAVE -->

            <button
              id="save-action-${v.id}"
              class="video-action ${saved ? "saved" : ""}"
              onclick="toggleSaveVideo(${v.id}, event)"
            >

              <i
                class="bi ${
                  saved
                    ? "bi-bookmark-fill"
                    : "bi-bookmark"
                }"
              ></i>

              <span>
                Save
              </span>

            </button>


            <!-- SHARE -->

            <button
              class="video-action"
              onclick="shareContent(${v.id}, event)"
            >

              <i class="bi bi-send"></i>

              <span>
                Share
              </span>

            </button>


            <!-- EBOOK -->

            ${
              v.type === "ebook"

                ? `

                  <button
                    class="video-action"
                    onclick="openEbook('${v.id}', event)"
                  >

                    <i class="bi bi-book"></i>

                    <span>
                      Buy
                    </span>

                  </button>

                `

                : ""
            }


            <!-- PRODUCT -->

            ${
              (
                v.type === "fashion" ||
                v.type === "essential"
              )

                ? `

                  <button
                    class="video-action"
                    onclick="openProduct('${v.id}', event)"
                  >

                    <i class="bi bi-bag"></i>

                    <span>
                      Shop
                    </span>

                  </button>

                `

                : ""
            }

          </div>


          <!-- =================================
               CREATOR / DESCRIPTION
          ================================= -->

          <div class="video-overlay-left">


            <div class="creator-row">


              <!-- AVATAR -->

              <img
                src="${escapeHtml(avatar)}"
                class="creator-avatar"
                onclick="openCreatorProfile('${escapeHtml(v.creatorUsername || "creator")}', event)"
                alt="${escapeHtml(v.creatorUsername || "creator")}"
              >


              <div class="creator-content">


                <div class="creator-line">


                  <div
                    class="creator-name"
                    onclick="openCreatorProfile('${escapeHtml(v.creatorUsername || "creator")}', event)"
                  >

                    @${escapeHtml(v.creatorUsername || "creator")}

                    <i
                      class="bi bi-patch-check-fill verified-icon"
                    ></i>

                  </div>


                  <!-- FOLLOW = PURVIEW REPLACEMENT -->

                  <button
                    class="follow-btn"
                    onclick="followCreator(${v.creatorId || 0}, '${escapeHtml(v.creatorUsername || "")}', event)"
                  >

                    Follow

                  </button>


                </div>


                <!-- DESCRIPTION -->

                ${
                  description

                    ? `

                      <div
                        class="video-caption"
                        id="caption-${v.id}"
                      >

                        ${renderCaption(
                          description,
                          v.id
                        )}

                      </div>

                    `

                    : ""

                }


                <!-- AUDIO -->

                <div class="audio-pill">

                  <i class="bi bi-music-note-beamed"></i>

                  <span>
                    Original Audio · Vindarr
                  </span>

                </div>

              </div>

            </div>

          </div>


          <!-- =================================
               COMMENT BAR
          ================================= -->

          <button
            class="feed-comment-bar"
            onclick="openCommentsPage(${v.id}, event)"
          >

            <span class="comment-face">

              <i class="bi bi-emoji-smile"></i>

            </span>

            <span class="comment-placeholder">
              Add Comment...
            </span>

          </button>


          <!-- SHARE BUTTON -->

          <button
            class="feed-share-button"
            onclick="shareContent(${v.id}, event)"
            aria-label="Share"
          >

            <i class="bi bi-send-fill"></i>

          </button>


        </article>

      `;

    }
  );


  feed.innerHTML = html;


  setupVideoObserver();


  setupLoadMore();


  openRequestedVideo();

}


// =====================================
// CAPTION
// =====================================

function renderCaption(
  text,
  id
) {

  const safeText =
    escapeHtml(text);


  if (text.length <= 110) {

    return `

      <div class="description-text collapsed">

        ${safeText}

      </div>

    `;

  }


  return `

    <div
      id="caption-short-${id}"
      class="description-text collapsed"
    >

      ${escapeHtml(
        text.slice(0, 110)
      )}...

      <button
        class="read-more"
        onclick="expandCaption(${id}, event)"
      >
        Read more
      </button>

    </div>


    <div
      id="caption-full-${id}"
      class="description-text expanded"
      style="display:none"
    >

      ${safeText}

      <button
        class="read-more"
        onclick="collapseCaption(${id}, event)"
      >
        Show less
      </button>

    </div>

  `;

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =====================================
// COUNT FORMAT
// =====================================

function formatCount(number) {

  const value =
    Number(number || 0);


  if (value >= 1000000) {

    return (
      (value / 1000000)
        .toFixed(1)
        .replace(".0", "") +
      "m"
    );

  }


  if (value >= 1000) {

    return (
      (value / 1000)
        .toFixed(1)
        .replace(".0", "") +
      "k"
    );

  }


  return value.toString();

}


// =====================================
// VIDEO AUTOPLAY
// =====================================

function setupVideoObserver() {

  if (videoObserver) {

    videoObserver.disconnect();

  }


  const videos =
    document.querySelectorAll(
      "#feed video"
    );


  videoObserver =
    new IntersectionObserver(

      entries => {

        entries.forEach(
          entry => {

            const video =
              entry.target;


            if (
              entry.isIntersecting
            ) {

              video.play()
                .catch(() => {});


            } else {

              video.pause();

            }

          }
        );

      },

      {
        threshold: 0.7
      }

    );


  videos.forEach(
    video => {

      videoObserver.observe(
        video
      );

    }
  );

}


// =====================================
// VIDEO TAP
// =====================================

function handleVideoTap(
  index,
  videoId,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  const now =
    Date.now();


  const video =
    document.getElementById(
      `video${index}`
    );


  if (!video) {
    return;
  }


  // DOUBLE TAP

  if (
    now - lastTap < 300
  ) {

    pressUnderstand(
      videoId
    );


  } else {

    // SINGLE TAP

    if (
      video.paused
    ) {

      video.play()
        .catch(() => {});

    } else {

      video.pause();

    }

  }


  lastTap = now;

}


// =====================================
// CREATOR PROFILE
// =====================================

function openCreatorProfile(
  username,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  window.location.href =
    `profile.html?user=${encodeURIComponent(username)}`;

}


// =====================================
// FOLLOW CREATOR
// REPLACES PURVIEW
// =====================================

async function followCreator(
  creatorId,
  username,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  if (!creatorId) {

    openCreatorProfile(
      username
    );

    return;

  }


  try {

    const res =
      await fetch(

        `${API_BASE_URL}/purview/${creatorId}`,

        {

          method: "POST",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }

      );


    if (!res.ok) {

      throw new Error(
        "Follow request failed"
      );

    }


    const button =
      event?.currentTarget;


    if (button) {

      button.textContent =
        "Following";

      button.classList.add(
        "following"
      );

    }


  } catch (err) {

    console.error(
      "Follow failed:",
      err
    );

    alert(
      "Unable to follow creator"
    );

  }

}


// =====================================
// UNDERSTAND
// =====================================

async function pressUnderstand(
  videoId,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  try {

    const res =
      await fetch(

        `${API_BASE_URL}/videos/${videoId}/understand`,

        {

          method: "POST",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }

      );


    const data =
      await res.json();


    const countEl =
      document.getElementById(
        `understand-${videoId}`
      );


    if (countEl) {

      countEl.innerText =
        formatCount(
          data.understandCount || 0
        );

    }

  } catch (err) {

    console.error(
      "Understand failed:",
      err
    );

  }

}


// =====================================
// COMMENTS
// COMPLETELY REPLACES MODAL
// =====================================

function openCommentsPage(
  videoId,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  window.location.href =
    `comments.html?video=${encodeURIComponent(videoId)}`;

}


// =====================================
// SAVE VIDEO
// =====================================

function getSavedVideos() {

  try {

    return JSON.parse(

      localStorage.getItem(
        "savedVideos"
      ) || "[]"

    );

  } catch {

    return [];

  }

}


function isVideoSaved(
  videoId
) {

  const saved =
    getSavedVideos();


  return saved.some(
    id =>
      String(id) ===
      String(videoId)
  );

}


function toggleSaveVideo(
  videoId,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  let saved =
    getSavedVideos();


  const existingIndex =
    saved.findIndex(
      id =>
        String(id) ===
        String(videoId)
    );


  if (
    existingIndex >= 0
  ) {

    saved.splice(
      existingIndex,
      1
    );

  } else {

    saved.push(
      videoId
    );

  }


  localStorage.setItem(

    "savedVideos",

    JSON.stringify(saved)

  );


  updateSaveButton(
    videoId,
    existingIndex < 0
  );

}


function updateSaveButton(
  videoId,
  isSaved
) {

  const button =
    document.getElementById(
      `save-action-${videoId}`
    );


  if (!button) {
    return;
  }


  const icon =
    button.querySelector(
      "i"
    );


  if (isSaved) {

    button.classList.add(
      "saved"
    );


    if (icon) {

      icon.className =
        "bi bi-bookmark-fill";

    }

  } else {

    button.classList.remove(
      "saved"
    );


    if (icon) {

      icon.className =
        "bi bi-bookmark";

    }

  }

}


// =====================================
// OPEN SAVED PAGE
// =====================================

function openSavedPage() {

  window.location.href =
    "saved.html";

}


// =====================================
// SHARE
// =====================================

async function shareContent(
  id,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  const url =
    `${window.location.origin}/index.html?video=${id}`;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          "Vindarr",

        text:
          "Check this out on Vindarr",

        url

      });

      return;

    } catch {

      return;

    }

  }


  try {

    await navigator.clipboard.writeText(
      url
    );

    alert(
      "Video link copied"
    );

  } catch {

    alert(
      url
    );

  }

}


// =====================================
// OPEN PRODUCT
// =====================================

function openProduct(
  id,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  window.location.href =
    `product.html?id=${encodeURIComponent(id)}`;

}


// =====================================
// OPEN EBOOK
// =====================================

function openEbook(
  id,
  event
) {

  if (event) {

    event.stopPropagation();

  }


  window.location.href =
    `ebook.html?id=${encodeURIComponent(id)}`;

}


// =====================================
// READ MORE
// =====================================

function expandCaption(
  id,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  const shortText =
    document.getElementById(
      `caption-short-${id}`
    );


  const fullText =
    document.getElementById(
      `caption-full-${id}`
    );


  if (shortText) {

    shortText.style.display =
      "none";

  }


  if (fullText) {

    fullText.style.display =
      "block";

  }

}


function collapseCaption(
  id,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  const shortText =
    document.getElementById(
      `caption-short-${id}`
    );


  const fullText =
    document.getElementById(
      `caption-full-${id}`
    );


  if (fullText) {

    fullText.style.display =
      "none";

  }


  if (shortText) {

    shortText.style.display =
      "block";

  }

}


// =====================================
// OPEN REQUESTED VIDEO
// =====================================

function openRequestedVideo() {

  if (!videoId) {
    return;
  }


  setTimeout(
    () => {

      const target =
        document.getElementById(
          `video-${videoId}`
        );


      if (!target) {
        return;
      }


      target.scrollIntoView({

        behavior: "smooth",

        block: "start"

      });


      target.classList.add(
        "highlight-video"
      );


    },
    300
  );

}


// =====================================
// LOAD MORE
// =====================================

function setupLoadMore() {

  if (loadTrigger) {

    loadTrigger.disconnect();

  }


  const oldTrigger =
    document.getElementById(
      "loadMoreTrigger"
    );


  if (oldTrigger) {

    oldTrigger.remove();

  }


  if (!hasMore) {
    return;
  }


  const trigger =
    document.createElement(
      "div"
    );


  trigger.id =
    "loadMoreTrigger";


  trigger.style.height =
    "1px";


  feed.appendChild(
    trigger
  );


  loadTrigger =
    new IntersectionObserver(

      async entries => {

        const entry =
          entries[0];


        if (
          !entry.isIntersecting ||
          loadingMore ||
          !hasMore
        ) {

          return;

        }


        loadingMore =
          true;


        page++;


        try {

          await loadVideos(
            false
          );

        } finally {

          loadingMore =
            false;

        }

      },

      {

        root: feed,

        rootMargin:
          "1000px"

      }

    );


  loadTrigger.observe(
    trigger
  );

}


// =====================================
// NOTIFICATIONS
// =====================================

function openNotifications() {

  const panel =
    document.getElementById(
      "notifDropdown"
    );


  if (!panel) {

    window.location.href =
      "notifications.html";

    return;

  }


  panel.classList.toggle(
    "active"
  );

}


function closeNotifications() {

  const panel =
    document.getElementById(
      "notifDropdown"
    );


  if (panel) {

    panel.classList.remove(
      "active"
    );

  }

}


// =====================================
// INSTAGRAM-STYLE MENU PAGE
// =====================================

function openFeedMenu() {

  window.location.href =
    "menu.html";

}


// =====================================
// INITIAL LOAD
// =====================================

loadVideos();