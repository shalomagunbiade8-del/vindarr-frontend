// =====================================
// VINDARR VIDEO PAGE
// Complete polished version
// =====================================

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let currentVideo = null;
let hideTimer = null;

// =====================================
// API
// =====================================

const VIDEO_API_BASE =
  typeof API_BASE_URL !== "undefined"
    ? API_BASE_URL
    : "https://vindarr-backend.onrender.com";

// =====================================
// INIT
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  if (!id) {
    renderVideoError("Video unavailable", "No video was specified.");
    return;
  }

  loadVideo();
});

// =====================================
// LOAD VIDEO
// =====================================

async function loadVideo() {
  try {
    const res = await fetch(
      `${VIDEO_API_BASE}/videos/${encodeURIComponent(id)}?_=${Date.now()}`
    );

    if (!res.ok) {
      throw new Error("Video not found");
    }

    currentVideo = await res.json();

    renderVideo(currentVideo);

    await loadSavedState();

    loadUpNext();

    setupVideoInteractions();

  } catch (err) {
    console.error("Unable to load Vindarr video:", err);

    renderVideoError(
      "Video unavailable",
      "This video could not be loaded right now."
    );
  }
}

// =====================================
// RENDER ERROR
// =====================================

function renderVideoError(title, message) {
  const page = document.getElementById("videoPage");

  if (!page) return;

  page.innerHTML = `
    <div class="video-error-page">

      <div class="video-error-card">

        <div class="video-error-icon">
          <i class="bi bi-play-btn"></i>
        </div>

        <h2>
          ${escapeVideoHtml(title)}
        </h2>

        <p>
          ${escapeVideoHtml(message)}
        </p>

        <button
          type="button"
          class="video-error-btn"
          onclick="history.back()"
        >
          <i class="bi bi-arrow-left"></i>
          Go Back
        </button>

      </div>

    </div>
  `;
}

// =====================================
// RENDER VIDEO
// =====================================

function renderVideo(video) {

  const media =
    video.videoUrl ||
    video.fileUrl ||
    "";

  const mediaUrl = buildMediaUrl(media);

  const creatorAvatar =
    buildMediaUrl(
      video.creatorAvatar || ""
    ) ||
    "https://i.pravatar.cc/100";

  const title =
    video.title ||
    "Untitled video";

  const context =
    video.context ||
    "";

  const creatorUsername =
    video.creatorUsername ||
    "vindarr";

  const understandCount =
    Number(video.understandCount || 0);

  const commentCount =
    Array.isArray(video.comments)
      ? video.comments.length
      : Number(video.commentCount || 0);

  const descriptionIsLong =
    context.length > 120;

  const page =
    document.getElementById("videoPage");

  if (!page) return;

  page.innerHTML = `

    <section class="video-experience">

      <!-- =================================
           MAIN VIDEO
      ================================== -->

      <div class="single-video">

        <video
          id="vindarrVideo"
          class="main-video"
          src="${escapeAttribute(mediaUrl)}"
          autoplay
          playsinline
          loop
          controls
          preload="metadata"
        ></video>

        <div class="video-overlay"></div>

        <!-- =================================
             TOP BAR
        ================================== -->

        <div class="video-top">

          <button
            type="button"
            class="top-circle"
            aria-label="Go back"
            title="Go back"
            onclick="history.back()"
          >
            <i class="bi bi-arrow-left"></i>
          </button>

          <button
            type="button"
            class="top-circle"
            aria-label="More options"
            title="More options"
            onclick="openVideoMenu()"
          >
            <i class="bi bi-three-dots"></i>
          </button>

        </div>

        <!-- =================================
             RIGHT ACTIONS
        ================================== -->

        <div class="video-actions">

          <div class="action-item">

            <button
              type="button"
              id="understandBtn"
              class="action-btn"
              aria-label="Understand this video"
              title="Understand"
              onclick="understandVideo(event)"
            >
              <i class="bi bi-heart"></i>
            </button>

            <span id="understandCount">
              ${formatVideoCount(understandCount)}
            </span>

          </div>


          <div class="action-item">

            <button
              type="button"
              class="action-btn"
              aria-label="Open comments"
              title="Comments"
              onclick="openComments(event)"
            >
              <i class="bi bi-chat"></i>
            </button>

            <span id="commentCount">
              ${formatVideoCount(commentCount)}
            </span>

          </div>


          <div class="action-item">

            <button
              type="button"
              id="saveBtn"
              class="action-btn"
              aria-label="Save video"
              title="Save"
              onclick="saveVideo(event)"
            >
              <i class="bi bi-bookmark"></i>
            </button>

            <span id="saveLabel">
              Save
            </span>

          </div>


          <div class="action-item">

            <button
              type="button"
              class="action-btn"
              aria-label="Share video"
              title="Share"
              onclick="shareVideo(event)"
            >
              <i class="bi bi-send"></i>
            </button>

            <span>
              Share
            </span>

          </div>

        </div>


        <!-- =================================
             VIDEO INFO
        ================================== -->

        <div class="video-info">

          <div class="creator-row">

            <button
              type="button"
              class="creator-avatar-button"
              onclick="openCreatorProfile(
                '${escapeAttribute(creatorUsername)}'
              )"
              aria-label="Open creator profile"
            >

              <img
                class="creator-avatar"
                src="${escapeAttribute(creatorAvatar)}"
                alt="@${escapeAttribute(creatorUsername)}"
                loading="lazy"
                onerror="this.src='https://i.pravatar.cc/100'"
              >

            </button>


            <div
              class="creator-details"
              onclick="openCreatorProfile(
                '${escapeAttribute(creatorUsername)}'
              )"
            >

              <div class="creator-name">

                <span>
                  @${escapeVideoHtml(creatorUsername)}
                </span>

                <span class="verified">
                  <i class="bi bi-patch-check-fill"></i>
                </span>

              </div>

              <div class="creator-subtitle">
                Vindarr creator
              </div>

            </div>


            <button
              type="button"
              class="follow-btn"
              onclick="followCreator(event)"
            >
              Follow
            </button>

          </div>


          <!-- DESCRIPTION -->

          <div class="video-description">

            <strong>
              ${escapeVideoHtml(title)}
            </strong>

            <div
              id="videoDescription"
              class="description-text ${descriptionIsLong ? "collapsed" : ""}"
            >
              ${formatVideoText(context)}
            </div>

            ${
              descriptionIsLong
                ? `
                  <button
                    type="button"
                    id="readMoreBtn"
                    class="read-more"
                    onclick="toggleDescription()"
                  >
                    ...more
                  </button>
                `
                : ""
            }

          </div>


          <!-- AUDIO -->

          <div class="audio-pill">

            <span class="audio-icon">
              <i class="bi bi-music-note-beamed"></i>
            </span>

            <span>
              Original Audio
            </span>

            <span class="audio-divider">
              ·
            </span>

            <span>
              Vindarr
            </span>

          </div>

        </div>


        <!-- =================================
             COMMENT BAR
        ================================== -->

        <div class="comment-bar">

          <button
            type="button"
            class="comment-input"
            onclick="openComments(event)"
            aria-label="Add comment"
          >

            <span class="comment-icon">
              <i class="bi bi-emoji-smile"></i>
            </span>

            <span class="comment-placeholder">
              Add Comment...
            </span>

          </button>


          <button
            type="button"
            class="send-btn"
            onclick="shareVideo(event)"
            aria-label="Share video"
            title="Share"
          >
            <i class="bi bi-send-fill"></i>
          </button>

        </div>

      </div>


      <!-- =================================
           UP NEXT
      ================================== -->

      <section class="up-next-section">

        <div class="section-heading">

          <div>
            <span class="section-kicker">
              KEEP WATCHING
            </span>

            <h2 class="section-title">
              Up Next
            </h2>
          </div>

        </div>


        <div
          id="upNextVideos"
          class="up-next-list"
        >

          <div class="up-next-loading">

            <div class="loading-spinner"></div>

            <span>
              Loading related videos...
            </span>

          </div>

        </div>

      </section>

    </section>

    <!-- =================================
         VIDEO MENU
    ================================== -->

    <div
      id="videoMenu"
      class="video-menu"
      aria-hidden="true"
    >

      <div
        class="video-menu-backdrop"
        onclick="closeVideoMenu()"
      ></div>

      <div class="video-menu-card">

        <button
          type="button"
          onclick="shareVideo(); closeVideoMenu();"
        >
          <i class="bi bi-share"></i>
          Share video
        </button>

        <button
          type="button"
          onclick="copyVideoLink(); closeVideoMenu();"
        >
          <i class="bi bi-link-45deg"></i>
          Copy link
        </button>

        <button
          type="button"
          onclick="closeVideoMenu()"
          class="menu-cancel"
        >
          Cancel
        </button>

      </div>

    </div>

  `;

}

// =====================================
// MEDIA URL
// =====================================

function buildMediaUrl(value) {

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${VIDEO_API_BASE}${value}`;
  }

  return `${VIDEO_API_BASE}/${value}`;
}

// =====================================
// ESCAPE HTML
// =====================================

function escapeVideoHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================
// ESCAPE ATTRIBUTE
// =====================================

function escapeAttribute(value) {

  return escapeVideoHtml(value);
}

// =====================================
// DESCRIPTION TEXT
// =====================================

function formatVideoText(value) {

  return escapeVideoHtml(value)
    .replace(/\n/g, "<br>");
}

// =====================================
// FORMAT COUNTS
// =====================================

function formatVideoCount(number) {

  const value =
    Number(number || 0);

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

// =====================================
// VIDEO INTERACTIONS
// =====================================

function setupVideoInteractions() {

  const video =
    document.getElementById("vindarrVideo");

  if (!video) return;

  video.addEventListener("click", () => {

    if (video.paused) {

      video.play().catch(() => {});

    } else {

      video.pause();

    }

  });


  video.addEventListener("play", () => {

    video.classList.remove("video-paused");

  });


  video.addEventListener("pause", () => {

    video.classList.add("video-paused");

  });


  video.addEventListener("mousemove", showVideoControls);

  video.addEventListener("touchstart", showVideoControls);

}

// =====================================
// AUTO HIDE CONTROLS
// =====================================

function showVideoControls() {

  const video =
    document.getElementById("vindarrVideo");

  if (!video) return;

  video.controls = true;

  clearTimeout(hideTimer);

  hideTimer =
    setTimeout(() => {

      if (!video.paused) {
        video.controls = false;
      }

    }, 3500);

}

// =====================================
// SHARE VIDEO
// =====================================

async function shareVideo(event) {

  if (event) {
    event.stopPropagation();
  }

  if (!currentVideo) return;

  const url =
    window.location.href;

  const title =
    currentVideo.title ||
    "Vindarr video";

  const text =
    `Check out "${title}" on Vindarr.`;

  try {

    if (navigator.share) {

      await navigator.share({
        title,
        text,
        url
      });

      return;
    }


    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {

      await navigator.clipboard.writeText(url);

      showVideoToast(
        "Video link copied"
      );

      return;
    }


    prompt(
      "Copy this Vindarr video link:",
      url
    );

  } catch (err) {

    if (err?.name === "AbortError") {
      return;
    }

    console.error(
      "Video share failed:",
      err
    );

  }

}

// =====================================
// COPY LINK
// =====================================

async function copyVideoLink() {

  if (!currentVideo) return;

  const url =
    window.location.href;

  try {

    await navigator.clipboard.writeText(url);

    showVideoToast(
      "Video link copied"
    );

  } catch (err) {

    prompt(
      "Copy this Vindarr video link:",
      url
    );

  }

}

// =====================================
// UNDERSTAND
// =====================================

async function understandVideo(event) {

  if (event) {
    event.stopPropagation();
  }

  if (!currentVideo) return;

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return;

  }

  const button =
    document.getElementById("understandBtn");

  if (button) {
    button.disabled = true;
  }

  try {

    const res =
      await fetch(
        `${VIDEO_API_BASE}/videos/${encodeURIComponent(
          currentVideo.id
        )}/understand`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (res.status === 401) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href =
        "login.html";

      return;

    }


    if (!res.ok) {

      throw new Error(
        "Unable to update Understand."
      );

    }


    const data =
      await safeVideoJson(res);


    const count =
      Number(
        data?.understandCount ??
        currentVideo.understandCount ??
        0
      );


    currentVideo.understandCount =
      count;


    const countElement =
      document.getElementById(
        "understandCount"
      );

    if (countElement) {

      countElement.textContent =
        formatVideoCount(count);

    }


    if (button) {

      button.classList.add(
        "understood"
      );

      button.innerHTML =
        `<i class="bi bi-heart-fill"></i>`;

    }

  } catch (err) {

    console.error(
      "Understand failed:",
      err
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}

// =====================================
// FOLLOW CREATOR
// =====================================

function followCreator(event) {

  if (event) {
    event.stopPropagation();
  }

  if (!currentVideo) return;

  window.location.href =
    `profile.html?user=${encodeURIComponent(
      currentVideo.creatorUsername || ""
    )}`;

}

// =====================================
// SAVE VIDEO / CONTENT
// =====================================

async function saveVideo(event) {

  if (event) {
    event.stopPropagation();
  }

  if (!currentVideo) {
    return;
  }

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return;

  }

  const button =
    document.getElementById("saveBtn");

  try {

    if (button) {
      button.disabled = true;
    }


    const checkRes =
      await fetch(
        `${VIDEO_API_BASE}/saved/check/${encodeURIComponent(
          currentVideo.id
        )}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (checkRes.status === 401) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href =
        "login.html";

      return;

    }


    if (!checkRes.ok) {

      throw new Error(
        "Unable to check saved status."
      );

    }


    const state =
      await safeVideoJson(checkRes);


    // =================================
    // REMOVE
    // =================================

    if (state?.saved) {

      if (!state.savedId) {

        throw new Error(
          "Saved item ID was not returned."
        );

      }


      const deleteRes =
        await fetch(
          `${VIDEO_API_BASE}/saved/${encodeURIComponent(
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


      if (deleteRes.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
          "login.html";

        return;

      }


      if (!deleteRes.ok) {

        const data =
          await safeVideoJson(
            deleteRes
          );

        throw new Error(
          data?.message ||
          "Unable to remove saved content."
        );

      }


      updateVideoSaveButton(false);

      showVideoToast(
        "Removed from saved"
      );

      return;

    }


    // =================================
    // SAVE
    // =================================

    const saveRes =
      await fetch(
        `${VIDEO_API_BASE}/saved`,
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
                Number(currentVideo.id)
            })

        }
      );


    if (saveRes.status === 401) {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href =
        "login.html";

      return;

    }


    const data =
      await safeVideoJson(
        saveRes
      );


    if (!saveRes.ok) {

      throw new Error(
        data?.message ||
        "Unable to save content."
      );

    }


    updateVideoSaveButton(true);

    showVideoToast(
      "Saved to your collection"
    );

  } catch (error) {

    console.error(
      "Save content failed:",
      error
    );

    showVideoToast(
      error?.message ||
      "Unable to update saved content."
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}

// =====================================
// LOAD SAVED STATE
// =====================================

async function loadSavedState() {

  const token =
    localStorage.getItem("token");

  if (!token || !currentVideo) {
    return;
  }

  try {

    const res =
      await fetch(
        `${VIDEO_API_BASE}/saved/check/${encodeURIComponent(
          currentVideo.id
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {
      return;
    }


    const state =
      await safeVideoJson(res);


    updateVideoSaveButton(
      Boolean(state?.saved)
    );

  } catch (err) {

    console.error(
      "Unable to load saved state:",
      err
    );

  }

}

// =====================================
// UPDATE SAVE BUTTON
// =====================================

function updateVideoSaveButton(isSaved) {

  const button =
    document.getElementById(
      "saveBtn"
    );

  const label =
    document.getElementById(
      "saveLabel"
    );

  if (!button) {
    return;
  }

  if (isSaved) {

    button.classList.add(
      "saved"
    );

    button.innerHTML =
      `<i class="bi bi-bookmark-fill"></i>`;

    if (label) {
      label.textContent =
        "Saved";
    }

    button.setAttribute(
      "aria-label",
      "Remove from saved"
    );

  } else {

    button.classList.remove(
      "saved"
    );

    button.innerHTML =
      `<i class="bi bi-bookmark"></i>`;

    if (label) {
      label.textContent =
        "Save";
    }

    button.setAttribute(
      "aria-label",
      "Save video"
    );

  }

}

// =====================================
// COMMENTS
// =====================================

function openComments(event) {

  if (event) {
    event.stopPropagation();
  }

  if (!currentVideo) {
    return;
  }

  window.location.href =
    `comments.html?video=${encodeURIComponent(
      currentVideo.id
    )}`;

}

// =====================================
// CREATOR PROFILE
// =====================================

function openCreatorProfile(username) {

  if (!username) return;

  window.location.href =
    `profile.html?user=${encodeURIComponent(
      username
    )}`;

}

// =====================================
// DESCRIPTION
// =====================================

function toggleDescription() {

  const text =
    document.getElementById(
      "videoDescription"
    );

  const button =
    document.getElementById(
      "readMoreBtn"
    );

  if (!text || !button) {
    return;
  }

  const collapsed =
    text.classList.contains(
      "collapsed"
    );

  if (collapsed) {

    text.classList.remove(
      "collapsed"
    );

    button.textContent =
      "Show less";

  } else {

    text.classList.add(
      "collapsed"
    );

    button.textContent =
      "...more";

  }

}

// =====================================
// LOAD UP NEXT
// =====================================

async function loadUpNext() {

  if (!currentVideo) return;

  try {

    const res =
      await fetch(
        `${VIDEO_API_BASE}/videos/${encodeURIComponent(
          currentVideo.id
        )}/related`
      );


    if (!res.ok) {
      throw new Error(
        "Unable to load related videos."
      );
    }


    const result =
      await safeVideoJson(res);


    const videos =
      Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.videos)
            ? result.videos
            : [];


    renderUpNext(videos);

  } catch (err) {

    console.error(
      "Unable to load Up Next:",
      err
    );

    const container =
      document.getElementById(
        "upNextVideos"
      );

    if (container) {

      container.innerHTML = `
        <div class="up-next-empty">
          Unable to load related videos.
        </div>
      `;

    }

  }

}

// =====================================
// RENDER UP NEXT
// =====================================

function renderUpNext(videos) {

  const container =
    document.getElementById(
      "upNextVideos"
    );

  if (!container) {
    return;
  }


  if (!videos.length) {

    container.innerHTML = `
      <div class="up-next-empty">
        <i class="bi bi-collection-play"></i>
        <span>
          No related videos yet.
        </span>
      </div>
    `;

    return;

  }


  container.innerHTML =
    videos
      .filter(video => {
        return (
          video &&
          String(video.id) !==
            String(currentVideo?.id)
        );
      })
      .map(video => {

        const media =
          video.videoUrl ||
          video.fileUrl ||
          "";

        const mediaUrl =
          buildMediaUrl(media);

        const title =
          video.title ||
          "Untitled video";

        const username =
          video.creatorUsername ||
          "vindarr";

        const understands =
          Number(
            video.understandCount || 0
          );


        return `

          <article
            class="up-next-card"
            onclick="openVideo(${Number(video.id)})"
          >

            <div class="up-next-thumb">

              <video
                src="${escapeAttribute(mediaUrl)}"
                muted
                playsinline
                preload="metadata"
              ></video>

              <div class="up-next-play">
                <i class="bi bi-play-fill"></i>
              </div>

              <div class="up-next-gradient"></div>

            </div>


            <div class="up-next-info">

              <div class="up-next-title">
                ${escapeVideoHtml(title)}
              </div>

              <div class="up-next-creator">
                @${escapeVideoHtml(username)}
              </div>

              <div class="up-next-understands">

                <i class="bi bi-heart-fill"></i>

                ${formatVideoCount(understands)}
                Understands

              </div>

            </div>

            <div class="up-next-arrow">
              <i class="bi bi-chevron-right"></i>
            </div>

          </article>

        `;

      })
      .join("");

}

// =====================================
// OPEN VIDEO
// =====================================

function openVideo(videoId) {

  if (!videoId) return;

  window.location.href =
    `video.html?id=${encodeURIComponent(
      videoId
    )}`;

}

// =====================================
// VIDEO MENU
// =====================================

function openVideoMenu() {

  const menu =
    document.getElementById(
      "videoMenu"
    );

  if (!menu) return;

  menu.classList.add(
    "visible"
  );

  menu.setAttribute(
    "aria-hidden",
    "false"
  );

}

// =====================================
// CLOSE VIDEO MENU
// =====================================

function closeVideoMenu() {

  const menu =
    document.getElementById(
      "videoMenu"
    );

  if (!menu) return;

  menu.classList.remove(
    "visible"
  );

  menu.setAttribute(
    "aria-hidden",
    "true"
  );

}

// =====================================
// TOAST
// =====================================

function showVideoToast(message) {

  let toast =
    document.getElementById(
      "videoToast"
    );

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "videoToast";

    toast.className =
      "video-toast";

    document.body.appendChild(
      toast
    );

  }

  toast.textContent =
    message;

  toast.classList.add(
    "visible"
  );

  clearTimeout(
    toast._timer
  );

  toast._timer =
    setTimeout(() => {

      toast.classList.remove(
        "visible"
      );

    }, 2200);

}

// =====================================
// SAFE JSON
// =====================================

async function safeVideoJson(response) {

  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {

    return JSON.parse(text);

  } catch {

    return {
      message: text
    };

  }

}