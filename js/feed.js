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

    if (reset) {

      page = 1;
      hasMore = true;
      posts = [];

    }

    const requestedPage = page;

    console.log(
      "Loading videos:",
      {
        page: requestedPage,
        limit: 10
      }
    );

    const res = await fetch(
      `${API_BASE_URL}/videos?page=${requestedPage}&limit=10&_=${Date.now()}`
    );

    if (!res.ok) {

      throw new Error(
        `Video request failed: ${res.status}`
      );

    }

    const result = await res.json();

    console.log(
      `Page ${requestedPage} response:`,
      result
    );

    let videos = [];

    if (Array.isArray(result)) {

      videos = result;

    } else if (Array.isArray(result.data)) {

      videos = result.data;

    } else if (Array.isArray(result.videos)) {

      videos = result.videos;

    } else if (Array.isArray(result.results)) {

      videos = result.results;

    }

    console.log(
      `Page ${requestedPage} videos received:`,
      videos.length
    );

    /*
    =====================================
    NO MORE VIDEOS
    =====================================
    */

    if (!videos.length) {

      hasMore =
        result.hasMore === true
          ? true
          : false;

      return false;

    }

    /*
    =====================================
    UPDATE HAS MORE
    =====================================
    */

    if (
      typeof result.hasMore === "boolean"
    ) {

      hasMore =
        result.hasMore;

    } else {

      hasMore =
        videos.length === 10;

    }

    /*
    =====================================
    PAGE 1
    =====================================
    */

    if (reset) {

      posts.push(...videos);

await loadSavedStates(
  videos
);

renderVideos(
  videos,
  false,
  startIndex
);

    }

    /*
    =====================================
    PAGE 2+
    =====================================
    */

    else {

      /*
      Save the position before adding
      the new videos.
      */

      const startIndex =
        posts.length;

      /*
      Add only the new page to state.
      */

      posts.push(...videos);

      /*
      IMPORTANT:
      Render ONLY the newly received
      videos, not the entire posts array.
      */

      renderVideos(
        videos,
        false,
        startIndex
      );

    }

    return true;

  } catch (err) {

    console.error(
      "Load videos failed:",
      err
    );

    if (
      feed &&
      !posts.length
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
            onclick="loadVideos()"
          >
            Try Again
          </button>

        </div>

      `;

    }

    /*
    Let the caller know loading failed.
    */

    throw err;

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

function renderVideos(
  videosToRender = posts,
  replace = false,
  startIndex = 0
) {

  if (!feed) {
    return;
  }

  /*
  =====================================
  EMPTY FEED
  =====================================
  */

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

      /*
      Absolute index across the entire feed.

      Page 1:
      0-9

      Page 2:
      10-19

      Page 3:
      20-29
      */

      const videoIndex =
        startIndex + i;

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
                  id="video${videoIndex}"
                  src="${escapeHtml(mediaUrl)}"
                  class="feed-video"
                  loop
                  playsinline
                  preload="metadata"
                  onclick="handleVideoTap(${videoIndex}, ${v.id}, event)"
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


                  <!-- FOLLOW -->

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


  /*
  =====================================
  REPLACE OR APPEND
  =====================================
  */

  if (replace) {

    feed.innerHTML =
      html;

  } else {

    feed.insertAdjacentHTML(
      "beforeend",
      html
    );

  }


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

// =====================================
// SAVED CONTENT
// =====================================

const savedState = new Map();

async function checkSavedContent(contentId) {

  const token =
    localStorage.getItem("token");

  if (!token) {
    return {
      saved: false,
      savedId: null
    };
  }

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/saved/check/${encodeURIComponent(contentId)}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    if (res.status === 401) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

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
      await res.json();

    const state = {
      saved:
        Boolean(data.saved),

      savedId:
        data.savedId || null
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


function isVideoSaved(contentId) {

  const state =
    savedState.get(
      String(contentId)
    );

  return Boolean(
    state?.saved
  );

}


async function loadSavedStates(videos) {

  const token =
    localStorage.getItem("token");

  if (!token) {
    return;
  }

  await Promise.all(
    videos.map(
      video =>
        checkSavedContent(
          video.id
        )
    )
  );

}


async function toggleSaveVideo(
  contentId,
  event
) {

  if (event) {

    event.preventDefault();
    event.stopPropagation();

  }

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return;

  }

  const key =
    String(contentId);

  let state =
    savedState.get(key);

  try {

    /*
     * If we don't know the current
     * server state, check it first.
     */

    if (!state) {

      state =
        await checkSavedContent(
          contentId
        );

    }


    /*
     * =====================================
     * UNSAVE
     * =====================================
     */

    if (state?.saved) {

      if (!state.savedId) {

        /*
         * We cannot safely delete without
         * the Saved record ID.
         */

        state =
          await checkSavedContent(
            contentId
          );

      }


      if (!state.savedId) {

        throw new Error(
          "Saved item ID was not returned by the server."
        );

      }


      const res =
        await fetch(
          `${API_BASE_URL}/saved/${encodeURIComponent(state.savedId)}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      if (res.status === 401) {

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        window.location.href =
          "login.html";

        return;

      }


      if (!res.ok) {

        const data =
          await safeJsonResponse(
            res
          );

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


    /*
     * =====================================
     * SAVE
     * =====================================
     */

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


    if (res.status === 401) {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href =
        "login.html";

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


    /*
     * Your SavedService returns:
     *
     * {
     *   data: {
     *     id: Saved.id,
     *     contentId: ...
     *   },
     *   alreadySaved: false
     * }
     */

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

}


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
    button.querySelector("i");


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


async function safeJsonResponse(
  response
) {

  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {

    return JSON.parse(
      text
    );

  } catch {

    return {
      message: text
    };

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

    feed.removeEventListener(

        "scroll",

        handleInfiniteScroll

    );

    feed.addEventListener(

        "scroll",

        handleInfiniteScroll

    );

}

async function handleInfiniteScroll() {

    if (loadingMore) return;

    if (!hasMore) return;

    const remaining =

        feed.scrollHeight -

        feed.scrollTop -

        feed.clientHeight;

    if (remaining > 600) return;

    loadingMore = true;

    page++;

    console.log("Loading page:", page);

    try {

        await loadVideos(false);

    }

    catch(err){

        console.error(err);

        page--;

    }

    finally{

        loadingMore = false;

    }

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

loadVideos().then(() => {
    setupLoadMore();
});