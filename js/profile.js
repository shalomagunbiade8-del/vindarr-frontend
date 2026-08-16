// =====================================
// VINDARR PROFILE
// =====================================

let allPosts = [];

let currentTab = "videos";

let currentProfileUser = null;

let isOwnProfile = false;


// =====================================
// URL
// =====================================

const params =
  new URLSearchParams(
    window.location.search
  );

const profileUsername =
  params.get("user");


// =====================================
// HELPERS
// =====================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function getMediaUrl(value) {

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return API_BASE_URL + value;

}


// =====================================
// LOAD PROFILE
// =====================================

async function loadProfile() {

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  try {

    // =================================
    // CURRENT USER
    // =================================

    const meRes =
      await fetch(
        `${API_BASE_URL}/profile/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!meRes.ok) {

      throw new Error(
        "Unable to load current user"
      );

    }


    const me =
      await meRes.json();


    // =================================
    // TARGET PROFILE
    // =================================

    const endpoint =
      profileUsername

        ? `${API_BASE_URL}/profile/${encodeURIComponent(profileUsername)}`

        : `${API_BASE_URL}/profile/me`;


    const res =
      await fetch(
        endpoint,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      throw new Error(
        "Profile not found"
      );

    }


    const user =
      await res.json();


    currentProfileUser =
      user;


    // =================================
    // OWN PROFILE
    // =================================

    isOwnProfile =
      Number(me.id) === Number(user.id);


    // =================================
    // PROFILE INFO
    // =================================

    const usernameEl =
      document.getElementById(
        "profileUsername"
      );


    const bioEl =
      document.getElementById(
        "profileBio"
      );


    const avatarEl =
      document.getElementById(
        "profileAvatar"
      );


    if (usernameEl) {

      usernameEl.innerText =
        user.username ||
        "User";

    }


    if (bioEl) {

      bioEl.innerText =
        user.bio ||
        "Creator on Vindarr";

    }


    if (avatarEl) {

      avatarEl.src =
        getMediaUrl(
          user.avatar
        ) ||
        "https://i.pravatar.cc/200";

      avatarEl.alt =
        user.username
          ? `${user.username} profile`
          : "Profile avatar";

    }


    // =================================
    // ACTIONS
    // =================================

    renderProfileActions(
      user
    );


    // =================================
    // POSTS
    // =================================

    await loadUserPosts(
      user.id
    );


  } catch (err) {

    console.error(
      "Profile loading failed:",
      err
    );


    const usernameEl =
      document.getElementById(
        "profileUsername"
      );


    if (usernameEl) {

      usernameEl.innerText =
        "Profile unavailable";

    }

  }

}


// =====================================
// PROFILE ACTIONS
// =====================================

function renderProfileActions(user) {

  const actions =
    document.getElementById(
      "profileActions"
    );


  if (!actions) {
    return;
  }


  const shareButton = `

    <button
      class="profile-action-btn secondary-action"
      onclick="shareProfile()"
    >
      <i class="bi bi-share"></i>
      Share
    </button>

  `;


  if (isOwnProfile) {

    actions.innerHTML = `

      <button
        class="profile-action-btn primary-action"
        onclick="openEditProfile()"
      >
        <i class="bi bi-pencil"></i>
        Edit Profile
      </button>

      ${shareButton}

    `;

    return;

  }


  actions.innerHTML = `

    <button
      onclick="addCreatorToPurview(${Number(user.id)})"
      class="profile-action-btn primary-action"
    >
      <i class="bi bi-plus-lg"></i>
      Add to Purview
    </button>


    <button
      class="profile-action-btn secondary-action"
      onclick="messageUser('${escapeHtml(user.username || "")}')"
    >
      <i class="bi bi-chat"></i>
      Message
    </button>


    ${shareButton}

  `;

}


// =====================================
// MESSAGE USER
// =====================================

function messageUser(username) {

  window.location.href =
    `chat.html?user=${encodeURIComponent(username)}`;

}


// =====================================
// SHARE PROFILE
// =====================================

async function shareProfile() {

  const username =
    currentProfileUser?.username ||
    document.getElementById(
      "profileUsername"
    )?.innerText;


  if (
    !username ||
    username === "Loading..."
  ) {

    return;

  }


  const shareUrl =
    `${window.location.origin}${window.location.pathname}?user=${encodeURIComponent(username)}`;


  const shareData = {

    title:
      `@${username} • Vindarr`,

    text:
      `Check out @${username} on Vindarr.`,

    url:
      shareUrl

  };


  // =================================
  // NATIVE SHARE
  // =================================

  if (
    navigator.share &&
    /Mobi|Android|iPhone|iPad/i.test(
      navigator.userAgent
    )
  ) {

    try {

      await navigator.share(
        shareData
      );

      return;

    } catch (err) {

      // User cancelled sharing.
      if (
        err?.name ===
        "AbortError"
      ) {

        return;

      }

    }

  }


  // =================================
  // CLIPBOARD FALLBACK
  // =================================

  try {

    await navigator.clipboard.writeText(
      shareUrl
    );

    showShareToast();

  } catch (err) {

    console.error(
      "Clipboard failed:",
      err
    );


    // Final fallback for older browsers.
    window.prompt(
      "Copy this profile link:",
      shareUrl
    );

  }

}


// =====================================
// SHARE TOAST
// =====================================

function showShareToast() {

  const toast =
    document.getElementById(
      "shareToast"
    );


  if (!toast) {
    return;
  }


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.__vindarrShareToast
  );


  window.__vindarrShareToast =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2500
    );

}


// =====================================
// EDIT PROFILE
// =====================================

function openEditProfile() {

  if (!isOwnProfile) {
    return;
  }


  document.getElementById(
    "editUsername"
  ).value =
    currentProfileUser?.username ||
    "";


  document.getElementById(
    "editBio"
  ).value =
    currentProfileUser?.bio ||
    "";


  document.getElementById(
    "editProfileModal"
  ).style.display =
    "flex";

}


// =====================================
// LOAD POSTS
// =====================================

async function loadUserPosts(userId) {

  const token =
    localStorage.getItem("token");


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/user/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      throw new Error(
        "Unable to load posts"
      );

    }


    const result =
      await res.json();


    allPosts =
      Array.isArray(result)
        ? result
        : result.data || [];


    // =================================
    // COUNTS
    // =================================

    const videoCount =
      allPosts.filter(
        x => x.type === "video"
      ).length;


    const ebookCount =
      allPosts.filter(
        x => x.type === "ebook"
      ).length;


    const productCount =
      allPosts.filter(
        x =>
          x.type === "fashion" ||
          x.type === "essential"
      ).length;


    document.getElementById(
      "postCount"
    ).innerText =
      videoCount;


    document.getElementById(
      "ebookCount"
    ).innerText =
      ebookCount;


    document.getElementById(
      "productCount"
    ).innerText =
      productCount;


    renderPosts();


  } catch (err) {

    console.error(
      "Posts loading failed:",
      err
    );

  }

}


// =====================================
// SWITCH TAB
// =====================================

function switchTab(event, tab) {

  currentTab =
    tab;


  document
    .querySelectorAll(
      ".tab-btn"
    )
    .forEach(
      btn =>
        btn.classList.remove(
          "active-tab"
        )
    );


  const clickedButton =
    event.currentTarget;


  if (clickedButton) {

    clickedButton.classList.add(
      "active-tab"
    );

  }


  renderPosts();

}


// =====================================
// RENDER POSTS
// =====================================

function renderPosts() {

  const grid =
    document.getElementById(
      "profilePosts"
    );


  if (!grid) {
    return;
  }


  let filtered = [];


  // =================================
  // VIDEOS
  // =================================

  if (
    currentTab ===
    "videos"
  ) {

    filtered =
      allPosts.filter(
        x =>
          x.type === "video"
      );

  }


  // =================================
  // EBOOKS
  // =================================

  if (
    currentTab ===
    "ebooks"
  ) {

    filtered =
      allPosts.filter(
        x =>
          x.type === "ebook"
      );

  }


  // =================================
  // PRODUCTS
  // =================================

  if (
    currentTab ===
    "products"
  ) {

    filtered =
      allPosts.filter(
        x =>
          x.type === "fashion" ||
          x.type === "essential"
      );

  }


  // =================================
  // EMPTY
  // =================================

  if (!filtered.length) {

    grid.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">

          <i class="bi bi-grid-3x3-gap"></i>

        </div>

        <h3>
          No ${escapeHtml(currentTab)} yet
        </h3>

        <p>
          Content published by this creator
          will appear here.
        </p>

      </div>

    `;

    return;

  }


  // =================================
  // CARDS
  // =================================

  let html = "";


  filtered.forEach(
    post => {

      const media =
        post.type === "ebook"

          ? post.coverUrl

          : (
              post.coverUrl ||
              post.videoUrl ||
              post.fileUrl
            );


      const mediaUrl =
        getMediaUrl(
          media
        );


      const isVideo =
        post.type === "video" ||
        mediaUrl.includes(".mp4") ||
        mediaUrl.includes(".mov") ||
        mediaUrl.includes(".webm");


      const title =
        escapeHtml(
          post.title ||
          "Vindarr content"
        );


      const price =
        Number(
          post.price || 0
        );


      html += `

        <article
          class="profile-card"
          onclick="openProfilePost(${Number(post.id)}, '${escapeHtml(post.type)}')"
        >

          ${
            isVideo

              ? `

                <video
                  src="${escapeHtml(mediaUrl)}"
                  loop
                  playsinline
                  preload="metadata"
                  onclick="event.stopPropagation()"
                ></video>

              `

              : `

                <img
                  src="${escapeHtml(mediaUrl)}"
                  alt="${title}"
                  loading="lazy"
                >

              `
          }


          <div class="profile-card-shade"></div>


          <div class="profile-card-overlay">

            <h4>
              ${title}
            </h4>


            ${
              price > 0

                ? `

                  <div class="profile-product-meta">

                    <span>
                      ₦${price.toLocaleString()}
                    </span>

                    <button
                      class="buy-btn"
                      onclick="
                        event.stopPropagation();
                        buyItem(${Number(post.id)});
                      "
                    >
                      Buy
                    </button>

                  </div>

                `

                : ""
            }

          </div>

        </article>

      `;

    }
  );


  grid.innerHTML =
    html;


  // =================================
  // AUTOPLAY CARD VIDEOS
  // =================================

  setupProfileVideoObserver();

}


// =====================================
// OPEN PROFILE POST
// =====================================

function openProfilePost(
  id,
  type
) {

  if (
    type === "ebook" ||
    type === "fashion" ||
    type === "essential"
  ) {

    window.location.href =
      `product.html?id=${encodeURIComponent(id)}`;

    return;

  }


  window.location.href =
    `index.html?video=${encodeURIComponent(id)}`;

}


// =====================================
// BUY
// =====================================

function buyItem(id) {

  window.location.href =
    `product.html?id=${encodeURIComponent(id)}`;

}


// =====================================
// PROFILE VIDEO OBSERVER
// =====================================

let profileVideoObserver =
  null;


function setupProfileVideoObserver() {

  if (profileVideoObserver) {

    profileVideoObserver.disconnect();

  }


  const videos =
    document.querySelectorAll(
      ".profile-card video"
    );


  if (!videos.length) {
    return;
  }


  profileVideoObserver =
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
        threshold: 0.55
      }
    );


  videos.forEach(
    video =>
      profileVideoObserver.observe(
        video
      )
  );

}


// =====================================
// SAVE PROFILE
// =====================================

async function saveProfile() {

  const token =
    localStorage.getItem("token");


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  try {

    let avatarUrl =
      "";


    const avatarFile =
      document.getElementById(
        "editAvatar"
      ).files[0];


    // =================================
    // AVATAR UPLOAD
    // =================================

    if (avatarFile) {

      const avatarData =
        new FormData();


      avatarData.append(
        "file",
        avatarFile
      );


      const uploadRes =
        await fetch(
          `${API_BASE_URL}/upload/avatar`,
          {
            method: "POST",
            body: avatarData
          }
        );


      const uploadJson =
        await uploadRes.json();


      if (!uploadRes.ok) {

        throw new Error(
          uploadJson.message ||
          "Avatar upload failed"
        );

      }


      avatarUrl =
        uploadJson.avatar ||
        "";

    }


    // =================================
    // PROFILE DATA
    // =================================

    const payload = {

      username:
        document.getElementById(
          "editUsername"
        ).value.trim(),

      bio:
        document.getElementById(
          "editBio"
        ).value.trim()

    };


    if (avatarUrl) {

      payload.avatar =
        avatarUrl;

    }


    const res =
      await fetch(
        `${API_BASE_URL}/profile`,
        {
          method: "PATCH",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    const data =
      await res.json();


    if (!res.ok) {

      throw new Error(
        data.message ||
        "Profile update failed"
      );

    }


    // =================================
    // LOCAL STORAGE
    // =================================

    localStorage.setItem(
      "user",
      JSON.stringify(data)
    );


    localStorage.setItem(
      "username",
      data.username
    );


    currentProfileUser =
      data;


    closeEditProfile();


    await loadProfile();


  } catch (err) {

    console.error(
      "Profile update failed:",
      err
    );


    alert(
      err.message ||
      "Unable to update profile"
    );

  }

}


// =====================================
// CLOSE EDIT MODAL
// =====================================

function closeEditProfile() {

  const modal =
    document.getElementById(
      "editProfileModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }

}


// =====================================
// ADD TO PURVIEW
// =====================================

async function addCreatorToPurview(
  creatorId
) {

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
        `${API_BASE_URL}/purview/${creatorId}`,
        {
          method: "POST",

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    const data =
      await res.json()
        .catch(
          () => ({})
        );


    if (!res.ok) {

      throw new Error(
        data.message ||
        "Unable to add creator"
      );

    }


    alert(
      "Creator added to Purview"
    );


  } catch (err) {

    console.error(
      "Purview error:",
      err
    );


    alert(
      err.message ||
      "Unable to add creator to Purview"
    );

  }

}


// =====================================
// MODAL CLICK OUTSIDE
// =====================================

document.addEventListener(
  "click",
  event => {

    const modal =
      document.getElementById(
        "editProfileModal"
      );


    if (
      modal &&
      event.target === modal
    ) {

      closeEditProfile();

    }

  }
);


// =====================================
// INIT
// =====================================

loadProfile();