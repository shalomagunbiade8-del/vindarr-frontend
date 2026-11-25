(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const token = localStorage.getItem("token");
  const PAGE_SIZE = 20;
  const DEFAULT_AVATAR = "https://i.pravatar.cc/100";

  const state = {
    posts: [],
    creators: [],
    page: 1,
    hasMore: true,
    loading: false,
    initialized: false,
    feedObserver: null,
    videoObserver: null
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function extractArray(result) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.items)) return result.items;
    return [];
  }

  function getId(item) {
    return item?.id ?? item?._id ?? item?.videoId ?? item?.userId;
  }

  function getCreatorId(creator) {
    return creator?.id ?? creator?._id ?? creator?.userId;
  }

  function getUsername(item) {
    return (
      item?.username ||
      item?.creatorUsername ||
      item?.creator?.username ||
      item?.creator?.name ||
      "Vindarr creator"
    );
  }

  function getAvatar(item) {
    return (
      item?.avatar ||
      item?.profileImage ||
      item?.profilePicture ||
      item?.creatorAvatar ||
      item?.creator?.avatar ||
      item?.creator?.profileImage ||
      DEFAULT_AVATAR
    );
  }

  function getMediaUrl(post) {
    return (
      post?.videoUrl ||
      post?.fileUrl ||
      post?.mediaUrl ||
      post?.coverUrl ||
      post?.cover ||
      post?.thumbnail ||
      post?.imageUrl ||
      post?.file ||
      ""
    );
  }

  function isVideoPost(post, url) {
    const type = String(post?.type || post?.mediaType || "").toLowerCase();

    if (type.includes("video")) return true;

    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || "");
  }

  function getPostType(post) {
    const type = String(post?.type || post?.mediaType || "").toLowerCase();

    if (type.includes("ebook")) return "E-book";
    if (type.includes("fashion")) return "Fashion";
    if (type.includes("product")) return "Product";
    if (type.includes("food")) return "Food";
    if (type.includes("video")) return "Video";

    const url = getMediaUrl(post);

    if (isVideoPost(post, url)) return "Video";

    return "Post";
  }

  function status(message, actionText, actionCallback) {
    const element = $("purviewFeedStatus");
    if (!element) return;

    element.textContent = message || "";

    if (actionText && actionCallback) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = actionText;
      button.addEventListener("click", actionCallback);
      element.appendChild(button);
    }
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    const text = await response.text();
    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        `Request failed (${response.status})`
      );
    }

    return result;
  }

  function openCreatorProfile(username) {
    if (!username) return;

    window.location.href =
      `profile.html?user=${encodeURIComponent(username)}`;
  }

  async function loadCreators() {
    const host = $("purviewCreators");
    if (!host) return;

    try {
      const result = await request(
        `${API_BASE_URL}/purview/my-creators`
      );

      state.creators = extractArray(result);

      renderCreators();
      renderCreatorDirectory();
    } catch (error) {
      console.error("Purview creators:", error);

      host.innerHTML = `
        <div class="empty-creators">
          <strong>Creators unavailable</strong>
          We couldn’t load your creator list.
        </div>
      `;
    }
  }

  function renderCreators() {
    const host = $("purviewCreators");
    if (!host) return;

    if (!state.creators.length) {
      host.innerHTML = `
        <div class="empty-creators">
          <strong>Your Purview is waiting for creators.</strong>
          Explore Vindarr and clock creators to see their latest posts here.
        </div>
      `;
      return;
    }

    host.innerHTML = state.creators.map((creator) => {
      const username = getUsername(creator);
      const avatar = getAvatar(creator);

      return `
        <button
          type="button"
          class="purview-creator"
          data-creator="${escapeHtml(username)}"
          title="Visit ${escapeHtml(username)}"
        >
          <span class="purview-creator-avatar-wrap">
            <img
              class="purview-creator-avatar"
              src="${escapeHtml(avatar)}"
              alt="${escapeHtml(username)}"
              loading="lazy"
            >
          </span>
          <span class="purview-creator-name">
            ${escapeHtml(username)}
          </span>
        </button>
      `;
    }).join("");
  }

  function renderCreatorDirectory(search = "") {
    const host = $("allCreatorsList");
    if (!host) return;

    const query = String(search).trim().toLowerCase();

    const filtered = state.creators.filter((creator) => {
      return getUsername(creator).toLowerCase().includes(query);
    });

    if (!filtered.length) {
      host.innerHTML = `
        <div class="creator-directory-empty">
          No creators found.
        </div>
      `;
      return;
    }

    host.innerHTML = filtered.map((creator) => {
      const username = getUsername(creator);
      const avatar = getAvatar(creator);

      return `
        <button
          type="button"
          class="creator-directory-item"
          data-creator="${escapeHtml(username)}"
        >
          <img
            src="${escapeHtml(avatar)}"
            alt=""
            loading="lazy"
          >
          <span>@${escapeHtml(username)}</span>
        </button>
      `;
    }).join("");
  }

  function renderCard(post) {
    const id = getId(post);

    const username = getUsername(post?.creator || post);
    const avatar = getAvatar(post?.creator || post);

    const title = post?.title || post?.name || "Untitled content";
    const context = post?.context || post?.description || "";
    const url = getMediaUrl(post);
    const video = isVideoPost(post, url);
    const type = getPostType(post);

    let media = "";

    if (url && video) {
      media = `
        <video
          class="purview-card-media is-video"
          src="${escapeHtml(url)}"
          muted
          loop
          playsinline
          preload="metadata"
        ></video>
        <button
          type="button"
          class="purview-audio-toggle"
          data-action="audio"
          data-id="${escapeHtml(id)}"
          aria-label="Unmute video"
        >
          <i class="bi bi-volume-mute-fill"></i>
          <span>Unmute</span>
        </button>
      `;
    } else if (url) {
      media = `
        <img
          class="purview-card-media ${type === "E-book" ? "is-cover" : ""}"
          src="${escapeHtml(url)}"
          alt="${escapeHtml(title)}"
          loading="lazy"
        >
      `;
    } else {
      media = `
        <div class="purview-media-placeholder">
          <i class="bi bi-image"></i>
        </div>
      `;
    }

    return `
      <article
        class="purview-card"
        data-post-id="${escapeHtml(id)}"
      >
        <div class="purview-media" data-open-post="${escapeHtml(id)}">
          ${media}

          <div class="purview-media-gradient"></div>

          <span class="purview-type-badge">
            <i class="bi bi-play-circle"></i>
            ${escapeHtml(type)}
          </span>

          <button
            type="button"
            class="purview-card-menu"
            data-action="menu"
            data-id="${escapeHtml(id)}"
            aria-label="Post options"
            aria-expanded="false"
          >
            <i class="bi bi-three-dots"></i>
          </button>
        </div>

        <div
          class="purview-card-menu-popover"
          data-menu-for="${escapeHtml(id)}"
          hidden
        >
          <button
            type="button"
            data-action="share"
            data-id="${escapeHtml(id)}"
          >
            <i class="bi bi-share"></i>
            Share
          </button>

          <button
            type="button"
            data-action="expand"
            data-id="${escapeHtml(id)}"
          >
            <i class="bi bi-arrows-fullscreen"></i>
            Expand
          </button>

          <button
            type="button"
            data-action="open"
            data-id="${escapeHtml(id)}"
          >
            <i class="bi bi-box-arrow-up-right"></i>
            Open post
          </button>
        </div>

        <div
          class="purview-card-info"
          data-open-post="${escapeHtml(id)}"
        >
          <div class="purview-card-creator">
            <img
              src="${escapeHtml(avatar)}"
              alt=""
              loading="lazy"
            >
            <span>@${escapeHtml(username)}</span>
          </div>

          <h3>${escapeHtml(title)}</h3>

          ${context ? `<p>${escapeHtml(context)}</p>` : ""}

          <div class="purview-card-footer">
            <span>View content</span>
            <i class="bi bi-arrow-up-right"></i>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeed(append = false) {
    const host = $("purviewFeed");
    if (!host) return;

    if (!state.posts.length) {
      host.innerHTML = `
        <div class="empty-purview">
          <div class="empty-purview-icon">
            <i class="bi bi-eye"></i>
          </div>

          <span class="section-kicker">YOUR PURVIEW</span>

          <h3>Your feed is just getting started</h3>

          <p>
            Clock creators from around Vindarr.
            Their videos, products and book covers will gather here.
          </p>

          <button
            type="button"
            class="empty-purview-btn"
            onclick="window.location.href='index.html'"
          >
            <i class="bi bi-compass"></i>
            Explore Vindarr
          </button>
        </div>
      `;
      return;
    }

    const cards = state.posts.map(renderCard).join("");

    if (append) {
      host.insertAdjacentHTML("beforeend", cards);
    } else {
      host.innerHTML = cards;
    }

    observeVideos();
  }

  async function loadPurviewFeed(reset = false) {
    if (state.loading || (!state.hasMore && !reset)) return;

    const host = $("purviewFeed");
    if (!host) return;

    if (reset) {
      state.page = 1;
      state.hasMore = true;
      state.posts = [];
      host.innerHTML = "";
    }

    state.loading = true;

    status(
      state.posts.length
        ? "Finding more from your creators…"
        : "Loading your creators’ latest…"
    );

    try {
      const result = await request(
        `${API_BASE_URL}/purview/feed?page=${state.page}&limit=${PAGE_SIZE}`
      );

      const incoming = extractArray(result);

      const known = new Set(
        state.posts.map((post) => String(getId(post)))
      );

      const fresh = incoming.filter((post) => {
        return !known.has(String(getId(post)));
      });

      state.posts.push(...fresh);

      const pagination =
        result && !Array.isArray(result) ? result : null;

      state.hasMore =
        typeof pagination?.hasMore === "boolean"
          ? pagination.hasMore
          : incoming.length === PAGE_SIZE;

      state.page += 1;

      renderFeed(state.posts.length > fresh.length);

      status(
        state.hasMore
          ? ""
          : (state.posts.length ? "You’re all caught up." : "")
      );

      if (state.hasMore && fresh.length === 0) {
        state.hasMore = false;
      }
    } catch (error) {
      console.error("Purview feed:", error);

      if (!state.posts.length) {
        host.innerHTML = `
          <div class="purview-error-state">
            <div class="purview-error-icon">
              <i class="bi bi-cloud-slash"></i>
            </div>

            <h3>Couldn’t load your Purview</h3>

            <p>
              Please check your connection and try again.
            </p>

            <button
              type="button"
              class="purview-retry-btn"
              id="purviewRetryBtn"
            >
              <i class="bi bi-arrow-clockwise"></i>
              Try again
            </button>
          </div>
        `;

        $("purviewRetryBtn")?.addEventListener(
          "click",
          () => loadPurviewFeed(true)
        );
      } else {
        status(
          "Couldn’t load more posts.",
          "Try again",
          () => loadPurviewFeed()
        );
      }
    } finally {
      state.loading = false;
    }
  }

  function openPost(post) {
    const id = getId(post);
    const type = String(post?.type || "").toLowerCase();

    if (!id) return;

    const destination = [
      "ebook",
      "fashion",
      "essential"
    ].includes(type)
      ? "product.html"
      : "video.html";

    window.location.href =
      `${destination}?id=${encodeURIComponent(id)}`;
  }

  function findPost(id) {
    return state.posts.find(
      (post) => String(getId(post)) === String(id)
    );
  }

  function closeMenus() {
    document
      .querySelectorAll(".purview-card-menu-popover")
      .forEach((menu) => {
        menu.hidden = true;
      });

    document
      .querySelectorAll(".purview-card-menu[aria-expanded=true]")
      .forEach((button) => {
        button.setAttribute("aria-expanded", "false");
      });
  }

  async function sharePost(post) {
    const type = String(post?.type || "").toLowerCase();

    const page = [
      "ebook",
      "fashion",
      "essential"
    ].includes(type)
      ? "product.html"
      : "video.html";

    const url = new URL(
      `${page}?id=${encodeURIComponent(getId(post))}`,
      window.location.href
    ).toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Vindarr",
          text: post?.context || "Check this out on Vindarr",
          url
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        status("Link copied to clipboard.");
      } else {
        window.prompt("Copy this link:", url);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }

  function showExpanded(post) {
    const host = $("expandedContent");
    const modal = $("purviewExpandModal");

    if (!host || !modal) return;

    const url = getMediaUrl(post);
    const video = isVideoPost(post, url);

    const media = url
      ? (
          video
            ? `
              <video
                src="${escapeHtml(url)}"
                controls
                autoplay
                playsinline
              ></video>
            `
            : `
              <img
                src="${escapeHtml(url)}"
                alt="${escapeHtml(post.title || "Content")}"
              >
            `
        )
      : `
        <div class="purview-media-placeholder">
          <i class="bi bi-image"></i>
        </div>
      `;

    host.innerHTML = `
      ${media}

      <div class="expanded-caption">
        <strong>
          ${escapeHtml(post.title || "Untitled content")}
        </strong>

        ${
          post.context
            ? `<p>${escapeHtml(post.context)}</p>`
            : ""
        }
      </div>
    `;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    modal.querySelectorAll("video").forEach((video) => {
      video.pause();
    });

    if (!document.querySelector(".purview-modal.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function observeVideos() {
    const videos = document.querySelectorAll(
      "#purviewFeed video:not([data-observed])"
    );

    if (!("IntersectionObserver" in window)) {
      videos.forEach((video) => {
        video.dataset.observed = "1";
        video.play().catch(() => {});
      });

      return;
    }

    if (!state.videoObserver) {
      state.videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target;

            if (
              entry.isIntersecting &&
              entry.intersectionRatio >= 0.55
            ) {
              video.muted = true;
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        {
          threshold: [0, 0.25, 0.55, 0.8]
        }
      );
    }

    videos.forEach((video) => {
      video.dataset.observed = "1";
      state.videoObserver.observe(video);
    });
  }

  function setupInfiniteScroll() {
    const sentinel = $("purviewFeedSentinel");

    if (
      !sentinel ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    state.feedObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadPurviewFeed();
        }
      },
      {
        rootMargin: "700px 0px"
      }
    );

    state.feedObserver.observe(sentinel);
  }

  function setupEvents() {
    $("purviewCreators")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-creator]");

      if (button) {
        openCreatorProfile(button.dataset.creator);
      }
    });

    $("allCreatorsList")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-creator]");

      if (button) {
        openCreatorProfile(button.dataset.creator);
      }
    });

    $("seeAllCreatorsBtn")?.addEventListener("click", () => {
      renderCreatorDirectory();

      const modal = $("creatorsModal");

      modal?.classList.add("is-open");
      modal?.setAttribute("aria-hidden", "false");

      document.body.style.overflow = "hidden";

      $("creatorModalSearch")?.focus();
    });

    $("creatorModalSearch")?.addEventListener("input", (event) => {
      renderCreatorDirectory(event.target.value);
    });

    $("purviewFeed")?.addEventListener(
      "click",
      async (event) => {
        const actionBtn = event.target.closest("[data-action]");

        if (actionBtn) {
          event.stopPropagation();

          const id = actionBtn.dataset.id;
          const action = actionBtn.dataset.action;
          const post = findPost(id);

          if (action === "menu") {
            const menu = document.querySelector(
              `[data-menu-for="${CSS.escape(String(id))}"]`
            );

            const open = menu?.hidden;

            closeMenus();

            if (menu && open) {
              menu.hidden = false;
              actionBtn.setAttribute("aria-expanded", "true");
            }

            return;
          }

          closeMenus();

          if (!post) return;

          if (action === "open") {
            openPost(post);
          }

          if (action === "share") {
            await sharePost(post);
          }

          if (action === "expand") {
            showExpanded(post);
          }

          if (action === "audio") {
            const video = actionBtn
              .closest(".purview-card")
              ?.querySelector("video");

            if (!video) return;

            video.muted = !video.muted;

            actionBtn.innerHTML = video.muted
              ? `
                <i class="bi bi-volume-mute-fill"></i>
                <span>Unmute</span>
              `
              : `
                <i class="bi bi-volume-up-fill"></i>
                <span>Mute</span>
              `;
          }

          return;
        }

        const target = event.target.closest("[data-open-post]");

        if (target) {
          const post = findPost(target.dataset.openPost);

          if (post) {
            openPost(post);
          }
        }
      }
    );

    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(
          ".purview-card-menu-popover,.purview-card-menu"
        )
      ) {
        closeMenus();
      }
    });

    document
      .querySelectorAll("[data-close-creators]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeModal($("creatorsModal"));
        });
      });

    document
      .querySelectorAll("[data-close-expand]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeModal($("purviewExpandModal"));
        });
      });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal($("creatorsModal"));
        closeModal($("purviewExpandModal"));
        closeMenus();
      }
    });
  }

  async function init() {
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    if (state.initialized) return;

    state.initialized = true;

    setupEvents();
    setupInfiniteScroll();

    await Promise.all([
      loadCreators(),
      loadPurviewFeed(true)
    ]);
  }

  window.openCreatorProfile = openCreatorProfile;
  window.loadPurviewFeed = () => loadPurviewFeed(true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();