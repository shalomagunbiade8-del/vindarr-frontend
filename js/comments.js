// =====================================
// VINDARR COMMENTS PAGE
// =====================================

"use strict";

const params =
  new URLSearchParams(window.location.search);

const videoId =
  params.get("video");

const storyId =
  params.get("story");

let token =
  localStorage.getItem("token");


// =====================================
// STATE
// =====================================

let comments = [];

let replyingTo = null;


// =====================================
// DOM
// =====================================

const commentsList =
  document.getElementById("commentsList");

const commentCount =
  document.getElementById("commentCount");

const commentInput =
  document.getElementById("commentInput");

const sendCommentBtn =
  document.getElementById("sendCommentBtn");


// =====================================
// LOAD COMMENTS
// =====================================

async function loadComments() {

  if (!commentsList) {
    return;
  }

  try {

    let url = "";

    // ---------------------------------
    // STORY
    // ---------------------------------

    if (storyId) {

      url =
        `${API_BASE_URL}/comments/story/${encodeURIComponent(storyId)}`;

    }

    // ---------------------------------
    // VIDEO
    // ---------------------------------

    else if (videoId) {

      url =
        `${API_BASE_URL}/comments/video/${encodeURIComponent(videoId)}`;

    }

    // ---------------------------------
    // NOTHING
    // ---------------------------------

    else {

      commentsList.innerHTML = `
        <div class="empty-comments">
          <i class="bi bi-chat-square-text"></i>
          <div>Nothing to comment on.</div>
        </div>
      `;

      return;

    }


    const response =
      await fetch(
        url,
        {
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`
              }
            : {}
        }
      );


    if (!response.ok) {

      throw new Error(
        "Failed to load comments."
      );

    }


    const data =
      await response.json();


    /*
     * The API normally returns an array,
     * but this also supports { data: [] }.
     */

    comments =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];


    renderComments(
      comments
    );

  }

  catch (error) {

    console.error(
      "Load comments error:",
      error
    );


    commentsList.innerHTML = `
      <div class="empty-comments">

        <i class="bi bi-exclamation-circle"></i>

        <div>
          Unable to load comments.
        </div>

      </div>
    `;

  }

}


// =====================================
// RENDER COMMENTS
// =====================================

function renderComments(
  allComments
) {

  if (!commentsList) {
    return;
  }


  /*
   * Total comments includes replies.
   */

  if (commentCount) {

    commentCount.textContent =
      allComments.length;

  }


  if (!allComments.length) {

    commentsList.innerHTML = `

      <div class="empty-comments">

        <i class="bi bi-chat-square-text"></i>

        <div>
          No comments yet.
        </div>

        <small>
          Be the first to comment.
        </small>

      </div>

    `;

    return;

  }


  /*
   * Separate top-level comments
   * from replies.
   */

  const topLevel =
    allComments.filter(
      comment =>
        !comment.parentId
    );


  /*
   * Group replies by parentId.
   */

  const repliesByParent =
    new Map();


  allComments
    .filter(
      comment =>
        comment.parentId
    )
    .forEach(
      reply => {

        const parentId =
          String(
            reply.parentId
          );


        if (
          !repliesByParent.has(
            parentId
          )
        ) {

          repliesByParent.set(
            parentId,
            []
          );

        }


        repliesByParent
          .get(parentId)
          .push(reply);

      }
    );


  /*
   * Render every top-level comment
   * together with its replies.
   */

  commentsList.innerHTML =
    topLevel
      .map(
        comment =>
          renderCommentThread(
            comment,
            repliesByParent
          )
      )
      .join("");


  /*
   * Handle orphaned replies gracefully.
   *
   * This protects the UI if a parent comment
   * was deleted but the reply still exists.
   */

  const renderedIds =
    new Set(
      topLevel.map(
        comment =>
          String(comment.id)
      )
    );


  const orphanReplies =
    allComments.filter(
      comment =>
        comment.parentId &&
        !renderedIds.has(
          String(comment.parentId)
        )
    );


  if (orphanReplies.length) {

    commentsList.insertAdjacentHTML(
      "beforeend",
      `
        <div class="orphan-replies">

          ${orphanReplies
            .map(
              reply =>
                renderSingleComment(
                  reply,
                  true
                )
            )
            .join("")}

        </div>
      `
    );

  }

}


// =====================================
// RENDER COMMENT THREAD
// =====================================

function renderCommentThread(
  comment,
  repliesByParent
) {

  const replies =
    repliesByParent.get(
      String(comment.id)
    ) || [];


  return `

    <div
      class="comment-thread"
      data-comment-id="${escapeHtml(comment.id)}"
    >

      ${renderSingleComment(
        comment,
        false
      )}


      ${
        replies.length
          ? `
            <div class="comment-replies">

              ${replies
                .map(
                  reply =>
                    renderSingleComment(
                      reply,
                      true
                    )
                )
                .join("")}

            </div>
          `
          : ""
      }

    </div>

  `;

}


// =====================================
// RENDER SINGLE COMMENT
// =====================================

function renderSingleComment(
  comment,
  isReply = false
) {

  const avatarRaw =
    comment.user?.avatar ||
    comment.author?.avatar ||
    "";


  const avatar =
    normalizeAvatar(
      avatarRaw
    );


  const username =
    comment.user?.username ||
    comment.author?.username ||
    "User";


  const message =
    comment.text ||
    comment.content ||
    "";


  const createdAt =
    comment.createdAt ||
    comment.created_at;


  const commentId =
    comment.id;


  /*
   * Replies can themselves be replied to.
   *
   * We always set parentId to the comment
   * the user clicked Reply on.
   */

  return `

    <article
      class="
        comment-card
        ${isReply ? "comment-reply" : ""}
      "
      data-comment-id="${escapeHtml(commentId)}"
    >

      <img
        class="comment-avatar"
        src="${escapeHtml(avatar)}"
        alt=""
        loading="lazy"
        onerror="this.onerror=null;this.src='https://i.pravatar.cc/100';"
      >


      <div class="comment-body">

        <div class="comment-user">

          @${escapeHtml(username)}

        </div>


        <div class="comment-text">

          ${escapeHtml(message)}

        </div>


        <div class="comment-actions-row">

          <span class="comment-time">

            ${formatCommentTime(createdAt)}

          </span>


          <button
            type="button"
            class="comment-reply-btn"
            onclick="startReply(${Number(commentId)}, '${escapeJsString(username)}')"
          >

            <i class="bi bi-reply"></i>

            Reply

          </button>

        </div>

      </div>

    </article>

  `;

}


// =====================================
// START REPLY
// =====================================

function startReply(
  commentId,
  username
) {

  const comment =
    comments.find(
      item =>
        String(item.id) ===
        String(commentId)
    );


  if (!comment) {

    console.warn(
      "Comment not found:",
      commentId
    );

    return;

  }


  replyingTo = {

    id: comment.id,

    username:
      username ||
      comment.user?.username ||
      comment.author?.username ||
      "User"

  };


  showReplyIndicator();


  if (commentInput) {

    commentInput.placeholder =
      `Reply to @${replyingTo.username}`;

    commentInput.focus();

  }


  /*
   * Scroll the composer into view on mobile.
   */

  document
    .querySelector(".comment-composer")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });

}


// =====================================
// CANCEL REPLY
// =====================================

function cancelReply() {

  replyingTo = null;


  hideReplyIndicator();


  if (commentInput) {

    commentInput.placeholder =
      "Add a comment...";

  }

}


// =====================================
// REPLY INDICATOR
// =====================================

function showReplyIndicator() {

  if (!commentInput) {
    return;
  }


  let indicator =
    document.getElementById(
      "replyingIndicator"
    );


  if (!indicator) {

    indicator =
      document.createElement(
        "div"
      );

    indicator.id =
      "replyingIndicator";

    indicator.className =
      "replying-indicator";

    /*
     * Insert immediately above
     * the composer input row.
     */

    const composerInner =
      document.querySelector(
        ".composer-inner"
      );


    composerInner?.parentNode
      ?.insertBefore(
        indicator,
        composerInner
      );

  }


  indicator.innerHTML = `

    <span>

      <i class="bi bi-reply-fill"></i>

      Replying to
      <strong>
        @${escapeHtml(replyingTo?.username || "User")}
      </strong>

    </span>


    <button
      type="button"
      onclick="cancelReply()"
      aria-label="Cancel reply"
    >

      <i class="bi bi-x-lg"></i>

    </button>

  `;


  indicator.classList.add(
    "visible"
  );

}


// =====================================
// HIDE REPLY INDICATOR
// =====================================

function hideReplyIndicator() {

  const indicator =
    document.getElementById(
      "replyingIndicator"
    );


  indicator?.classList.remove(
    "visible"
  );

}


// =====================================
// SUBMIT COMMENT / REPLY
// =====================================

async function submitComment() {

  if (!commentInput) {
    return;
  }


  const text =
    commentInput.value.trim();


  if (!text) {
    return;
  }


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  if (sendCommentBtn) {

    sendCommentBtn.disabled =
      true;

  }


  try {

    let url = "";

    let body = {};


    // =================================
    // STORY
    // =================================

    if (storyId) {

      /*
       * Your current backend uses:
       *
       * POST /comments
       *
       * with storyId.
       *
       * The old frontend was incorrectly
       * using /stories/:id/comments.
       */

      url =
        `${API_BASE_URL}/comments`;

      body = {

        storyId:
          Number(storyId),

        text,

        ...(replyingTo?.id
          ? {
              parentId:
                Number(
                  replyingTo.id
                )
            }
          : {})

      };

    }


    // =================================
    // VIDEO
    // =================================

    else if (videoId) {

      url =
        `${API_BASE_URL}/comments`;

      body = {

        videoId:
          Number(videoId),

        text,

        ...(replyingTo?.id
          ? {
              parentId:
                Number(
                  replyingTo.id
                )
            }
          : {})

      };

    }


    // =================================
    // NOTHING
    // =================================

    else {

      throw new Error(
        "Nothing to comment on."
      );

    }


    const response =
      await fetch(
        url,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:
            JSON.stringify(body)

        }
      );


    let responseData =
      null;


    try {

      responseData =
        await response.json();

    } catch {

      responseData =
        null;

    }


    if (!response.ok) {

      throw new Error(
        responseData?.message ||
        "Unable to post comment."
      );

    }


    /*
     * Clear composer.
     */

    commentInput.value = "";


    /*
     * Return composer to normal
     * comment mode.
     */

    cancelReply();


    /*
     * Reload so the newly-created reply
     * appears under the correct parent.
     */

    await loadComments();

  }

  catch (error) {

    console.error(
      "Submit comment error:",
      error
    );


    alert(
      error.message ||
      "Unable to post comment."
    );

  }

  finally {

    if (sendCommentBtn) {

      sendCommentBtn.disabled =
        false;

    }

  }

}


// =====================================
// ENTER TO SEND
// =====================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      document.activeElement?.id ===
        "commentInput"
    ) {

      event.preventDefault();

      submitComment();

    }

  }
);


// =====================================
// ESCAPE
// =====================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      replyingTo
    ) {

      cancelReply();

    }

  }
);


// =====================================
// SAFE HTML
// =====================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =====================================
// SAFE JS STRING
// =====================================

function escapeJsString(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      "'",
      "\\'"
    )
    .replaceAll(
      "\n",
      "\\n"
    )
    .replaceAll(
      "\r",
      "\\r"
    );

}


// =====================================
// AVATAR
// =====================================

function normalizeAvatar(
  avatar
) {

  if (
    typeof avatar !==
    "string"
  ) {

    return "https://i.pravatar.cc/100";

  }


  const value =
    avatar.trim();


  if (!value) {

    return "https://i.pravatar.cc/100";

  }


  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
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
// COMMENT TIME
// =====================================

function formatCommentTime(
  date
) {

  if (!date) {
    return "";
  }


  const created =
    new Date(date);


  if (
    Number.isNaN(
      created.getTime()
    )
  ) {

    return "";

  }


  const now =
    new Date();


  const seconds =
    Math.floor(
      (now.getTime() -
        created.getTime()) /
      1000
    );


  if (seconds < 60) {

    return "now";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  if (minutes < 60) {

    return `${minutes}m`;

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (hours < 24) {

    return `${hours}h`;

  }


  const days =
    Math.floor(
      hours / 24
    );


  if (days < 7) {

    return `${days}d`;

  }


  return created.toLocaleDateString();

}


// =====================================
// GLOBALS
// =====================================

window.submitComment =
  submitComment;

window.startReply =
  startReply;

window.cancelReply =
  cancelReply;


// =====================================
// INITIALIZE
// =====================================

loadComments();