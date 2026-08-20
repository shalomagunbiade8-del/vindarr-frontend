const token =
  localStorage.getItem("token");

if (!token) {

  window.location.href =
    "login.html";

}


let creatorPosts = [];


/* =================================
INIT
================================= */

loadDashboard();


/* =================================
LOAD DASHBOARD
================================= */

async function loadDashboard() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      throw new Error(
        "Failed to load creator content"
      );

    }


    const posts =
      await res.json();


    creatorPosts =
      Array.isArray(posts)
        ? posts
        : [];


    renderDashboardStats();

    renderDashboardPosts();


  } catch (err) {

    console.error(
      "Dashboard error:",
      err
    );


    const container =
      document.getElementById(
        "dashboardPosts"
      );


    if (container) {

      container.innerHTML = `

        <div class="dashboard-error">

          <div class="error-icon">
            <i class="bi bi-cloud-slash"></i>
          </div>

          <h3>
            Couldn't load your content
          </h3>

          <p>
            Check your connection and try again.
          </p>

          <button
            onclick="loadDashboard()"
            class="retry-btn"
          >
            Try again
          </button>

        </div>

      `;

    }

  }

}


/* =================================
MEDIA URL
================================= */

function getMediaUrl(url) {

  if (!url) {
    return "";
  }


  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {

    return url;

  }


  return `${API_BASE_URL}${url}`;

}


/* =================================
ESCAPE HTML
================================= */

function escapeDashboardHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =================================
STATS
================================= */

function renderDashboardStats() {

  let totalSales = 0;


  creatorPosts.forEach(post => {

    const price =
      Number(post.price || 0);

    const sales =
      Number(post.salesCount || 0);


    totalSales +=
      price * sales;

  });


  const totalSalesElement =
    document.getElementById(
      "totalSales"
    );


  const totalBooksElement =
    document.getElementById(
      "totalBooks"
    );


  const totalProductsElement =
    document.getElementById(
      "totalProducts"
    );


  if (totalSalesElement) {

    totalSalesElement.innerText =
      `₦${totalSales.toLocaleString()}`;

  }


  const ebooks =
    creatorPosts.filter(
      post =>
        post.type === "ebook"
    );


  const products =
    creatorPosts.filter(
      post =>
        post.type === "fashion"
    );


  if (totalBooksElement) {

    totalBooksElement.innerText =
      ebooks.length;

  }


  if (totalProductsElement) {

    totalProductsElement.innerText =
      products.length;

  }

}


/* =================================
RENDER POSTS
================================= */

function renderDashboardPosts() {

  const container =
    document.getElementById(
      "dashboardPosts"
    );


  if (!container) return;


  if (!creatorPosts.length) {

    container.innerHTML = `

      <div class="dashboard-empty">

        <div class="empty-icon">

          <i class="bi bi-stars"></i>

        </div>

        <span class="empty-label">
          YOUR STUDIO
        </span>

        <h3>
          Your canvas is empty.
        </h3>

        <p>
          Publish your first video, ebook
          or product and start building
          your Vindarr presence.
        </p>

        <a
          href="publish.html"
          class="empty-publish-btn"
        >

          <i class="bi bi-plus-lg"></i>

          Publish your first creation

        </a>

      </div>

    `;

    return;

  }


  container.innerHTML =
    creatorPosts.map(post => {

      const title =
        escapeDashboardHtml(
          post.title || "Untitled"
        );


      const type =
        escapeDashboardHtml(
          post.type || "content"
        );


      const understandCount =
        Number(
          post.understandCount || 0
        );


      const views =
        Number(
          post.views || 0
        );


      const comments =
        Array.isArray(post.comments)
          ? post.comments.length
          : Number(
              post.commentCount || 0
            );


      let media = "";


      if (post.type === "video") {

        const video =
          post.videoUrl ||
          post.file ||
          post.fileUrl ||
          "";


        const videoUrl =
          getMediaUrl(video);


        if (videoUrl) {

          media = `

            <video
              src="${videoUrl}"
              muted
              playsinline
              preload="metadata"
              controls
            ></video>

          `;

        } else {

          media = `

            <div class="media-placeholder">

              <i class="bi bi-camera-video"></i>

              <span>
                Video unavailable
              </span>

            </div>

          `;

        }

      } else {

        const image =
          post.coverUrl ||
          post.thumbnail ||
          post.coverImage ||
          post.fileUrl ||
          post.videoUrl ||
          "";


        const imageUrl =
          getMediaUrl(image);


        if (imageUrl) {

          media = `

            <img
              src="${imageUrl}"
              alt="${title}"
              loading="lazy"
            >

          `;

        } else {

          media = `

            <div class="media-placeholder">

              <i class="bi bi-image"></i>

              <span>
                No preview
              </span>

            </div>

          `;

        }

      }


      const price =
        post.price
          ? `

            <div class="dash-price">

              ₦${Number(
                post.price
              ).toLocaleString()}

            </div>

          `
          : "";


      return `

        <article
          class="dashboard-post-card"
        >

          <div class="dashboard-media">

            ${media}

            <div class="media-type">

              ${
                post.type === "video"
                  ? `<i class="bi bi-play-fill"></i>`
                  : post.type === "ebook"
                  ? `<i class="bi bi-book"></i>`
                  : `<i class="bi bi-bag"></i>`
              }

              ${type}

            </div>

          </div>


          <div class="dashboard-info">

            <div class="post-heading">

              <div>

                <h3>
                  ${title}
                </h3>

                <span class="dash-type">
                  ${type}
                </span>

              </div>

              ${price}

            </div>


            <div class="dash-stats">

              <span>

                <i class="bi bi-hand-thumbs-up"></i>

                ${understandCount}

              </span>


              <span>

                <i class="bi bi-chat"></i>

                ${comments}

              </span>


              <span>

                <i class="bi bi-eye"></i>

                ${views}

              </span>

            </div>


            <div class="dashboard-actions">

              <button
                class="edit-btn"
                onclick="editPost('${post.id}')"
              >

                <i class="bi bi-pencil"></i>

                Edit

              </button>


              <button
                class="delete-btn"
                onclick="deletePost('${post.id}')"
              >

                <i class="bi bi-trash3"></i>

                Delete

              </button>


              <button
                class="share-btn"
                onclick="sharePost('${post.id}')"
              >

                <i class="bi bi-share"></i>

                Share

              </button>

            </div>

          </div>

        </article>

      `;

    }).join("");

}


/* =================================
EDIT
================================= */

function editPost(id) {

  window.location.href =
    `publish.html?edit=${id}`;

}


/* =================================
DELETE
================================= */

async function deletePost(id) {

  const confirmDelete =
    confirm(
      "Delete this content?"
    );


  if (!confirmDelete) {
    return;
  }


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      alert(
        "Delete failed"
      );

      return;

    }


    creatorPosts =
      creatorPosts.filter(
        post =>
          post.id != id
      );


    renderDashboardStats();

    renderDashboardPosts();


  } catch (err) {

    console.error(
      "Delete error:",
      err
    );


    alert(
      "Network error"
    );

  }

}


/* =================================
SHARE
================================= */

async function sharePost(id) {

  const url =
    `${window.location.origin}/product.html?id=${id}`;


  try {

    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          "Vindarr",

        text:
          "Check this out on Vindarr",

        url

      });

      return;

    }


    await navigator.clipboard.writeText(
      url
    );


    alert(
      "Link copied"
    );


  } catch (err) {

    console.error(
      "Share error:",
      err
    );

  }

}