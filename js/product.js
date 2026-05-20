let currentProduct = null;

// ===============================
// GET PRODUCT ID
// ===============================

const params =
  new URLSearchParams(window.location.search);

const productId =
  params.get("id");

// ===============================
// LOAD PRODUCT
// ===============================

async function loadProduct() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/videos/${productId}`
      );

    currentProduct =
  await res.json();

renderProduct(currentProduct);
loadReviews();

  } catch (err) {

    console.error(err);

  }

}

// ===============================
// RENDER PRODUCT
// ===============================

function renderProduct(product) {

  const container =
    document.getElementById("productContainer");

  if (!container) return;

 const media =
  product.videoUrl ||
  product.fileUrl ||
  product.coverUrl ||
  '';

const mediaUrl =
  media?.startsWith("http")
    ? media
    : `${API_BASE_URL}${media}`;

  container.innerHTML = `

    <!-- MEDIA -->
    <div class="product-media">

      ${
        product.type === "ebook"

        ? `
          <img src="${mediaUrl}">
        `

        : `
          <video
            src="${mediaUrl}"
            autoplay
            muted
            loop
            controls
          ></video>
        `
      }

    </div>

    <!-- CONTENT -->
    <div class="product-content">

      <div class="product-title">
        ${product.title || 'Untitled'}
      </div>

      <div class="product-price">
        ${formatPrice(product.price || 0)}
      </div>

      <!-- CREATOR -->
      <div class="product-creator">

        <img
  src="${
  product.creatorAvatar
    ? (
        product.creatorAvatar.startsWith("http")
          ? product.creatorAvatar
          : API_BASE_URL + product.creatorAvatar
      )
    : 'https://i.pravatar.cc/100'
}"

  onclick="openCreatorProfile('${product.creatorUsername}')"
>

<div>

  <strong
    onclick="openCreatorProfile('${product.creatorUsername}')"
    style="cursor:pointer"
  >
    @${product.creatorUsername || 'creator'}
  </strong>

</div>

      </div>

      <!-- DESCRIPTION -->
      <div class="product-description">

        ${product.context || ''}

      </div>

      <!-- ACTIONS -->
      <!-- ACTIONS -->
<div class="product-actions">

  <button
    class="buy-btn"
    onclick="buyNow()">

    ${
      product.type === "ebook"
      ? "Buy Ebook"
      : "Buy Product"
    }

  </button>

  <button
    class="chat-btn"
    onclick="chatSeller()">

    Chat Seller

  </button>

</div>

<!-- REVIEWS -->
<div class="reviews-section">

  <div class="reviews-top">

    <h3>
      Reviews
    </h3>

    <div class="rating-summary">

      ⭐ ${product.averageRating || 0}
      (${product.totalReviews || 0})

    </div>

  </div>

  <!-- ADD REVIEW -->
  <div class="review-form">

    <div class="rating-stars">

      <i class="bi bi-star"
      onclick="setRating(1,this)"></i>

      <i class="bi bi-star"
      onclick="setRating(2,this)"></i>

      <i class="bi bi-star"
      onclick="setRating(3,this)"></i>

      <i class="bi bi-star"
      onclick="setRating(4,this)"></i>

      <i class="bi bi-star"
      onclick="setRating(5,this)"></i>

    </div>

    <textarea
      id="reviewText"
      placeholder="Write a review..."
      class="review-input"
    ></textarea>

    <button
      class="submit-review-btn"
      onclick="submitReview()">

      Submit Review

    </button>

  </div>

  <!-- REVIEWS LIST -->
  <div id="reviewsList"></div>

</div>
    </div>

  `;

}

// ===============================
// BUY
// ===============================

function buyNow() {

  window.location.href =
  `checkout.html?id=${productId}`;

}

// ===============================
// CHAT
// ===============================

function chatSeller() {

  if(!currentProduct) return;

  window.location.href =
    `chat.html?user=${currentProduct.creatorId}`;

}

function openCreatorProfile(username){

  window.location.href =
    `profile.html?user=${username}`;

}

// ===============================
// INIT
// ===============================

loadProduct();

let selectedRating = 0;

async function loadReviews(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/reviews/${productId}`
    );

    const reviews =
    await res.json();

    renderReviews(reviews);

  }catch(err){

    console.error(err);

  }

}

function renderReviews(reviews){

  const container =
  document.getElementById("reviewsList");

  if(!reviews.length){

    container.innerHTML = `

      <div class="empty-reviews">

        No reviews yet

      </div>

    `;

    return;

  }

  container.innerHTML =
  reviews.map(review => `

    <div class="review-card">

      <div class="review-top">

        <div class="review-user">

          <img
            src="${
  review.userAvatar
  ? (
      review.userAvatar.startsWith("http")
        ? review.userAvatar
        : API_BASE_URL + review.userAvatar
    )
  : 'https://i.pravatar.cc/100'
}"
          >

          <div>

            <strong>
              @${review.username}
            </strong>

            <div class="review-stars">

              ${"⭐".repeat(review.rating)}

            </div>

          </div>

        </div>

      </div>

      <div class="review-text">

        ${review.comment || ''}

      </div>

    </div>

  `).join("");

}

function setRating(rating, element){

  selectedRating = rating;

  const stars =
  document.querySelectorAll(
    ".rating-stars i"
  );

  stars.forEach((star,index)=>{

    if(index < rating){

      star.classList.remove("bi-star");

      star.classList.add("bi-star-fill");

    }else{

      star.classList.remove("bi-star-fill");

      star.classList.add("bi-star");

    }

  });

}

async function submitReview(){

  const token =
  localStorage.getItem("token");

  if(!token){

    alert("Login required");

    return;

  }

  const comment =
  document.getElementById("reviewText").value;

  if(!selectedRating){

    alert("Select rating");

    return;

  }

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/reviews`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({
          productId,
          rating:selectedRating,
          comment
        })
      }
    );

    if(res.ok){

      document.getElementById(
        "reviewText"
      ).value = "";

      selectedRating = 0;

      loadReviews();

      loadProduct();

    }

  }catch(err){

    console.error(err);

  }

}