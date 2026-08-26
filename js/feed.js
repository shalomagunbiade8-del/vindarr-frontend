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

let nextVideos = [];

let prefetching = false;

let loadTrigger = null;

let videoObserver = null;

let lastTap = 0;


// Saved state
const savedState = new Map();


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

  if (!feed) {

    console.error(
      "Feed element #feed was not found."
    );

    return false;

  }


  try {

    // ===================================
    // RESET
    // ===================================

    if (reset) {

      page = 1;

      hasMore = true;

      loadingMore = false;

      posts = [];

      savedState.clear();

      feed.innerHTML = "";

    }


    const requestedPage =
      page;


    console.log(
      "Loading videos:",
      {
        page: requestedPage,
        limit: 10
      }
    );


    const res =
      await fetch(
        `${API_BASE_URL}/videos?page=${requestedPage}&limit=10&_=${Date.now()}`
      );


    if (!res.ok) {

      throw new Error(
        `Video request failed: ${res.status}`
      );

    }


    const result =
      await res.json();


    console.log(
      `Page ${requestedPage} response:`,
      result
    );


    // ===================================
    // NORMALIZE RESPONSE
    // ===================================

    let videos = [];


    if (Array.isArray(result)) {

      videos = result;

    }

    else if (
      result &&
      Array.isArray(result.data)
    ) {

      videos =
        result.data;

    }

    else if (
      result &&
      Array.isArray(result.videos)
    ) {

      videos =
        result.videos;

    }

    else if (
      result &&
      Array.isArray(result.results)
    ) {

      videos =
        result.results;

    }


    console.log(
      `Page ${requestedPage} videos received:`,
      videos.length
    );


    // ===================================
    // NO MORE VIDEOS
    // ===================================

    if (!videos.length) {

      hasMore = false;

      console.log(
        "No more videos."
      );

      return false;

    }


    // ===================================
    // REMOVE DUPLICATES
    // ===================================

    const existingIds =
      new Set(
        posts.map(
          post =>
            String(post.id)
        )
      );


    const newVideos =
      videos.filter(
        video =>
          video &&
          video.id != null &&
          !existingIds.has(
            String(video.id)
          )
      );


    if (!newVideos.length) {

      hasMore = false;

      console.log(
        "No new videos returned."
      );

      return false;

    }


    // ===================================
    // HAS MORE
    // ===================================

    if (
      result &&
      typeof result.hasMore === "boolean"
    ) {

      hasMore =
        result.hasMore;

    }

    else {

      hasMore =
        videos.length === 10;

    }


    // ===================================
    // POSITION BEFORE APPENDING
    // ===================================

    const startIndex =
      posts.length;


    // ===================================
    // ADD TO STATE
    // ===================================

    posts.push(
      ...newVideos
    );


    // ===================================
    // LOAD SAVED STATES
    // ===================================

    await loadSavedStates(
      newVideos
    );


    // ===================================
    // RENDER
    // ===================================

    renderVideos(
      newVideos,
      reset,
      startIndex
    );


    return true;


  } catch (err) {

    console.error(
      "Load videos failed:",
      err
    );


    if (
      feed &&
      posts.length === 0
    ) {

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
            type="button"
            onclick="loadVideos(true)"
          >
            Try Again
          </button>

        </div>

      `;

    }


    throw err;

  }

}


// =====================================
// MEDIA URL
// =====================================

function getMediaUrl(video) {

  if (!video) {
    return "";
  }


  let media = "";


  if (
    video.type === "ebook"
  ) {

    media =
      video.coverUrl ||
      "";

  }

  else {

    media =
      video.videoUrl ||
      video.fileUrl ||
      video.coverUrl ||
      "";

  }


  if (!media) {

    return "";

  }


  media =
    String(media);


  if (
    media.startsWith("http://") ||
    media.startsWith("https://") ||
    media.startsWith("data:")
  ) {

    return media;

  }


  if (
    media.startsWith("/")
  ) {

    return (
      API_BASE_URL +
      media
    );

  }


  return (
    API_BASE_URL +
    "/" +
    media
  );

}


// =====================================
// CREATOR AVATAR
// =====================================

function getCreatorAvatar(video) {

  const avatar =
    video?.creatorAvatar;


  if (!avatar) {

    return "https://i.pravatar.cc/100";

  }


  const value =
    String(avatar);


  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {

    return value;

  }


  if (
    value.startsWith("/")
  ) {

    return (
      API_BASE_URL +
      value
    );

  }


  return (
    API_BASE_URL +
    "/" +
    value
  );

}


// =====================================
// RENDER VIDEOS
// =====================================

function renderVideos(
  videosToRender = posts,
  replace = false,
  startIndex = 0
) {

  if (!feed) {

    return;

  }


  // ===================================
  // EMPTY
  // ===================================

  if (
    !videosToRender.length &&
    posts.length === 0
  ) {

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


  videosToRender.forEach(
    (v, i) => {

      if (!v) {
        return;
      }


      // =================================
      // ABSOLUTE INDEX
      // =================================

      const videoIndex =
        startIndex + i;


      // =================================
      // MEDIA
      // =================================

      const mediaUrl =
        getMediaUrl(v);


      const lowerMediaUrl =
        mediaUrl.toLowerCase();


      const isVideo =
        v.type === "video" ||
        lowerMediaUrl.includes(".mp4") ||
        lowerMediaUrl.includes(".mov") ||
        lowerMediaUrl.includes(".webm") ||
        lowerMediaUrl.includes(".m3u8");


      // =================================
      // AVATAR
      // =================================

      const avatar =
        getCreatorAvatar(v);


      // =================================
      // DESCRIPTION
      // =================================

      const description =
        v.context ||
        "";


      // =================================
      // COUNTS
      // =================================

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


      // =================================
      // SAVED
      // =================================

      const saved =
        isVideoSaved(
          v.id
        );


      // =================================
      // TYPE
      // =================================

      const isEbook =
        v.type === "ebook";


      const isProduct =
        v.type === "fashion" ||
        v.type === "essential";


      // =================================
      // CARD
      // =================================

      html += `

        <article
          class="video-card"
          id="video-${escapeHtml(v.id)}"
          data-video-id="${escapeHtml(v.id)}"
        >

          <!-- =================================
               MEDIA
          ================================= -->

          ${
            isVideo

              ? `

                <video
                  id="video${videoIndex}"
                  src="${escapeHtml(mediaUrl)}"
                  class="feed-video"
                  loop
                  playsinline
                  preload="metadata"
                  onclick="handleVideoTap(${videoIndex}, ${Number(v.id)}, event)"
                ></video>

              `

              : `

                <img
                  src="${escapeHtml(mediaUrl)}"
                  class="feed-image"
                  alt="${escapeHtml(
                    v.title ||
                    "Vindarr content"
                  )}"
                  onclick="${
                    isProduct
                      ? `openProduct(${Number(v.id)}, event)`
                      : isEbook
                        ? `openEbook(${Number(v.id)}, event)`
                        : ""
                  }"
                  onerror="this.style.display='none'"
                >

              `
          }


          <!-- =================================
               DARK GRADIENT
          ================================= -->

          <div
            class="feed-video-gradient"
          ></div>


          <!-- =================================
               TOP CONTROLS
          ================================= -->

          <div class="video-card-top">

            <button
              type="button"
              class="glass-circle"
              onclick="openNotifications(event)"
              aria-label="Notifications"
            >

              <i class="bi bi-bell"></i>

            </button>


            <button
              type="button"
              class="glass-circle"
              onclick="openFeedMenu(event)"
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
              type="button"
              class="video-action"
              onclick="pressUnderstand(${Number(v.id)}, event)"
            >

              <i class="bi bi-heart"></i>

              <span
                id="understand-${Number(v.id)}"
              >
                ${formatCount(
                  understandCount
                )}
              </span>

            </button>


            <!-- COMMENTS -->

            <button
              type="button"
              class="video-action"
              onclick="openCommentsPage(${Number(v.id)}, event)"
            >

              <i class="bi bi-chat-circle"></i>

              <span>
                ${formatCount(
                  commentCount
                )}
              </span>

            </button>


            <!-- SAVE -->

            <button
              type="button"
              id="save-action-${Number(v.id)}"
              class="video-action ${
                saved
                  ? "saved"
                  : ""
              }"
              onclick="toggleSaveVideo(${Number(v.id)}, event)"
              aria-label="${
                saved
                  ? "Remove from saved"
                  : "Save content"
              }"
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
              type="button"
              class="video-action"
              onclick="shareContent(${Number(v.id)}, event)"
            >

              <i class="bi bi-send"></i>

              <span>
                Share
              </span>

            </button>


            <!-- EBOOK -->

            ${
              isEbook

                ? `

                  <button
                    type="button"
                    class="video-action"
                    onclick="openEbook(${Number(v.id)}, event)"
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
              isProduct

                ? `

                  <button
                    type="button"
                    class="video-action"
                    onclick="openProduct(${Number(v.id)}, event)"
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
                onclick="openCreatorProfile(
                  '${escapeHtml(
                    v.creatorUsername ||
                    "creator"
                  )}',
                  event
                )"
                alt="${escapeHtml(
                  v.creatorUsername ||
                  "creator"
                )}"
              >


              <div class="creator-content">

                <div class="creator-line">

                  <div
                    class="creator-name"
                    onclick="openCreatorProfile(
                      '${escapeHtml(
                        v.creatorUsername ||
                        "creator"
                      )}',
                      event
                    )"
                  >

                    @${escapeHtml(
                      v.creatorUsername ||
                      "creator"
                    )}

                    <i
                      class="bi bi-patch-check-fill verified-icon"
                    ></i>

                  </div>


                  <!-- FOLLOW -->

                  <button
                    type="button"
                    class="follow-btn"
                    onclick="followCreator(
                      ${Number(v.creatorId || 0)},
                      '${escapeHtml(
                        v.creatorUsername ||
                        ""
                      )}',
                      event
                    )"
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
                        id="caption-${Number(v.id)}"
                      >

                        ${renderCaption(
                          description,
                          Number(v.id)
                        )}

                      </div>

                    `

                    : ""
                }


                <!-- AUDIO -->

                <div class="audio-pill">

                  <i
                    class="bi bi-music-note-beamed"
                  ></i>

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
            type="button"
            class="feed-comment-bar"
            onclick="openCommentsPage(
              ${Number(v.id)},
              event
            )"
          >

            <span class="comment-face">

              <i
                class="bi bi-emoji-smile"
              ></i>

            </span>

            <span class="comment-placeholder">
              Add Comment...
            </span>

          </button>


          <!-- =================================
               SHARE BUTTON
          ================================= -->

          <button
            type="button"
            class="feed-share-button"
            onclick="shareContent(
              ${Number(v.id)},
              event
            )"
            aria-label="Share"
          >

            <i class="bi bi-send-fill"></i>

          </button>


        </article>

      `;

    }
  );


  // ===================================
  // INSERT
  // ===================================

  if (replace) {

    feed.innerHTML =
      html;

  }

  else {

    feed.insertAdjacentHTML(
      "beforeend",
      html
    );

  }


  // ===================================
  // VIDEO / PAGINATION
  // ===================================

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


  if (
    String(text).length <= 110
  ) {

    return `

      <div
        class="description-text collapsed"
      >

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
        String(text).slice(0, 110)
      )}...

      <button
        type="button"
        class="read-more"
        onclick="expandCaption(
          ${id},
          event
        )"
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
        type="button"
        class="read-more"
        onclick="collapseCaption(
          ${id},
          event
        )"
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


// =====================================
// COUNT FORMAT
// =====================================

function formatCount(number) {

  const value =
    Number(number || 0);


  if (
    value >= 1000000
  ) {

    return (
      (value / 1000000)
        .toFixed(1)
        .replace(".0", "") +
      "m"
    );

  }


  if (
    value >= 1000
  ) {

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

    videoObserver = null;

  }


  if (!feed) {
    return;
  }


  const videos =
    feed.querySelectorAll(
      "video.feed-video"
    );


  if (!videos.length) {
    return;
  }


  if (
    !("IntersectionObserver" in window)
  ) {

    return;

  }


  videoObserver =
    new IntersectionObserver(

      entries => {

        entries.forEach(
          entry => {

            const video =
              entry.target;


            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.7
            ) {

              video.play()
                .catch(
                  () => {}
                );

            }

            else {

              video.pause();

            }

          }
        );

      },

      {
        threshold: [
          0,
          0.7,
          1
        ]

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


  // ===================================
  // DOUBLE TAP
  // ===================================

  if (
    now - lastTap < 300
  ) {

    pressUnderstand(
      videoId
    );

  }

  else {

    // =================================
    // SINGLE TAP
    // =================================

    if (
      video.paused
    ) {

      video.play()
        .catch(
          () => {}
        );

    }

    else {

      video.pause();

    }

  }


  lastTap =
    now;

}


// =====================================
// CREATOR PROFILE
// =====================================

function openCreatorProfile(
  username,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  if (!username) {
    return;
  }


  window.location.href =
    `profile.html?user=${encodeURIComponent(
      username
    )}`;

}


// =====================================
// FOLLOW CREATOR
// =====================================

async function followCreator(
  creatorId,
  username,
  event
) {

  if (event) {

    event.preventDefault();

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


    if (
      res.status === 401
    ) {

      logoutUser();

      return;

    }


    if (!res.ok) {

      const data =
        await safeJsonResponse(
          res
        );

      throw new Error(
        data?.message ||
        "Follow request failed."
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
      err?.message ||
      "Unable to follow creator."
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

    event.preventDefault();

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


    if (
      res.status === 401
    ) {

      logoutUser();

      return;

    }


    const data =
      await safeJsonResponse(
        res
      );


    if (!res.ok) {

      throw new Error(
        data?.message ||
        "Unable to update understanding."
      );

    }


    const countEl =
      document.getElementById(
        `understand-${videoId}`
      );


    if (countEl) {

      countEl.innerText =
        formatCount(
          data?.understandCount ||
          0
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
    `comments.html?video=${encodeURIComponent(
      videoId
    )}`;

}


// =====================================
// SAVED CONTENT
// =====================================


// =====================================
// CHECK SAVED
// =====================================

async function checkSavedContent(
  contentId
) {

  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {

    return {
      saved: false,
      savedId: null
    };

  }


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/saved/check/${encodeURIComponent(
          contentId
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (
      res.status === 401
    ) {

      logoutUser();

      return {
        saved: false,
        savedId: null
      };

    }


    if (!res.ok) {

      throw new Error(
        `Saved check failed: ${res.status}`
      );

    }


    const data =
      await safeJsonResponse(
        res
      );


    const state = {

      saved:
        Boolean(
          data?.saved
        ),

      savedId:
        data?.savedId ||
        null

    };


    savedState.set(
      String(contentId),
      state
    );


    return state;


  } catch (error) {

    console.error(
      "Check saved state failed:",
      error
    );


    return {

      saved: false,

      savedId: null

    };

  }

}


// =====================================
// IS SAVED
// =====================================

function isVideoSaved(
  contentId
) {

  const state =
    savedState.get(
      String(contentId)
    );


  return Boolean(
    state?.saved
  );

}


// =====================================
// LOAD SAVED STATES
// =====================================

async function loadSavedStates(
  videos
) {

  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {
    return;
  }


  if (
    !Array.isArray(videos) ||
    !videos.length
  ) {

    return;

  }


  await Promise.all(
    videos.map(
      video => {

        if (
          !video ||
          video.id == null
        ) {

          return Promise.resolve();

        }


        return checkSavedContent(
          video.id
        );

      }
    )
  );

}


// =====================================
// TOGGLE SAVE
// =====================================

async function toggleSaveVideo(
  contentId,
  event
) {

  if (event) {

    event.preventDefault();

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


  const key =
    String(contentId);


  let state =
    savedState.get(
      key
    );


  // ===================================
  // TEMPORARILY DISABLE BUTTON
  // ===================================

  const button =
    document.getElementById(
      `save-action-${contentId}`
    );


  if (button) {

    button.disabled =
      true;

  }


  try {

    // =================================
    // UNKNOWN STATE
    // =================================

    if (!state) {

      state =
        await checkSavedContent(
          contentId
        );

    }


    // =================================
    // UNSAVE
    // =================================

    if (
      state?.saved
    ) {

      if (!state.savedId) {

        state =
          await checkSavedContent(
            contentId
          );

      }


      if (!state?.savedId) {

        throw new Error(
          "Saved item ID was not returned by the server."
        );

      }


      const res =
        await fetch(
          `${API_BASE_URL}/saved/${encodeURIComponent(
            state.savedId
          )}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      if (
        res.status === 401
      ) {

        logoutUser();

        return;

      }


      const data =
        await safeJsonResponse(
          res
        );


      if (!res.ok) {

        throw new Error(
          data?.message ||
          "Unable to remove saved content."
        );

      }


      savedState.set(
        key,
        {
          saved: false,
          savedId: null
        }
      );


      updateSaveButton(
        contentId,
        false
      );


      return;

    }


    // =================================
    // SAVE
    // =================================

    const res =
      await fetch(
        `${API_BASE_URL}/saved`,
        {
          method: "POST",

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({
              contentId:
                Number(contentId)
            })

        }
      );


    if (
      res.status === 401
    ) {

      logoutUser();

      return;

    }


    const data =
      await safeJsonResponse(
        res
      );


    if (!res.ok) {

      throw new Error(
        data?.message ||
        "Unable to save content."
      );

    }


    // =================================
    // SavedService response:
    //
    // {
    //   data: {
    //     id,
    //     contentId
    //   },
    //   alreadySaved
    // }
    // =================================

    const savedId =
      data?.data?.id ||
      state?.savedId ||
      null;


    savedState.set(
      key,
      {
        saved: true,
        savedId
      }
    );


    updateSaveButton(
      contentId,
      true
    );


  } catch (error) {

    console.error(
      "Save content failed:",
      error
    );


    alert(
      error?.message ||
      "Unable to update saved content."
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


// =====================================
// UPDATE SAVE BUTTON
// =====================================

function updateSaveButton(
  contentId,
  isSaved
) {

  const button =
    document.getElementById(
      `save-action-${contentId}`
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


    button.setAttribute(
      "aria-label",
      "Remove from saved"
    );


    if (icon) {

      icon.className =
        "bi bi-bookmark-fill";

    }

  }

  else {

    button.classList.remove(
      "saved"
    );


    button.setAttribute(
      "aria-label",
      "Save content"
    );


    if (icon) {

      icon.className =
        "bi bi-bookmark";

    }

  }

}


// =====================================
// SAFE JSON RESPONSE
// =====================================

async function safeJsonResponse(
  response
) {

  if (!response) {

    return null;

  }


  const text =
    await response.text();


  if (!text) {

    return null;

  }


  try {

    return JSON.parse(
      text
    );

  }

  catch {

    return {
      message: text
    };

  }

}


// =====================================
// LOGOUT
// =====================================

function logoutUser() {

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "user"
  );


  window.location.href =
    "login.html";

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
    `${window.location.origin}/index.html?video=${encodeURIComponent(
      id
    )}`;


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

    }

    catch {

      return;

    }

  }


  try {

    if (
      navigator.clipboard
    ) {

      await navigator.clipboard.writeText(
        url
      );

      alert(
        "Video link copied"
      );

    }

    else {

      alert(
        url
      );

    }

  }

  catch {

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

    event.preventDefault();

    event.stopPropagation();

  }


  window.location.href =
    `product.html?id=${encodeURIComponent(
      id
    )}`;

}


// =====================================
// OPEN EBOOK
// =====================================

function openEbook(
  id,
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  window.location.href =
    `ebook.html?id=${encodeURIComponent(
      id
    )}`;

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


// =====================================
// COLLAPSE CAPTION
// =====================================

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

        behavior:
          "smooth",

        block:
          "start"

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

  if (!feed) {

    return;

  }


  if (loadTrigger) {

    feed.removeEventListener(
      "scroll",
      handleInfiniteScroll
    );

  }


  feed.addEventListener(
    "scroll",
    handleInfiniteScroll,
    {
      passive: true
    }
  );


  loadTrigger =
    true;

}


// =====================================
// INFINITE SCROLL
// =====================================

async function handleInfiniteScroll() {

  if (!feed) {

    return;

  }


  if (loadingMore) {

    return;

  }


  if (!hasMore) {

    return;

  }


  const remaining =
    feed.scrollHeight -
    feed.scrollTop -
    feed.clientHeight;


  if (
    remaining > 600
  ) {

    return;

  }


  loadingMore =
    true;


  const previousPage =
    page;


  page += 1;


  console.log(
    "Loading page:",
    page
  );


  try {

    const loaded =
      await loadVideos(
        false
      );


    if (!loaded) {

      page =
        previousPage;

      hasMore =
        false;

    }

  }

  catch (err) {

    console.error(
      "Infinite scroll failed:",
      err
    );


    page =
      previousPage;

  }

  finally {

    loadingMore =
      false;

  }

}


// =====================================
// NOTIFICATIONS
// =====================================

function openNotifications(
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


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


// =====================================
// CLOSE NOTIFICATIONS
// =====================================

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
// FEED MENU
// =====================================

function openFeedMenu(
  event
) {

  if (event) {

    event.preventDefault();

    event.stopPropagation();

  }


  window.location.href =
    "menu.html";

}


// =====================================
// INITIAL LOAD
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      await loadVideos(
        true
      );

      setupLoadMore();

    }

    catch (error) {

      console.error(
        "Initial feed load failed:",
        error
      );

    }

  }
);