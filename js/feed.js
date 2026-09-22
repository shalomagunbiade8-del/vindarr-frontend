// ============================================================
// VINDARR FEED.JS
// Complete feed controller
// ============================================================

(() => {
  "use strict";

  // ============================================================
  // API
  // ============================================================

  const FEED_API_BASE =
    typeof API_BASE_URL !== "undefined"
      ? API_BASE_URL
      : typeof API !== "undefined"
        ? API
        : "https://vindarr-backend.onrender.com";

  const FEED_LIMIT = 10;

  // ============================================================
  // STATE
  // ============================================================

  let posts = [];

  let page = 1;

  let loadingMore = false;

  let hasMore = true;

  let initialized = false;

  let requestedVideoOpened = false;

  let lastTap = 0;

  let videoObserver = null;

  let scrollHandler = null;

  let savedState = new Map();

  let followedState = new Map();

  let audioState = new Map();

  // ============================================================
  // DOM
  // ============================================================

  const feed = document.getElementById("feed");

  if (!feed) {
    console.error("Vindarr feed: #feed element was not found.");
    return;
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function getToken() {
    return localStorage.getItem("token");
  }

  function getCurrentUserId() {
    const id =
      localStorage.getItem("userId") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("currentUserId");

    return id ? Number(id) : null;
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    if (!value) {
      return "";
    }

    const url = String(value).trim();

    if (!url) {
      return "";
    }

    return url;
  }

  function getPostId(post) {
    return (
      post?.id ??
      post?._id ??
      post?.videoId ??
      post?.postId ??
      null
    );
  }

  function getCreator(post) {
    return post?.creator || post?.user || post?.author || {};
  }

  function getCreatorId(post) {
    const creator = getCreator(post);

    return (
      post?.creatorId ??
      creator?.id ??
      creator?._id ??
      creator?.userId ??
      null
    );
  }

  function getCreatorName(post) {
    const creator = getCreator(post);

    return (
      creator?.username ||
      creator?.name ||
      creator?.displayName ||
      post?.username ||
      "Vindarr User"
    );
  }

  function getCreatorAvatar(post) {
    const creator = getCreator(post);

    return (
      safeUrl(
        creator?.avatar ||
        creator?.avatarUrl ||
        creator?.profileImage ||
        post?.avatar
      ) ||
      "https://i.pravatar.cc/100"
    );
  }

  function getPostType(post) {
    return String(
      post?.type ||
      post?.contentType ||
      "video"
    ).toLowerCase();
  }

  function getPostTitle(post) {
    return (
      post?.title ||
      post?.name ||
      "Untitled"
    );
  }

  function getPostDescription(post) {
    return (
      post?.context ||
      post?.description ||
      post?.caption ||
      ""
    );
  }

  function getCategory(post) {
    return (
      post?.category ||
      post?.genre ||
      "General"
    );
  }

  function getPrice(post) {
    const price =
      post?.price ??
      post?.amount ??
      0;

    const number = Number(price);

    if (!Number.isFinite(number) || number <= 0) {
      return 0;
    }

    return number;
  }

  function formatPrice(price) {
    const number = Number(price);

    if (!Number.isFinite(number) || number <= 0) {
      return "";
    }

    return `₦${number.toLocaleString("en-NG")}`;
  }

  function getVideoUrl(post) {
    return safeUrl(
      post?.videoUrl ||
      post?.video ||
      post?.url
    );
  }

  function getFileUrl(post) {
    return safeUrl(
      post?.fileUrl ||
      post?.file ||
      post?.ebookUrl ||
      post?.pdfUrl
    );
  }

  function getCoverUrl(post) {
    return safeUrl(
      post?.coverUrl ||
      post?.cover ||
      post?.coverImage ||
      post?.thumbnail
    );
  }

  function getUnderstandCount(post) {
    return Number(
      post?.understandCount ??
      post?.understands ??
      post?.understand ??
      0
    ) || 0;
  }

  function getCommentCount(post) {
    if (Array.isArray(post?.comments)) {
      return post.comments.length;
    }

    return Number(
      post?.commentCount ??
      post?.commentsCount ??
      0
    ) || 0;
  }

  function getCreatedAt(post) {
    return (
      post?.createdAt ||
      post?.created_at ||
      null
    );
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = Date.now();
    const diff = now - date.getTime();

    if (diff < 60 * 1000) {
      return "just now";
    }

    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}m`;
    }

    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}h`;
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d`;
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function normalizePosts(result) {
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    if (Array.isArray(result?.videos)) {
      return result.videos;
    }

    if (Array.isArray(result?.results)) {
      return result.results;
    }

    if (Array.isArray(result?.items)) {
      return result.items;
    }

    return [];
  }

  function deduplicatePosts(items) {
    const seen = new Set();
    const result = [];

    for (const post of items) {
      const id = getPostId(post);

      if (id === null || id === undefined) {
        continue;
      }

      const key = String(id);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(post);
    }

    return result;
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  function requireLogin() {
    if (isLoggedIn()) {
      return true;
    }

    window.location.href = "login.html";
    return false;
  }

  async function apiRequest(
    endpoint,
    options = {}
  ) {
    const headers = {
      ...(options.headers || {}),
    };

    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(
      `${FEED_API_BASE}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      localStorage.removeItem("token");
    }

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;

      throw new Error(message);
    }

    return data;
  }

  // ============================================================
  // SAVE STATE
  // ============================================================

  async function loadSavedStateForPost(postId) {
    const token = getToken();

    if (!token || !postId) {
      return;
    }

    try {
      const result = await apiRequest(
        `/saved/check/${postId}`
      );

      const saved =
        Boolean(result?.saved) ||
        Boolean(result?.isSaved) ||
        Boolean(result?.data?.saved);

      savedState.set(
        String(postId),
        {
          saved,
          savedId:
            result?.savedId ||
            result?.id ||
            result?.data?.savedId ||
            result?.data?.id ||
            null,
        }
      );

      updateSaveButton(postId);
    } catch (error) {
      console.warn(
        `Could not check saved state for ${postId}:`,
        error
      );
    }
  }

  async function loadSavedStates(items) {
    if (!getToken()) {
      return;
    }

    const promises = [];

    for (const post of items) {
      const id = getPostId(post);

      if (!id) {
        continue;
      }

      promises.push(
        loadSavedStateForPost(id)
      );
    }

    await Promise.allSettled(promises);
  }

  function updateSaveButton(postId) {
    const state =
      savedState.get(String(postId));

    const buttons =
      document.querySelectorAll(
        `[data-save-post="${postId}"]`
      );

    buttons.forEach((button) => {
      const saved = Boolean(state?.saved);

      button.classList.toggle(
        "active",
        saved
      );

      button.setAttribute(
        "aria-pressed",
        String(saved)
      );

      const text =
        button.querySelector(
          ".save-text"
        );

      if (text) {
        text.textContent =
          saved ? "Saved" : "Save";
      }
    });
  }

  // ============================================================
  // FOLLOW STATE
  // ============================================================

  async function loadFollowState(post) {
    const creatorId = getCreatorId(post);

    if (!creatorId || !getToken()) {
      return;
    }

    try {
      const result = await apiRequest(
        `/purview/${creatorId}`
      );

      const following =
        Boolean(result?.following) ||
        Boolean(result?.isFollowing) ||
        Boolean(result?.data?.following);

      followedState.set(
        String(creatorId),
        following
      );

      updateFollowButtons(creatorId);
    } catch (error) {
      console.warn(
        `Could not load follow state for ${creatorId}:`,
        error
      );
    }
  }

  function updateFollowButtons(creatorId) {
    const following =
      followedState.get(
        String(creatorId)
      );

    document
      .querySelectorAll(
        `[data-follow-creator="${creatorId}"]`
      )
      .forEach((button) => {
        button.classList.toggle(
          "active",
          Boolean(following)
        );

        button.textContent =
          following
            ? "Following"
            : "Follow";
      });
  }

  // ============================================================
  // VIDEO AUTOPLAY
  // ============================================================

  function setupVideoObserver() {
    if (videoObserver) {
      videoObserver.disconnect();
    }

    videoObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video =
              entry.target;

            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.65
            ) {
              document
                .querySelectorAll(
                  "#feed video"
                )
                .forEach((other) => {
                  if (other !== video) {
                    try {
                      other.pause();
                    } catch {}
                  }
                });

              const promise =
                video.play();

              if (
                promise &&
                typeof promise.catch ===
                  "function"
              ) {
                promise.catch(() => {});
              }
            } else {
              try {
                video.pause();
              } catch {}
            }
          });
        },
        {
          threshold: [0.25, 0.65, 0.9],
        }
      );

    document
      .querySelectorAll(
        "#feed video[data-autoplay='true']"
      )
      .forEach((video) => {
        videoObserver.observe(video);
      });
  }

  // ============================================================
  // MEDIA
  // ============================================================

  function buildMedia(post) {
    const type =
      getPostType(post);

    const videoUrl =
      getVideoUrl(post);

    const fileUrl =
      getFileUrl(post);

    const coverUrl =
      getCoverUrl(post);

    if (
      type === "ebook" ||
      type === "book"
    ) {
      const cover =
        coverUrl ||
        "https://via.placeholder.com/600x800?text=Vindarr+Book";

      return `
        <div
          class="feed-media ebook-media"
          data-media-id="${escapeHtml(getPostId(post))}"
        >
          <img
            src="${escapeHtml(cover)}"
            alt="${escapeHtml(getPostTitle(post))}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/600x800?text=Vindarr+Book';"
          >

          <div class="media-overlay">
            <span class="media-type-label">
              Ebook
            </span>
          </div>
        </div>
      `;
    }

    if (
      type === "fashion" ||
      type === "essential" ||
      type === "product"
    ) {
      const image =
        fileUrl ||
        coverUrl ||
        "https://via.placeholder.com/900x700?text=Vindarr+Product";

      return `
        <div
          class="feed-media product-media"
          data-media-id="${escapeHtml(getPostId(post))}"
        >
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(getPostTitle(post))}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://via.placeholder.com/900x700?text=Vindarr+Product';"
          >

          <div class="media-overlay">
            <span class="media-type-label">
              Product
            </span>
          </div>
        </div>
      `;
    }

    if (videoUrl) {
      return `
        <div
          class="feed-media video-media"
          data-media-id="${escapeHtml(getPostId(post))}"
        >
          <video
            src="${escapeHtml(videoUrl)}"
            playsinline
            muted
            loop
            preload="metadata"
            data-autoplay="true"
            controlslist="nodownload"
          ></video>

          <button
            type="button"
            class="video-play-overlay"
            data-action="play-video"
            data-post-id="${escapeHtml(getPostId(post))}"
            aria-label="Play video"
          >
            ▶
          </button>
        </div>
      `;
    }

    const image =
      fileUrl ||
      coverUrl ||
      "https://via.placeholder.com/900x700?text=Vindarr";

    return `
      <div
        class="feed-media image-media"
        data-media-id="${escapeHtml(getPostId(post))}"
      >
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(getPostTitle(post))}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://via.placeholder.com/900x700?text=Vindarr';"
        >
      </div>
    `;
  }

  // ============================================================
  // CARD BUILDER
  // ============================================================

  function buildVideoCard(post) {
    const id = getPostId(post);

    if (!id) {
      return "";
    }

    const creatorId =
      getCreatorId(post);

    const creatorName =
      getCreatorName(post);

    const creatorAvatar =
      getCreatorAvatar(post);

    const type =
      getPostType(post);

    const title =
      getPostTitle(post);

    const description =
      getPostDescription(post);

    const category =
      getCategory(post);

    const price =
      getPrice(post);

    const priceText =
      formatPrice(price);

    const understandCount =
      getUnderstandCount(post);

    const commentCount =
      getCommentCount(post);

    const createdAt =
      formatDate(
        getCreatedAt(post)
      );

    const media =
      buildMedia(post);

    const saved =
      Boolean(
        savedState.get(String(id))
          ?.saved
      );

    const following =
      Boolean(
        followedState.get(
          String(creatorId)
        )
      );

    const isOwnPost =
      getCurrentUserId() &&
      creatorId &&
      Number(getCurrentUserId()) ===
        Number(creatorId);

    const isEbook =
      type === "ebook" ||
      type === "book";

    const isProduct =
      type === "fashion" ||
      type === "essential" ||
      type === "product";

    const buyButton =
      isEbook
        ? `
          <button
            type="button"
            class="feed-commerce-btn ebook-buy-btn"
            data-action="buy-ebook"
            data-post-id="${escapeHtml(id)}"
          >
            ${priceText
              ? `Buy ${escapeHtml(priceText)}`
              : "View Ebook"}
          </button>
        `
        : isProduct
          ? `
            <button
              type="button"
              class="feed-commerce-btn product-buy-btn"
              data-action="buy-product"
              data-post-id="${escapeHtml(id)}"
            >
              ${priceText
                ? `Buy ${escapeHtml(priceText)}`
                : "Shop Product"}
            </button>
          `
          : "";

    return `
      <article
        class="card feed-card"
        data-post-id="${escapeHtml(id)}"
        data-post-type="${escapeHtml(type)}"
      >

        <!-- =====================================================
             CREATOR
        ====================================================== -->

        <div class="feed-creator-row">

          <button
            type="button"
            class="creator-profile-btn"
            data-action="open-creator"
            data-creator-id="${escapeHtml(creatorId || "")}"
          >
            <img
              class="creator-avatar"
              src="${escapeHtml(creatorAvatar)}"
              alt="${escapeHtml(creatorName)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='https://i.pravatar.cc/100';"
            >

            <div class="creator-meta">

              <strong>
                ${escapeHtml(creatorName)}
              </strong>

              <span>
                ${escapeHtml(createdAt)}
              </span>

            </div>
          </button>

          ${
            creatorId &&
            !isOwnPost
              ? `
                <button
                  type="button"
                  class="follow-btn ${
                    following ? "active" : ""
                  }"
                  data-action="follow"
                  data-follow-creator="${escapeHtml(creatorId)}"
                >
                  ${
                    following
                      ? "Following"
                      : "Follow"
                  }
                </button>
              `
              : ""
          }

          ${
            isOwnPost
              ? `
                <button
                  type="button"
                  class="post-menu-btn"
                  data-action="post-menu"
                  data-post-id="${escapeHtml(id)}"
                  aria-label="Post menu"
                >
                  ⋮
                </button>
              `
              : ""
          }

        </div>


        <!-- =====================================================
             TITLE
        ====================================================== -->

        <div class="feed-title-area">

          <h3 class="feed-title">
            ${escapeHtml(title)}
          </h3>

          ${
            category
              ? `
                <span class="feed-category">
                  ${escapeHtml(category)}
                </span>
              `
              : ""
          }

        </div>


        <!-- =====================================================
             MEDIA
        ====================================================== -->

        ${media}


        <!-- =====================================================
             DESCRIPTION / CAPTION
        ====================================================== -->

        ${
          description
            ? `
              <div class="feed-caption">

                <span class="caption-text">
                  ${escapeHtml(description)}
                </span>

                <button
                  type="button"
                  class="caption-more-btn"
                  data-action="toggle-caption"
                >
                  More
                </button>

              </div>
            `
            : ""
        }


        <!-- =====================================================
             PRODUCT / EBOOK INFO
        ====================================================== -->

        ${
          isEbook || isProduct
            ? `
              <div class="commerce-info">

                ${
                  priceText
                    ? `
                      <strong class="commerce-price">
                        ${escapeHtml(priceText)}
                      </strong>
                    `
                    : ""
                }

                ${
                  isEbook
                    ? `
                      <span class="commerce-type">
                        Ebook
                      </span>
                    `
                    : `
                      <span class="commerce-type">
                        Product
                      </span>
                    `
                }

              </div>
            `
            : ""
        }


        <!-- =====================================================
             ACTIONS
        ====================================================== -->

        <div class="feed-actions">

          <button
            type="button"
            class="feed-action understand-btn"
            data-action="understand"
            data-post-id="${escapeHtml(id)}"
          >
            <span class="action-icon">
              ✓
            </span>

            <span class="understand-count">
              ${understandCount}
            </span>

            <span>
              Understand
            </span>
          </button>


          <button
            type="button"
            class="feed-action comments-btn"
            data-action="comments"
            data-post-id="${escapeHtml(id)}"
          >
            <span class="action-icon">
              💬
            </span>

            <span>
              ${commentCount}
            </span>

            <span>
              Comments
            </span>
          </button>


          <button
            type="button"
            class="feed-action save-btn ${
              saved ? "active" : ""
            }"
            data-action="save"
            data-save-post="${escapeHtml(id)}"
            aria-pressed="${saved}"
          >
            <span class="action-icon">
              ${saved ? "★" : "☆"}
            </span>

            <span class="save-text">
              ${saved ? "Saved" : "Save"}
            </span>
          </button>


          <button
            type="button"
            class="feed-action"
            data-action="share"
            data-post-id="${escapeHtml(id)}"
          >
            <span class="action-icon">
              ↗
            </span>

            <span>
              Share
            </span>
          </button>

        </div>


        <!-- =====================================================
             COMMERCE ACTION
        ====================================================== -->

        ${
          buyButton
            ? `
              <div class="commerce-action-row">
                ${buyButton}
              </div>
            `
            : ""
        }


        <!-- =====================================================
             COMMENT INPUT
        ====================================================== -->

        <form
          class="feed-comment-form"
          data-comment-form="${escapeHtml(id)}"
        >

          <input
            type="text"
            name="comment"
            placeholder="Write a comment..."
            autocomplete="off"
            maxlength="1000"
          >

          <button
            type="submit"
            aria-label="Send comment"
          >
            Send
          </button>

        </form>

      </article>
    `;
  }

  // ============================================================
  // RENDER
  // ============================================================

  function renderVideos(
    items,
    reset = false
  ) {
    if (reset) {
      feed.innerHTML = "";
    }

    if (!items.length) {
      if (reset) {
        feed.innerHTML = `
          <div class="feed-empty">
            <div class="feed-empty-icon">
              ◌
            </div>

            <h3>
              Nothing here yet
            </h3>

            <p>
              New posts will appear here.
            </p>
          </div>
        `;
      }

      return;
    }

    const fragment =
      document.createDocumentFragment();

    for (const post of items) {
      const wrapper =
        document.createElement("div");

      wrapper.innerHTML =
        buildVideoCard(post);

      const card =
        wrapper.firstElementChild;

      if (card) {
        fragment.appendChild(card);
      }
    }

    feed.appendChild(fragment);

    setupVideoObserver();

    loadSavedStates(items);

    items.forEach((post) => {
      loadFollowState(post);
    });
  }

  // ============================================================
  // LOAD FEED
  // ============================================================

  async function loadVideos(
    reset = true
  ) {
    if (loadingMore) {
      return false;
    }

    if (!reset && !hasMore) {
      return false;
    }

    loadingMore = true;

    const requestedPage =
      reset ? 1 : page;

    if (reset) {
      page = 1;
      hasMore = true;
      requestedVideoOpened = false;
      posts = [];
      savedState.clear();
      followedState.clear();

      feed.innerHTML = `
        <div class="feed-loading">
          Loading...
        </div>
      `;
    }

    try {
      const result =
        await apiRequest(
          `/videos/feed?page=${requestedPage}&limit=${FEED_LIMIT}&_=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const incoming =
        normalizePosts(result);

      const existingIds =
        new Set(
          posts.map((post) =>
            String(getPostId(post))
          )
        );

      const uniqueIncoming =
        incoming.filter((post) => {
          const id =
            getPostId(post);

          if (
            id === null ||
            id === undefined
          ) {
            return false;
          }

          return !existingIds.has(
            String(id)
          );
        });

      posts = deduplicatePosts([
        ...posts,
        ...uniqueIncoming,
      ]);

      hasMore =
        typeof result?.hasMore ===
        "boolean"
          ? result.hasMore
          : incoming.length >= FEED_LIMIT;

      if (reset) {
        feed.innerHTML = "";
      }

      if (uniqueIncoming.length) {
        renderVideos(
          uniqueIncoming,
          false
        );
      } else if (reset) {
        renderVideos([], true);
      }

      if (reset) {
        page = 1;
      }

      return true;
    } catch (error) {
      console.error(
        "Vindarr feed loading error:",
        error
      );

      if (reset) {
        feed.innerHTML = `
          <div class="feed-error">

            <div class="feed-error-icon">
              ⚠
            </div>

            <h3>
              Unable to load videos
            </h3>

            <p>
              ${escapeHtml(error.message || "Something went wrong.")}
            </p>

            <button
              type="button"
              data-action="retry-feed"
            >
              Try again
            </button>

          </div>
        `;
      }

      return false;
    } finally {
      loadingMore = false;
    }
  }

  // ============================================================
  // LOAD MORE
  // ============================================================

  async function loadMoreVideos() {
    if (
      loadingMore ||
      !hasMore
    ) {
      return;
    }

    const nextPage =
      page + 1;

    const previousPage =
      page;

    page = nextPage;

    const success =
      await loadVideos(false);

    if (!success) {
      page = previousPage;
    }
  }

  // ============================================================
  // INFINITE SCROLL
  // ============================================================

  function setupInfiniteScroll() {
    if (scrollHandler) {
      window.removeEventListener(
        "scroll",
        scrollHandler
      );
    }

    scrollHandler = () => {
      if (
        loadingMore ||
        !hasMore
      ) {
        return;
      }

      const scrollPosition =
        window.innerHeight +
        window.scrollY;

      const documentHeight =
        document.documentElement
          .scrollHeight;

      const distanceFromBottom =
        documentHeight -
        scrollPosition;

      if (
        distanceFromBottom <= 900
      ) {
        loadMoreVideos();
      }
    };

    window.addEventListener(
      "scroll",
      scrollHandler,
      {
        passive: true,
      }
    );
  }

  // ============================================================
  // UNDERSTAND
  // ============================================================

  async function pressUnderstand(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!requireLogin()) {
      return;
    }

    const button =
      document.querySelector(
        `[data-action="understand"][data-post-id="${videoId}"]`
      );

    try {
      if (button) {
        button.disabled = true;
      }

      const result =
        await apiRequest(
          `/videos/${videoId}/understand`,
          {
            method: "POST",
          }
        );

      const post =
        posts.find(
          (item) =>
            String(getPostId(item)) ===
            String(videoId)
        );

      if (post) {
        post.understandCount =
          Number(
            result?.understandCount ??
            result?.count ??
            result?.data?.understandCount ??
            getUnderstandCount(post) + 1
          );
      }

      const count =
        Number(
          result?.understandCount ??
          result?.count ??
          result?.data?.understandCount ??
          getUnderstandCount(post || {})
        ) || 0;

      const countElement =
        document.querySelector(
          `[data-post-id="${videoId}"] .understand-count`
        );

      if (countElement) {
        countElement.textContent =
          String(count);
      }

      if (button) {
        button.classList.add(
          "active"
        );
      }
    } catch (error) {
      console.error(
        "Understand failed:",
        error
      );

      alert(
        error.message ||
        "Unable to register Understand."
      );
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  // ============================================================
  // SAVE
  // ============================================================

  async function toggleSave(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!requireLogin()) {
      return;
    }

    const key =
      String(videoId);

    const current =
      savedState.get(key) || {
        saved: false,
        savedId: null,
      };

    try {
      if (current.saved) {
        if (!current.savedId) {
          await loadSavedStateForPost(
            videoId
          );
        }

        const latest =
          savedState.get(key);

        if (!latest?.savedId) {
          throw new Error(
            "Saved item could not be found."
          );
        }

        await apiRequest(
          `/saved/${latest.savedId}`,
          {
            method: "DELETE",
          }
        );

        savedState.set(
          key,
          {
            saved: false,
            savedId: null,
          }
        );
      } else {
        const result =
          await apiRequest(
            "/saved",
            {
              method: "POST",
              body: JSON.stringify({
                videoId: Number(videoId),
              }),
            }
          );

        savedState.set(
          key,
          {
            saved: true,
            savedId:
              result?.id ??
              result?.savedId ??
              result?.data?.id ??
              result?.data?.savedId ??
              null,
          }
        );
      }

      updateSaveButton(
        videoId
      );
    } catch (error) {
      console.error(
        "Save action failed:",
        error
      );

      alert(
        error.message ||
        "Unable to update saved post."
      );
    }
  }

  // ============================================================
  // SHARE
  // ============================================================

  async function sharePost(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const url =
      `${window.location.origin}/index.html?video=${encodeURIComponent(videoId)}`;

    try {
      if (
        navigator.share
      ) {
        await navigator.share({
          title: "Vindarr",
          text: "Check this out on Vindarr.",
          url,
        });

        return;
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Post link copied."
        );

        return;
      }

      window.prompt(
        "Copy this link:",
        url
      );
    } catch (error) {
      if (
        error?.name !==
        "AbortError"
      ) {
        console.error(
          "Share failed:",
          error
        );
      }
    }
  }

  // ============================================================
  // FOLLOW
  // ============================================================

  async function toggleFollow(
    creatorId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!requireLogin()) {
      return;
    }

    const key =
      String(creatorId);

    const currentlyFollowing =
      Boolean(
        followedState.get(key)
      );

    try {
      const method =
        currentlyFollowing
          ? "DELETE"
          : "POST";

      await apiRequest(
        `/purview/${creatorId}`,
        {
          method,
        }
      );

      followedState.set(
        key,
        !currentlyFollowing
      );

      updateFollowButtons(
        creatorId
      );
    } catch (error) {
      console.error(
        "Follow action failed:",
        error
      );

      alert(
        error.message ||
        "Unable to update follow status."
      );
    }
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  async function openComments(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (
      typeof window.openCommentsPage ===
      "function"
    ) {
      window.openCommentsPage(
        videoId
      );

      return;
    }

    if (
      typeof window.openComments ===
      "function"
    ) {
      window.openComments(
        videoId
      );

      return;
    }

    // Fallback.
    try {
      const result =
        await apiRequest(
          `/comments/${videoId}`,
          {
            method: "GET",
          }
        );

      const comments =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

      const text =
        comments.length
          ? comments
              .map(
                (comment) =>
                  `${comment?.author?.username || comment?.username || "User"}: ${comment?.text || ""}`
              )
              .join("\n\n")
          : "No comments yet.";

      alert(text);
    } catch (error) {
      console.error(
        "Comments failed:",
        error
      );

      alert(
        "Unable to load comments."
      );
    }
  }

  async function submitComment(
    videoId,
    form
  ) {
    if (!requireLogin()) {
      return;
    }

    const input =
      form.querySelector(
        'input[name="comment"]'
      );

    if (!input) {
      return;
    }

    const text =
      input.value.trim();

    if (!text) {
      return;
    }

    try {
      input.disabled = true;

      await apiRequest(
        "/comments",
        {
          method: "POST",
          body: JSON.stringify({
            videoId: Number(videoId),
            text,
          }),
        }
      );

      input.value = "";

      const post =
        posts.find(
          (item) =>
            String(getPostId(item)) ===
            String(videoId)
        );

      if (post) {
        post.commentCount =
          getCommentCount(post) + 1;
      }

      const countElement =
        document.querySelector(
          `[data-post-id="${videoId}"] .comments-btn span:nth-child(2)`
        );

      if (countElement) {
        countElement.textContent =
          String(
            getCommentCount(post || {})
          );
      }

      if (
        typeof window.openCommentsPage ===
        "function"
      ) {
        window.openCommentsPage(
          videoId
        );
      }
    } catch (error) {
      console.error(
        "Comment submission failed:",
        error
      );

      alert(
        error.message ||
        "Unable to post comment."
      );
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  // ============================================================
  // CREATOR PROFILE
  // ============================================================

  function openCreator(
    creatorId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!creatorId) {
      return;
    }

    window.location.href =
      `profile.html?id=${encodeURIComponent(creatorId)}`;
  }

  // ============================================================
  // EBOOK
  // ============================================================

  function openEbook(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    window.location.href =
      `ebook.html?id=${encodeURIComponent(videoId)}`;
  }

  // ============================================================
  // PRODUCT
  // ============================================================

  function openProduct(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    window.location.href =
      `product.html?id=${encodeURIComponent(videoId)}`;
  }

  // ============================================================
  // VIDEO PLAY
  // ============================================================

  function toggleVideo(
    video,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!video) {
      return;
    }

    if (video.paused) {
      const promise =
        video.play();

      if (
        promise &&
        typeof promise.catch ===
          "function"
      ) {
        promise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }

  // ============================================================
  // DOUBLE TAP / CLICK VIDEO
  // ============================================================

  function handleVideoTap(
    video,
    event
  ) {
    if (!video) {
      return;
    }

    const now =
      Date.now();

    const difference =
      now - lastTap;

    if (
      difference > 0 &&
      difference < 350
    ) {
      event.preventDefault();
      event.stopPropagation();

      const card =
        video.closest(
          "[data-post-id]"
        );

      const postId =
        card?.dataset?.postId;

      if (postId) {
        pressUnderstand(
          postId,
          event
        );

        showHeartAnimation(
          card
        );
      }

      lastTap = 0;

      return;
    }

    lastTap = now;
  }

  function showHeartAnimation(
    card
  ) {
    if (!card) {
      return;
    }

    const heart =
      document.createElement(
        "div"
      );

    heart.className =
      "feed-heart-animation";

    heart.textContent =
      "♥";

    card.appendChild(
      heart
    );

    setTimeout(() => {
      heart.remove();
    }, 900);
  }

  // ============================================================
  // CAPTION
  // ============================================================

  function toggleCaption(
    button,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const caption =
      button.closest(
        ".feed-caption"
      );

    if (!caption) {
      return;
    }

    caption.classList.toggle(
      "expanded"
    );

    button.textContent =
      caption.classList.contains(
        "expanded"
      )
        ? "Less"
        : "More";
  }

  // ============================================================
  // DELETE POST
  // ============================================================

  async function deletePost(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!requireLogin()) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this post?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await apiRequest(
        `/videos/${videoId}`,
        {
          method: "DELETE",
        }
      );

      posts =
        posts.filter(
          (post) =>
            String(getPostId(post)) !==
            String(videoId)
        );

      const card =
        document.querySelector(
          `[data-post-id="${videoId}"]`
        );

      card?.remove();
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      alert(
        error.message ||
        "Unable to delete post."
      );
    }
  }

  // ============================================================
  // POST MENU
  // ============================================================

  function openPostMenu(
    videoId,
    event
  ) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const action =
      window.confirm(
        "Delete this post?\n\nPress OK to delete or Cancel to close."
      );

    if (action) {
      deletePost(
        videoId
      );
    }
  }

  // ============================================================
  // URL VIDEO
  // ============================================================

  function getRequestedVideoId() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("video") ||
      params.get("videoId") ||
      params.get("post")
    );
  }

  function openRequestedVideo() {
    if (
      requestedVideoOpened
    ) {
      return;
    }

    const requestedId =
      getRequestedVideoId();

    if (!requestedId) {
      return;
    }

    const card =
      document.querySelector(
        `[data-post-id="${CSS.escape(String(requestedId))}"]`
      );

    if (!card) {
      return;
    }

    requestedVideoOpened = true;

    card.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    card.classList.add(
      "requested-feed-post"
    );

    setTimeout(() => {
      card.classList.remove(
        "requested-feed-post"
      );
    }, 1800);
  }

  // ============================================================
  // EVENT DELEGATION
  // ============================================================

  function setupFeedEvents() {
    feed.addEventListener(
      "click",
      async (event) => {
        const target =
          event.target;

        const actionElement =
          target.closest(
            "[data-action]"
          );

        if (!actionElement) {
          return;
        }

        const action =
          actionElement.dataset.action;

        const postId =
          actionElement.dataset.postId;

        switch (action) {
          case "understand":
            await pressUnderstand(
              postId,
              event
            );
            break;

          case "comments":
            await openComments(
              postId,
              event
            );
            break;

          case "save":
            await toggleSave(
              postId,
              event
            );
            break;

          case "share":
            await sharePost(
              postId,
              event
            );
            break;

          case "follow":
            await toggleFollow(
              actionElement.dataset.followCreator,
              event
            );
            break;

          case "open-creator":
            openCreator(
              actionElement.dataset.creatorId,
              event
            );
            break;

          case "buy-ebook":
            openEbook(
              postId,
              event
            );
            break;

          case "buy-product":
            openProduct(
              postId,
              event
            );
            break;

          case "play-video": {
            const card =
              actionElement.closest(
                "[data-post-id]"
              );

            const video =
              card?.querySelector(
                "video"
              );

            toggleVideo(
              video,
              event
            );

            break;
          }

          case "toggle-caption":
            toggleCaption(
              actionElement,
              event
            );
            break;

          case "post-menu":
            openPostMenu(
              postId,
              event
            );
            break;

          case "retry-feed":
            await loadVideos(
              true
            );
            break;

          default:
            break;
        }
      }
    );

    feed.addEventListener(
      "dblclick",
      (event) => {
        const video =
          event.target.closest(
            "video"
          );

        if (!video) {
          return;
        }

        handleVideoTap(
          video,
          event
        );
      }
    );

    feed.addEventListener(
      "click",
      (event) => {
        const video =
          event.target.closest(
            "video"
          );

        if (!video) {
          return;
        }

        handleVideoTap(
          video,
          event
        );
      }
    );

    feed.addEventListener(
      "submit",
      async (event) => {
        const form =
          event.target.closest(
            ".feed-comment-form"
          );

        if (!form) {
          return;
        }

        event.preventDefault();

        const videoId =
          form.dataset.commentForm;

        await submitComment(
          videoId,
          form
        );
      }
    );
  }

  // ============================================================
  // OPTIONAL SEARCH
  // ============================================================

  function setupSearch() {
    const searchInput =
      document.getElementById(
        "searchInput"
      );

    if (!searchInput) {
      return;
    }

    let timeout = null;

    searchInput.addEventListener(
      "input",
      () => {
        clearTimeout(
          timeout
        );

        timeout =
          setTimeout(
            () => {
              const query =
                searchInput.value.trim();

              if (!query) {
                loadVideos(true);
                return;
              }

              searchVideos(
                query
              );
            },
            400
          );
      }
    );
  }

  async function searchVideos(
    query
  ) {
    if (!query) {
      await loadVideos(true);
      return;
    }

    try {
      loadingMore = true;

      feed.innerHTML = `
        <div class="feed-loading">
          Searching...
        </div>
      `;

      const result =
        await apiRequest(
          `/videos/search?q=${encodeURIComponent(query)}`
        );

      const results =
        normalizePosts(result);

      posts =
        deduplicatePosts(
          results
        );

      hasMore = false;
      page = 1;

      renderVideos(
        posts,
        true
      );
    } catch (error) {
      console.error(
        "Search failed:",
        error
      );

      feed.innerHTML = `
        <div class="feed-error">

          <h3>
            Search failed
          </h3>

          <p>
            ${escapeHtml(error.message || "Unable to search.")}
          </p>

        </div>
      `;
    } finally {
      loadingMore = false;
    }
  }

  // ============================================================
  // GLOBAL REFRESH
  // ============================================================

  window.refreshVindarrFeed =
    function () {
      return loadVideos(
        true
      );
    };

  window.loadMoreVindarrVideos =
    function () {
      return loadMoreVideos();
    };

  window.pressUnderstand =
    pressUnderstand;

  window.toggleSave =
    toggleSave;

  window.sharePost =
    sharePost;

  window.toggleFollow =
    toggleFollow;

  window.openComments =
    openComments;

  // ============================================================
  // INITIALIZE
  // ============================================================

  async function initFeed() {
    if (initialized) {
      return;
    }

    initialized = true;

    setupFeedEvents();

    setupInfiniteScroll();

    setupSearch();

    await loadVideos(
      true
    );

    // The first page is now rendered.
    // Give the browser one frame before checking
    // whether the URL points to a specific post.
    requestAnimationFrame(() => {
      openRequestedVideo();
    });
  }

  // ============================================================
  // START
  // ============================================================

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initFeed,
      {
        once: true,
      }
    );
  } else {
    initFeed();
  }

})();