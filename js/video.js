// =====================================
// VINDARR VIDEO PAGE
// =====================================

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

let currentVideo = null;

// =====================================
// LOAD VIDEO
// =====================================

async function loadVideo() {

  try {

    const res = await fetch(
      `${API_BASE_URL}/videos/${id}`
    );

    if (!res.ok) {
      throw new Error("Video not found");
    }

    currentVideo = await res.json();

    renderVideo(currentVideo);

    loadUpNext();

  } catch (err) {

    console.error(err);

    document.getElementById("videoPage").innerHTML = `

      <div class="video-error">

        <h2>Video unavailable</h2>

        <p>This video could not be loaded.</p>

        <button onclick="history.back()">

          Go Back

        </button>

      </div>

    `;

  }

}

// =====================================
// RENDER VIDEO
// =====================================

function renderVideo(video) {

  const media =
    video.videoUrl ||
    video.fileUrl;

  const mediaUrl =
    media && media.startsWith("http")
      ? media
      : API_BASE_URL + media;

  const creatorAvatar =
    video.creatorAvatar
      ? (
          video.creatorAvatar.startsWith("http")
            ? video.creatorAvatar
            : API_BASE_URL + video.creatorAvatar
        )
      : "https://i.pravatar.cc/100";

  document.getElementById("videoPage").innerHTML = `

<div class="single-video">

    <!-- VIDEO -->

    <video
      id="vindarrVideo"
      src="${mediaUrl}"
      autoplay
      playsinline
      loop
      controls>
    </video>

    <div class="video-overlay"></div>

    <!-- TOP BAR -->

    <div class="video-top">

        <div
          class="top-circle"
          onclick="history.back()">

            <i class="bi bi-arrow-left"></i>

        </div>

        <div class="top-circle">

            <i class="bi bi-three-dots"></i>

        </div>

    </div>

    <!-- RIGHT ACTIONS -->

    <div class="video-actions">

        <div class="action-item">

            <button
              class="action-btn"
              onclick="understandVideo()">

                ❤️

            </button>

            <span>

              ${video.understandCount || 0}

            </span>

        </div>

        <div class="action-item">

            <button
              class="action-btn"
              onclick="openComments()">

                💬

            </button>

            <span>

              ${video.comments?.length || 0}

            </span>

        </div>

        <div class="action-item">

            <button
              class="action-btn"
              onclick="saveVideo()">

                🔖

            </button>

            <span>

              Save

            </span>

        </div>

        <div class="action-item">

            <button
              class="action-btn"
              onclick="shareVideo()">

                📤

            </button>

            <span>

              Share

            </span>

        </div>

    </div>

    <!-- VIDEO INFO -->

    <div class="video-info">

        <div class="creator-row">

            <img

              class="creator-avatar"

              src="${creatorAvatar}"

              onclick="openCreatorProfile('${video.creatorUsername}')"

            >

            <div>

                <div class="creator-name">

                    @${video.creatorUsername}

                    <span class="verified">

                        <i class="bi bi-patch-check-fill"></i>

                    </span>

                </div>

            </div>

            <button

              class="follow-btn"

              onclick="followCreator()">

                Follow

            </button>

        </div>

        <div class="video-description">

    <strong>${video.title}</strong>

    <div
        id="videoDescription"
        class="description-text collapsed">

        ${video.context || ""}

    </div>

    ${
      (video.context || "").length > 120
      ? `
      <span
          id="readMoreBtn"
          class="read-more"
          onclick="toggleDescription()">

          ...more

      </span>
      `
      : ""
    }

</div>
        <div class="audio-pill">

            <i class="bi bi-music-note-beamed"></i>

            <span>

                Original Audio · Vindarr

            </span>

        </div>

    </div>

    <!-- COMMENT BAR -->

    <div class="comment-bar">

        <div class="comment-input">

            <div class="comment-icon">

                😊

            </div>

            <input

              placeholder="Add Comment..."

              readonly

              onclick="openComments()"

            >

        </div>

        <button

          class="send-btn"

          onclick="shareVideo()">

            <i class="bi bi-send-fill"></i>

        </button>

    </div>

</div>

<!-- UP NEXT -->

<div class="up-next-section">

    <div class="section-title">

        Up Next

    </div>

    <div
      id="upNextVideos"
      class="up-next-list">

        <div class="loading">

            Loading...

        </div>

    </div>

</div>

`;

}

// =====================================
// INITIALIZE
// =====================================

loadVideo();


// =====================================
// SHARE VIDEO
// =====================================

async function shareVideo() {

  const url = window.location.href;

  try {

    if (navigator.share) {

      await navigator.share({
        title: currentVideo.title,
        text: currentVideo.title,
        url
      });

    } else {

      await navigator.clipboard.writeText(url);

      alert("Video link copied");

    }

  } catch (err) {

    console.error(err);

  }

}

// =====================================
// UNDERSTAND
// =====================================

async function understandVideo() {

  const token = localStorage.getItem("token");

  if (!token) {

    window.location.href = "login.html";
    return;

  }

  try {

    const res = await fetch(

      `${API_BASE_URL}/videos/${currentVideo.id}/understand`,

      {

        method: "POST",

        headers: {

          Authorization: `Bearer ${token}`

        }

      }

    );

    const data = await res.json();

    const count = document.querySelector(
      ".video-actions .action-item span"
    );

    if (count) {

      count.textContent =
        data.understandCount ||
        currentVideo.understandCount;

    }

  } catch (err) {

    console.error(err);

  }

}

// =====================================
// FOLLOW CREATOR
// =====================================

function followCreator() {

  if (!currentVideo) return;

  window.location.href =
    `profile.html?user=${encodeURIComponent(
      currentVideo.creatorUsername
    )}`;

}

// =====================================
// SAVE VIDEO
// =====================================

function saveVideo() {

  if (!currentVideo) return;

  const saved =
    JSON.parse(
      localStorage.getItem("savedVideos") || "[]"
    );

  if (saved.includes(currentVideo.id)) {

    alert("Already saved");
    return;

  }

  saved.push(currentVideo.id);

  localStorage.setItem(
    "savedVideos",
    JSON.stringify(saved)
  );

  alert("Saved successfully");

}

// =====================================
// COMMENTS
// =====================================

function openComments() {

  window.location.href =
    `comments.html?video=${currentVideo.id}`;

}

// =====================================
// CREATOR PROFILE
// =====================================

function openCreatorProfile(username) {

  window.location.href =
    `profile.html?user=${encodeURIComponent(username)}`;

}

// =====================================
// LOAD UP NEXT
// =====================================

async function loadUpNext() {

  try {

    const res = await fetch(
      `${API_BASE_URL}/videos/${currentVideo.id}/related`
    );

    if (!res.ok) return;

    const videos = await res.json();

    renderUpNext(videos);

  } catch (err) {

    console.error(err);

  }

}

// =====================================
// RENDER UP NEXT
// =====================================

function renderUpNext(videos) {

  const container =
    document.getElementById("upNextVideos");

  if (!container) return;

  if (!videos.length) {

    container.innerHTML =
      "<div>No related videos.</div>";

    return;

  }

  container.innerHTML =
    videos.map(video => {

      const media =
        video.videoUrl ||
        video.fileUrl;

      const mediaUrl =
        media && media.startsWith("http")
          ? media
          : API_BASE_URL + media;

      return `

        <div
          class="up-next-card"
          onclick="openVideo(${video.id})">

          <div class="up-next-thumb">

            <video
              src="${mediaUrl}"
              muted
              playsinline
              preload="metadata">
            </video>

          </div>

          <div class="up-next-info">

            <div class="up-next-title">

              ${video.title}

            </div>

            <div class="up-next-creator">

              @${video.creatorUsername}

            </div>

            <div class="up-next-understands">

              👍 ${Number(video.understandCount || 0).toLocaleString()} Understands

            </div>

          </div>

        </div>

      `;

    }).join("");

}

// =====================================
// OPEN VIDEO
// =====================================

function openVideo(id) {

  window.location.href =
    `video.html?id=${id}`;

}

// =====================================
// TAP VIDEO TO PLAY / PAUSE
// =====================================

document.addEventListener("click", function (e) {

  const video =
    document.getElementById("vindarrVideo");

  if (!video) return;

  if (e.target === video) {

    if (video.paused) {

      video.play();

    } else {

      video.pause();

    }

  }

});

// =====================================
// AUTO HIDE CONTROLS
// =====================================

let hideTimer;

document.addEventListener("mousemove", function () {

  const video =
    document.getElementById("vindarrVideo");

  if (!video) return;

  video.controls = true;

  clearTimeout(hideTimer);

  hideTimer = setTimeout(() => {

    video.controls = false;

  }, 3000);

});


// =====================================
// READ MORE
// =====================================

function toggleDescription(){

    const text =
        document.getElementById("videoDescription");

    const btn =
        document.getElementById("readMoreBtn");

    if(!text || !btn) return;

    if(text.classList.contains("collapsed")){

        text.classList.remove("collapsed");

        btn.textContent = "Show less";

    }else{

        text.classList.add("collapsed");

        btn.textContent = "...more";

    }

}


