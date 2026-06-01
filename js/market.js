// ===============================
// LOAD MARKET ITEMS
// ===============================

async function loadMarket() {

  try {

    const res =
      await fetch(`${API_BASE_URL}/videos/market`);

    const data =
      await res.json();

    const posts =
      data.data || data;

    renderEbooks(posts);

renderProducts(posts);

renderEssentials(posts);

  } catch (err) {

    console.error(err);

  }

}

// ===============================
// EBOOKS
// ===============================

function renderEbooks(posts) {

  const ebooks =
    posts.filter(p => p.type === "ebook");

  const grid =
    document.getElementById("ebooksGrid");

  if (!grid) return;

  grid.innerHTML =
    ebooks.map(book => `

      <div class="ebook-card"
onclick="openProduct(${book.id})">

        <img
  src="${
    book.coverUrl?.startsWith("http")
      ? book.coverUrl
      : API_BASE_URL + book.coverUrl
  }"
>

        <div class="ebook-content">

          <div class="ebook-title">
            ${book.title || 'Untitled'}
          </div>

          <div>
            @${book.creatorUsername || 'creator'}
          </div>

          <div class="ebook-price">
            ${formatPrice(book.price || 0)}
          </div>

        </div>

      </div>

    `).join("");

}

// ===============================
// PRODUCTS
// ===============================

function renderProducts(posts) {

  const products =
    posts.filter(p => p.type === "fashion");

  const grid =
    document.getElementById("productsGrid");

  if (!grid) return;

  grid.innerHTML =
    products.map(product => `

      <div class="product-card"
onclick="openProduct(${product.id})">

       ${
  (product.fileUrl || "").includes(".mp4") ||
  (product.fileUrl || "").includes(".mov") ||
  (product.fileUrl || "").includes(".webm")

  ? `

    <video
      src="${
        product.fileUrl?.startsWith("http")
          ? product.fileUrl
          : API_BASE_URL + product.fileUrl
      }"
      autoplay
      loop
      playsinline
    ></video>

  `

  : `

    <img
      src="${
        product.fileUrl?.startsWith("http")
          ? product.fileUrl
          : API_BASE_URL + product.fileUrl
      }"
    >

  `
}

        <div class="product-content">

          <div class="product-title">
            ${product.title || 'Product'}
          </div>

          <div>
            @${product.creatorUsername || 'seller'}
          </div>

          <div class="product-price">
            ${formatPrice(product.price || 0)}
          </div>

        </div>

      </div>

    `).join("");

}

function renderEssentials(posts) {

  const essentials =
    posts.filter(
      p => p.type === "essential"
    );

  const grid =
    document.getElementById(
      "essentialsGrid"
    );

  if (!grid) return;

  grid.innerHTML =
    essentials.map(item => `

      <div
        class="product-card"
        onclick="openProduct(${item.id})">

        ${
          (item.fileUrl || "").includes(".mp4") ||
          (item.fileUrl || "").includes(".mov") ||
          (item.fileUrl || "").includes(".webm")

          ?

          `
          <video
            src="${
              item.fileUrl?.startsWith("http")
                ? item.fileUrl
                : API_BASE_URL + item.fileUrl
            }"
            autoplay
            loop
            playsinline>
          </video>
          `

          :

          `
          <img
            src="${
              item.fileUrl?.startsWith("http")
                ? item.fileUrl
                : API_BASE_URL + item.fileUrl
            }">
          `
        }

        <div class="product-content">

          <div class="product-title">
            ${item.title}
          </div>

          <div>
            @${item.creatorUsername}
          </div>

          <div class="product-price">
            ${formatPrice(item.price || 0)}
          </div>

        </div>

      </div>

    `).join("");

}

// ===============================
// INITIALIZE
// ===============================

loadMarket();

// ===============================
// OPEN PRODUCT
// ===============================

function openProduct(id) {

  window.location.href =
    `product.html?id=${id}`;

}