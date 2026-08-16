const token =
localStorage.getItem("token");

/* =====================================
HELPERS
===================================== */

/* =====================================
   HELPERS
===================================== */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

function getMediaUrl(post) {

let media = "";

if (post.type === "ebook") {


media =
  post.coverUrl ||
  "";


} else {


media =
  post.videoUrl ||
  post.fileUrl ||
  post.coverUrl ||
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

return API_BASE_URL + media;

}

function getAvatarUrl(avatar) {

if (!avatar) {


return "https://i.pravatar.cc/100";


}

if (
avatar.startsWith("http://") ||
avatar.startsWith("https://")
) {


return avatar;


}

return API_BASE_URL + avatar;

}

function isVideoPost(post, mediaUrl) {

return (
post.type === "video" ||
mediaUrl.includes(".mp4") ||
mediaUrl.includes(".mov") ||
mediaUrl.includes(".webm") ||
mediaUrl.includes("video/upload")
);

}

/* =====================================
LOAD CREATORS
===================================== */

async function loadCreators() {

const container =
document.getElementById(
"purviewCreators"
);

if (!container) {
return;
}

try {


const res =
  await fetch(
    `${API_BASE_URL}/purview/my-creators`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );


if (!res.ok) {

  throw new Error(
    `Creators request failed: ${res.status}`
  );

}


const result =
  await res.json();


const creators =
  Array.isArray(result)
    ? result
    : (
        Array.isArray(result.data)
          ? result.data
          : []
      );


renderCreators(creators);


} catch (err) {


console.error(
  "Failed to load Purview creators:",
  err
);


container.innerHTML = `

  <div class="purview-inline-error">

    <i class="bi bi-exclamation-circle"></i>

    <span>
      Unable to load creators
    </span>

  </div>

`;


}

}

/* =====================================
RENDER CREATORS
===================================== */

function renderCreators(creators) {

const container =
document.getElementById(
"purviewCreators"
);

if (!container) {
return;
}

if (!creators.length) {


container.innerHTML = `

  <div class="empty-creators">

    <div class="empty-creators-icon">
      <i class="bi bi-person-plus"></i>
    </div>

    <div>

      <strong>
        No creators yet
      </strong>

      <span>
        Follow creators from your feed
        to see their posts here.
      </span>

    </div>

  </div>

`;

return;


}

let html = "";

creators.forEach(
creator => {


  const username =
    creator.username ||
    "creator";


  const avatar =
    getAvatarUrl(
      creator.avatar
    );


  html += `

    <button
      type="button"
      class="purview-creator"
      onclick="openCreatorProfile('${escapeHtml(username)}')"
    >

      <span class="purview-creator-avatar-wrap">

        <img
          src="${escapeHtml(avatar)}"
          class="purview-creator-avatar"
          alt="${escapeHtml(username)}"
          loading="lazy"
        >

        <span class="creator-live-dot"></span>

      </span>


      <span class="purview-creator-name">

        @${escapeHtml(username)}

      </span>

    </button>

  `;

}


);

container.innerHTML =
html;

}

/* =====================================
OPEN CREATOR
===================================== */

function openCreatorProfile(
username
) {

window.location.href =
`profile.html?user=${encodeURIComponent(username)}`;

}

/* =====================================
LOAD PURVIEW FEED
===================================== */

async function loadPurviewFeed() {

const feed =
document.getElementById(
"purviewFeed"
);

if (!feed) {
return;
}

try {


const res =
  await fetch(
    `${API_BASE_URL}/purview/feed`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );


if (!res.ok) {

  throw new Error(
    `Purview feed request failed: ${res.status}`
  );

}


const result =
  await res.json();


const posts =
  Array.isArray(result)
    ? result
    : (
        Array.isArray(result.data)
          ? result.data
          : []
      );


renderPurviewFeed(posts);


} catch (err) {


console.error(
  "Failed to load Purview feed:",
  err
);


feed.innerHTML = `

  <div class="purview-error-state">

    <div class="purview-error-icon">

      <i class="bi bi-cloud-slash"></i>

    </div>

    <h3>
      Couldn't load your Purview
    </h3>

    <p>
      Please check your connection and try again.
    </p>

    <button
      type="button"
      onclick="loadPurviewFeed()"
      class="purview-retry-btn"
    >

      <i class="bi bi-arrow-clockwise"></i>

      Try again

    </button>

  </div>

`;


}

}

/* =====================================
RENDER PURVIEW FEED
===================================== */

function renderPurviewFeed(posts) {

const feed =
document.getElementById(
"purviewFeed"
);

if (!feed) {
return;
}

if (!posts.length) {


feed.innerHTML = `

  <div class="empty-purview">

    <div class="empty-purview-icon">

      <i class="bi bi-eye"></i>

    </div>

    <span class="section-kicker">
      YOUR PURVIEW
    </span>

    <h3>
      Nothing here yet
    </h3>

    <p>
      Add creators from your feed and
      their latest content will appear here.
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

let html = "";

posts.forEach(
post => {


  const mediaUrl =
    getMediaUrl(post);


  const creatorUsername =
    post.creator?.username ||
    post.creatorUsername ||
    "creator";


  const creatorAvatar =
    getAvatarUrl(
      post.creator?.avatar ||
      post.creatorAvatar
    );


  const isVideo =
    isVideoPost(
      post,
      mediaUrl
    );


  const title =
    post.title ||
    "Untitled content";


  const typeLabel =
    post.type === "ebook"
      ? "eBook"
      : post.type === "fashion"
        ? "Fashion"
        : post.type === "essential"
          ? "Essential"
          : "Video";


  html += `

    <article
      class="purview-card"
      onclick="openPurviewItem(${post.id}, '${escapeHtml(post.type || "")}')"
    >


      <!-- MEDIA -->

      <div class="purview-media">


        ${
          mediaUrl

            ? (

                isVideo

                  ? `

                    <video
                      src="${escapeHtml(mediaUrl)}"
                      class="purview-card-media"
                      playsinline
                      preload="metadata"
                    ></video>

                  `

                  : `

                    <img
                      src="${escapeHtml(mediaUrl)}"
                      class="purview-card-media"
                      alt="${escapeHtml(title)}"
                      loading="lazy"
                    >

                  `

              )

            : `

              <div class="purview-media-placeholder">

                <i class="bi bi-image"></i>

              </div>

            `
        }


        <!-- GRADIENT -->

        <div class="purview-media-gradient"></div>


        <!-- TYPE -->

        <span class="purview-type-badge">

          ${
            post.type === "ebook"
              ? `<i class="bi bi-book"></i>`
              : post.type === "fashion" ||
                post.type === "essential"
                ? `<i class="bi bi-bag"></i>`
                : `<i class="bi bi-play-fill"></i>`
          }

          ${escapeHtml(typeLabel)}

        </span>


        <!-- PLAY -->

        ${
          isVideo

            ? `

              <span class="purview-play">

                <i class="bi bi-play-fill"></i>

              </span>

            `

            : ""

        }


      </div>


      <!-- INFO -->

      <div class="purview-card-info">


        <div class="purview-card-creator">

          <img
            src="${escapeHtml(creatorAvatar)}"
            alt="${escapeHtml(creatorUsername)}"
            loading="lazy"
          >

          <span>
            @${escapeHtml(creatorUsername)}
          </span>

        </div>


        <h3>
          ${escapeHtml(title)}
        </h3>


        ${
          post.context

            ? `

              <p>
                ${escapeHtml(
                  post.context
                )}
              </p>

            `

            : ""

        }


        <div class="purview-card-footer">

          <span>
            View post
          </span>

          <i class="bi bi-arrow-up-right"></i>

        </div>


      </div>


    </article>

  `;

}


);

feed.innerHTML =
html;

}

/* =====================================
OPEN PURVIEW ITEM
===================================== */

function openPurviewItem(
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

/* =====================================
INIT
===================================== */

async function initPurview() {

if (!token) {


window.location.href =
  "login.html";

return;


}

await Promise.all([
loadCreators(),
loadPurviewFeed()
]);

}

initPurview();
