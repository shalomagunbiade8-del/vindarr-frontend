// ===============================
// VINDARR FEED SYSTEM
// js/feed.js
// ===============================

let posts = [];
let page = 1;
let loadingMore = false;

let activeVideo = null;
let lastTap = 0;

const feed = document.getElementById("feed");

// ===============================
// LOAD VIDEOS
// ===============================

async function loadVideos(reset = true) {

  try {

    if (reset) {
      page = 1;
    }

    const res = await fetch(
      `${API_BASE_URL}/videos?page=${page}&limit=10`
    );

    const result = await res.json();

    const videos = result.data || result;

    if (reset) {

      posts = videos;

    } else {

      const existingIds =
        new Set(posts.map(p => p.id));

      const uniqueVideos =
        videos.filter(v => !existingIds.has(v.id));

      posts = [...posts, ...uniqueVideos];
    }

    renderVideos();

  } catch (err) {

    console.error("Load videos failed:", err);

  }

}

// ===============================
// RENDER VIDEOS
// ===============================

function renderVideos() {

  if (!feed) return;

  if (!posts.length) {

    feed.innerHTML = `
      <div class="empty-feed">
        <h3>No content yet</h3>
      </div>
    `;

    return;
  }

  let html = "";

  posts.forEach((v, i) => {

    const media =
      v.videoUrl || v.file || "";

    const mediaUrl =
  media?.startsWith("http")
    ? media
    : `${API_BASE_URL}${media}`;

    html += `

      <div class="video-card">

        <!-- VIDEO -->
        <video
          id="video${i}"
          src="${mediaUrl}"
          muted
          loop
          playsinline
          onclick="handleVideoTap(${i}, ${v.id})"
        ></video>

        <!-- LEFT INFO -->
        <div class="video-overlay-left">

          <div class="creator-row">

            <img
  src="${
  v.creatorAvatar
    ? (
        v.creatorAvatar.startsWith("http")
          ? v.creatorAvatar
          : API_BASE_URL + v.creatorAvatar
      )
    : 'https://i.pravatar.cc/100'
}"

  class="creator-avatar"
  onclick="openCreatorProfile('${v.creatorId}')"
>
            <div>

  <div
    class="creator-name"
    onclick="openCreatorProfile('${v.creatorId}')"
  >
    @${v.creatorUsername || "creator"}
  </div>

  <div class="video-caption">
    ${v.context || ""}
  </div>

</div>
          </div>

        </div>

        <!-- RIGHT ACTIONS -->
        <div class="video-overlay-right">

          <div
            class="video-action"
            onclick="pressUnderstand(${v.id})"
          >
            ❤️
            <span id="understand-${v.id}">
              ${v.understandCount || 0}
            </span>
          </div>

          <div
            class="video-action"
            onclick="openCommentModal(${i})"
          >
            💬
            <span>
              ${v.comments?.length || 0}
            </span>
          </div>

          ${
            v.type === "ebook"
            ? `
              <div class="video-action">
                📚
                <span>Buy</span>
              </div>
            `
            : ""
          }

          ${
            v.type === "fashion"
            ? `
              <div class="video-action">
                🛒
                <span>Shop</span>
              </div>
            `
            : ""
          }

        </div>

      </div>

    `;

  });

  feed.innerHTML = html;

  setupVideoObserver();

}

// ===============================
// AUTO PLAY OBSERVER
// ===============================

let videoObserver;

function setupVideoObserver() {

  if (videoObserver) {
    videoObserver.disconnect();
  }

  const videos =
    document.querySelectorAll("#feed video");

  videoObserver =
    new IntersectionObserver((entries) => {

      entries.forEach(entry => {

        const video = entry.target;

        if (entry.isIntersecting) {

          video.play().catch(() => {});

        } else {

          video.pause();

        }

      });

    }, {
      threshold: 0.7
    });

  videos.forEach(video => {
    videoObserver.observe(video);
  });

}

// ===============================
// VIDEO TAP
// ===============================

function handleVideoTap(index, videoId) {

  const now = Date.now();

  const video =
    document.getElementById(`video${index}`);

  // DOUBLE TAP
  if (now - lastTap < 300) {

    pressUnderstand(videoId);

  } else {

    // SINGLE TAP
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

  }

  lastTap = now;

}

// ===============================
// OPEN CREATOR PROFILE
// ===============================

function openCreatorProfile(userId){

  window.location.href =
    `profile.html?id=${userId}`;

}


// ===============================
// LIKE / UNDERSTAND
// ===============================

async function pressUnderstand(videoId) {

  const token =
    localStorage.getItem("token");

  if (!token) {
    alert("Login required");
    return;
  }

  try {

    const res = await fetch(
      `${API_BASE_URL}/videos/${videoId}/understand`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    const countEl =
      document.getElementById(
        `understand-${videoId}`
      );

    if (countEl) {

      countEl.innerText =
        data.understandCount || 0;

    }

  } catch (err) {

    console.error(err);

  }

}

// ===============================
// COMMENTS
// ===============================

function openCommentModal(index) {

  activeVideo = index;

  const panel =
    document.getElementById("commentPanel");

  if (!panel) return;

  panel.classList.add("active");

  const post = posts[index];

  panel.innerHTML = `

    <div class="comment-header">

      <h3>Comments</h3>

      <button onclick="closeComments()">
        ✕
      </button>

    </div>

    <div
      id="commentList"
      class="comment-list"
    >

      ${
        post.comments?.length
        ? post.comments.map(c => `

          <div class="comment-item">

            <strong>
              ${c.author?.username || "user"}
            </strong>

            <p>${c.text}</p>

          </div>

        `).join("")
        : "<p>No comments yet</p>"
      }

    </div>

    <div class="comment-input-area">

      <input
        id="commentInput"
        placeholder="Write comment..."
        onkeydown="submitComment(event)"
      >

    </div>

  `;

}

function closeComments() {

  const panel =
    document.getElementById("commentPanel");

  if (panel) {
    panel.classList.remove("active");
  }

}

// ===============================
// SUBMIT COMMENT
// ===============================

async function submitComment(e) {

  if (e.key !== "Enter") return;

  const input =
    document.getElementById("commentInput");

  if (!input.value.trim()) return;

  const token =
    localStorage.getItem("token");

  if (!token) {
    alert("Login required");
    return;
  }

  const post =
    posts[activeVideo];

  try {

    const res = await fetch(
      `${API_BASE_URL}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          videoId: post.id,
          text: input.value
        })
      }
    );

    const newComment =
      await res.json();

    if (!post.comments) {
      post.comments = [];
    }

    post.comments.push(newComment);

    openCommentModal(activeVideo);

  } catch (err) {

    console.error(err);

  }

}

// ===============================
// INFINITE SCROLL
// ===============================

window.addEventListener("scroll", async () => {

  const nearBottom =
    window.innerHeight + window.scrollY >=
    document.body.offsetHeight - 500;

  if (nearBottom && !loadingMore) {

    loadingMore = true;

    page++;

    await loadVideos(false);

    loadingMore = false;

  }

});

// ===============================
// INITIAL LOAD
// ===============================

loadVideos();