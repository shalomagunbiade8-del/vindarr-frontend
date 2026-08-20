let currentProduct = null;

let selectedRating = 0;


// ======================================================
// GET PRODUCT ID
// ======================================================

const params =
  new URLSearchParams(
    window.location.search
  );

const productId =
  params.get("id");


// ======================================================
// SAFE HELPERS
// ======================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


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

  return API_BASE_URL + url;

}


function formatProductPrice(price) {

  const value =
    Number(price || 0);

  return "₦" +
    value.toLocaleString(
      "en-NG"
    );

}


function isVideoUrl(url) {

  if (!url) {
    return false;
  }

  const cleanUrl =
    url.split("?")[0].toLowerCase();

  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".m4v")
  );

}


// ======================================================
// BACK
// ======================================================

function goBack() {

  if (
    document.referrer &&
    document.referrer.includes(
      window.location.host
    )
  ) {

    window.history.back();

  } else {

    window.location.href =
      "index.html";

  }

}


// ======================================================
// LOAD PRODUCT
// ======================================================

async function loadProduct() {

  if (!productId) {

    renderError(
      "Product not found."
    );

    return;

  }

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/${productId}`
      );

    if (!res.ok) {

      throw new Error(
        "Unable to load product"
      );

    }

    currentProduct =
      await res.json();

    renderProduct(
      currentProduct
    );

    loadReviews();

    loadCreatorProducts();

  } catch (err) {

    console.error(err);

    renderError(
      "We couldn't load this product."
    );

  }

}


// ======================================================
// ERROR
// ======================================================

function renderError(message) {

  const container =
    document.getElementById(
      "productContainer"
    );

  if (!container) return;

  container.innerHTML = `

    <section class="product-error">

      <div class="product-error-icon">
        <i class="bi bi-exclamation-circle"></i>
      </div>

      <h2>
        Something went wrong
      </h2>

      <p>
        ${escapeHtml(message)}
      </p>

      <button
        class="error-back-btn"
        onclick="goBack()"
      >
        Go Back
      </button>

    </section>

  `;

}


// ======================================================
// RENDER PRODUCT
// ======================================================

function renderProduct(product) {

  const container =
    document.getElementById(
      "productContainer"
    );

  if (!container) return;


  const media =
    product.videoUrl ||
    product.fileUrl ||
    product.coverUrl ||
    "";


  const mediaUrl =
    getMediaUrl(media);


  const creatorAvatar =
    getMediaUrl(
      product.creatorAvatar
    ) ||
    "https://i.pravatar.cc/200";


  const title =
    escapeHtml(
      product.title ||
      "Untitled"
    );


  const creator =
    escapeHtml(
      product.creatorUsername ||
      "creator"
    );


  const description =
    escapeHtml(
      product.context ||
      "Discover more about this item on Vindarr."
    );


  const isEbook =
    product.type === "ebook";


  const isVideo =
    !isEbook &&
    isVideoUrl(mediaUrl);


  let mediaHtml = "";


  if (!mediaUrl) {

    mediaHtml = `

      <div class="product-media-placeholder">

        <i class="bi bi-image"></i>

        <span>
          No preview available
        </span>

      </div>

    `;

  } else if (isVideo) {

    mediaHtml = `

      <video
        class="product-main-video"
        src="${mediaUrl}"
        controls
        playsinline
        preload="metadata"
      ></video>

      <div class="media-badge">

        <i class="bi bi-play-circle-fill"></i>

        Video

      </div>

    `;

  } else {

    mediaHtml = `

      <img
        class="product-main-image"
        src="${mediaUrl}"
        alt="${title}"
        loading="eager"
        onerror="this.style.display='none';"
      >

      ${
        isEbook
        ? `
          <div class="media-badge">

            <i class="bi bi-book"></i>

            Ebook

          </div>
        `
        : ""
      }

    `;

  }


  container.innerHTML = `

    <!-- =========================================
    HERO MEDIA
    ========================================= -->

    <section class="product-hero">

      <div class="product-media">

        ${mediaHtml}

      </div>

    </section>


    <!-- =========================================
    PRODUCT CONTENT
    ========================================= -->

    <section class="product-content">

      <div class="product-main-column">


        <!-- PRODUCT TITLE -->

        <div class="product-heading">

          <div class="product-category">

            ${
              isEbook
              ? "EBOOK"
              : product.type === "video"
              ? "VIDEO"
              : "PRODUCT"
            }

          </div>

          <h1>
            ${title}
          </h1>

          <div class="product-price">

            ${formatProductPrice(
              product.price
            )}

          </div>

        </div>


        <!-- TRUST -->

        <div class="trust-row">

          <span>
            <i class="bi bi-patch-check-fill"></i>
            Verified Creator
          </span>

          <span>
            <i class="bi bi-shield-check"></i>
            Secure Checkout
          </span>

          ${
            product.type === "ebook"
            ? `
              <span>
                <i class="bi bi-book"></i>
                Digital Ebook
              </span>
            `
            : `
              <span>
                <i class="bi bi-stars"></i>
                Vindarr Pick
              </span>
            `
          }

        </div>


        <!-- CREATOR -->

        <div class="product-creator-card">

          <img
            src="${creatorAvatar}"
            alt="@${creator}"
            onclick="openCreatorProfile('${creator}')"
            onerror="
              this.src='https://i.pravatar.cc/200';
            "
          >

          <div class="creator-details">

            <span>
              Created by
            </span>

            <strong
              onclick="openCreatorProfile('${creator}')"
            >
              @${creator}
            </strong>

          </div>

          <button
            class="creator-view-btn"
            onclick="openCreatorProfile('${creator}')"
          >
            View
          </button>

        </div>


        <!-- DESCRIPTION -->

        <div class="product-description-section">

          <h2>
            About this ${isEbook ? "ebook" : "product"}
          </h2>

          <p>
            ${description}
          </p>

        </div>


        <!-- ACTIONS -->

        <div class="product-actions">

          <button
            class="buy-btn"
            onclick="buyNow()"
          >

            <i class="bi bi-bag-check"></i>

            ${
              isEbook
              ? "Buy Ebook"
              : "Buy Now"
            }

          </button>


          <button
            class="chat-btn"
            onclick="chatSeller()"
          >

            <i class="bi bi-chat-dots"></i>

            Chat Seller

          </button>


          <button
            class="share-btn"
            onclick="shareProduct()"
            aria-label="Share"
          >

            <i class="bi bi-share"></i>

            Share

          </button>

        </div>


        <!-- REVIEWS -->

        <section class="reviews-section">

          <div class="reviews-header">

            <div>

              <span class="section-eyebrow">
                COMMUNITY
              </span>

              <h2>
                Reviews
              </h2>

            </div>

            <div class="rating-summary">

              <div class="rating-number">

                <i class="bi bi-star-fill"></i>

                ${Number(
                  product.averageRating || 0
                ).toFixed(1)}

              </div>

              <span>
                ${
                  product.totalReviews || 0
                }
                ${
                  Number(
                    product.totalReviews || 0
                  ) === 1
                  ? "review"
                  : "reviews"
                }
              </span>

            </div>

          </div>


          <!-- REVIEW FORM -->

          <div class="review-form">

            <h3>
              Share your experience
            </h3>

            <p class="review-helper">
              Help other Vindarr users discover
              whether this is worth their attention.
            </p>


            <div class="rating-stars">

              <i
                class="bi bi-star"
                onclick="setRating(1,this)"
              ></i>

              <i
                class="bi bi-star"
                onclick="setRating(2,this)"
              ></i>

              <i
                class="bi bi-star"
                onclick="setRating(3,this)"
              ></i>

              <i
                class="bi bi-star"
                onclick="setRating(4,this)"
              ></i>

              <i
                class="bi bi-star"
                onclick="setRating(5,this)"
              ></i>

            </div>


            <textarea
              id="reviewText"
              class="review-input"
              placeholder="What did you think?"
              maxlength="1000"
            ></textarea>


            <button
              class="submit-review-btn"
              onclick="submitReview()"
            >

              Post Review

            </button>

          </div>


          <!-- REVIEWS LIST -->

          <div id="reviewsList">

            <div class="reviews-loading">

              Loading reviews...

            </div>

          </div>

        </section>


        <!-- MORE FROM CREATOR -->

        <section class="creator-section">

          <div class="creator-section-header">

            <div>

              <span class="section-eyebrow">
                DISCOVER
              </span>

              <h2>
                More from @${creator}
              </h2>

            </div>

            <button
              onclick="openCreatorProfile('${creator}')"
            >
              See all
              <i class="bi bi-arrow-right"></i>
            </button>

          </div>


          <div
            id="creatorProducts"
            class="creator-products"
          >

            <div class="creator-products-loading">
              Loading...
            </div>

          </div>

        </section>


      </div>

    </section>

  `;

}


// ======================================================
// BUY
// ======================================================

function buyNow() {

  window.location.href =
    `checkout.html?id=${productId}`;

}


// ======================================================
// CHAT SELLER
// ======================================================

function chatSeller() {

  if (!currentProduct) {
    return;
  }

  const username =
    currentProduct.creatorUsername;

  if (!username) {
    return;
  }

  window.location.href =
    `chat.html?user=${encodeURIComponent(username)}`;

}


// ======================================================
// CREATOR PROFILE
// ======================================================

function openCreatorProfile(username) {

  if (!username) {
    return;
  }

  window.location.href =
    `profile.html?user=${encodeURIComponent(username)}`;

}


// ======================================================
// REVIEWS
// ======================================================

async function loadReviews() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/reviews/${productId}`
      );

    if (!res.ok) {
      throw new Error(
        "Failed to load reviews"
      );
    }

    const reviews =
      await res.json();

    renderReviews(
      Array.isArray(reviews)
        ? reviews
        : []
    );

  } catch (err) {

    console.error(err);

    const container =
      document.getElementById(
        "reviewsList"
      );

    if (container) {

      container.innerHTML = `

        <div class="empty-reviews">

          Unable to load reviews.

        </div>

      `;

    }

  }

}


// ======================================================
// RENDER REVIEWS
// ======================================================

function renderReviews(reviews) {

  const container =
    document.getElementById(
      "reviewsList"
    );

  if (!container) {
    return;
  }


  if (!reviews.length) {

    container.innerHTML = `

      <div class="empty-reviews">

        <div class="empty-review-icon">

          <i class="bi bi-chat-square-heart"></i>

        </div>

        <h3>
          No reviews yet
        </h3>

        <p>
          Be the first person to share
          your experience.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    reviews.map(review => {

      const avatar =
        getMediaUrl(
          review.userAvatar
        ) ||
        "https://i.pravatar.cc/100";


      const rating =
        Math.max(
          0,
          Math.min(
            5,
            Number(review.rating || 0)
          )
        );


      return `

        <article class="review-card">

          <div class="review-top">

            <div class="review-user">

              <img
                src="${avatar}"
                alt="@${escapeHtml(
                  review.username || "user"
                )}"
                onerror="
                  this.src='https://i.pravatar.cc/100';
                "
              >

              <div>

                <strong>
                  @${escapeHtml(
                    review.username ||
                    "user"
                  )}
                </strong>

                <div class="review-stars">

                  ${"★".repeat(rating)}

                  ${"☆".repeat(
                    5 - rating
                  )}

                </div>

              </div>

            </div>

          </div>

          <p class="review-text">

            ${escapeHtml(
              review.comment ||
              ""
            )}

          </p>

        </article>

      `;

    }).join("");

}


// ======================================================
// SET RATING
// ======================================================

function setRating(
  rating,
  element
) {

  selectedRating =
    Number(rating);


  const stars =
    document.querySelectorAll(
      ".rating-stars i"
    );


  stars.forEach(
    (star, index) => {

      if (
        index < rating
      ) {

        star.classList.remove(
          "bi-star"
        );

        star.classList.add(
          "bi-star-fill"
        );

      } else {

        star.classList.remove(
          "bi-star-fill"
        );

        star.classList.add(
          "bi-star"
        );

      }

    }
  );

}


// ======================================================
// SUBMIT REVIEW
// ======================================================

async function submitReview() {

  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {

    alert(
      "Login required"
    );

    return;

  }


  const textarea =
    document.getElementById(
      "reviewText"
    );


  const comment =
    textarea
      ? textarea.value.trim()
      : "";


  if (!selectedRating) {

    alert(
      "Please select a rating."
    );

    return;

  }


  if (!comment) {

    alert(
      "Please write a review."
    );

    return;

  }


  const submitButton =
    document.querySelector(
      ".submit-review-btn"
    );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.innerHTML = `
      Posting...
    `;

  }


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/reviews`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({

            productId,

            rating:
              selectedRating,

            comment

          })
        }
      );


    const data =
      await res.json()
        .catch(() => ({}));


    if (!res.ok) {

      alert(
        data.message ||
        "Unable to post review."
      );

      return;

    }


    if (textarea) {
      textarea.value = "";
    }


    selectedRating =
      0;


    document
      .querySelectorAll(
        ".rating-stars i"
      )
      .forEach(star => {

        star.classList.remove(
          "bi-star-fill"
        );

        star.classList.add(
          "bi-star"
        );

      });


    await loadReviews();

    await loadProduct();

  } catch (err) {

    console.error(err);

    alert(
      "Network error while posting review."
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.innerHTML = `
        Post Review
      `;

    }

  }

}


// ======================================================
// SHARE
// ======================================================

async function shareProduct() {

  if (!currentProduct) {
    return;
  }


  const url =
    window.location.href;


  try {

    if (
      navigator.share
    ) {

      await navigator.share({

        title:
          currentProduct.title ||
          "Vindarr Product",

        text:
          "Check this out on Vindarr.",

        url

      });

    } else {

      await navigator.clipboard
        .writeText(url);

      showShareMessage(
        "Link copied"
      );

    }

  } catch (err) {

    if (
      err.name !==
      "AbortError"
    ) {

      console.error(err);

    }

  }

}


// ======================================================
// SHARE FEEDBACK
// ======================================================

function showShareMessage(message) {

  const existing =
    document.querySelector(
      ".share-toast"
    );

  if (existing) {
    existing.remove();
  }


  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "share-toast";


  toast.innerHTML = `

    <i class="bi bi-check-circle-fill"></i>

    ${escapeHtml(message)}

  `;


  document.body.appendChild(
    toast
  );


  setTimeout(() => {

    toast.classList.add(
      "hide"
    );

    setTimeout(
      () => toast.remove(),
      300
    );

  }, 2200);

}


// ======================================================
// MORE FROM CREATOR
// ======================================================

async function loadCreatorProducts() {

  if (!currentProduct) {
    return;
  }


  const username =
    currentProduct.creatorUsername;


  if (!username) {
    return;
  }


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/search?q=${encodeURIComponent(username)}`
      );


    if (!res.ok) {
      throw new Error(
        "Unable to load creator products"
      );
    }


    const data =
      await res.json();


    let products =
      Array.isArray(data)
        ? data
        : data.videos || [];


    products =
      products.filter(
        item =>
          String(item.id) !==
          String(productId)
      );


    renderCreatorProducts(
      products
    );

  } catch (err) {

    console.error(err);

    const container =
      document.getElementById(
        "creatorProducts"
      );

    if (container) {

      container.innerHTML = `

        <div class="creator-products-empty">

          No other items available.

        </div>

      `;

    }

  }

}


// ======================================================
// RENDER CREATOR PRODUCTS
// ======================================================

function renderCreatorProducts(
  products
) {

  const container =
    document.getElementById(
      "creatorProducts"
    );


  if (!container) {
    return;
  }


  if (!products.length) {

    container.innerHTML = `

      <div class="creator-products-empty">

        No other items yet.

      </div>

    `;

    return;

  }


  container.innerHTML =
    products.slice(0, 8)
      .map(item => {

        const media =
          item.coverUrl ||
          item.videoUrl ||
          item.fileUrl ||
          "";


        const mediaUrl =
          getMediaUrl(media);


        return `

          <article
            class="creator-product-card"
            onclick="
              window.location.href=
              'product.html?id=${item.id}'
            "
          >

            ${
              mediaUrl

              ?

              `
                <img
                  src="${mediaUrl}"
                  alt="${escapeHtml(
                    item.title ||
                    "Product"
                  )}"
                  loading="lazy"
                  onerror="
                    this.src='https://i.pravatar.cc/400';
                  "
                >
              `

              :

              `
                <div class="creator-product-placeholder">
                  <i class="bi bi-image"></i>
                </div>
              `
            }


            <div class="creator-product-info">

              <h4>

                ${escapeHtml(
                  item.title ||
                  "Untitled"
                )}

              </h4>

              ${
                item.price

                ?

                `
                  <strong>
                    ${formatProductPrice(
                      item.price
                    )}
                  </strong>
                `

                :

                ""

              }

            </div>

          </article>

        `;

      })
      .join("");

}


// ======================================================
// INIT
// ======================================================

loadProduct();