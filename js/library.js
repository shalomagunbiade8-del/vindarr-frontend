// =====================================
// VINDARR LIBRARY
// js/library.js
// =====================================


const token =
  localStorage.getItem("token");


if (!token) {

  window.location.href =
    "login.html";

}


let purchasedBooks = [];


// =====================================
// LOAD LIBRARY
// =====================================

loadLibrary();


async function loadLibrary() {

  const grid =
    document.getElementById(
      "libraryGrid"
    );


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/library/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      throw new Error(
        `Library request failed: ${res.status}`
      );

    }


    const data =
      await res.json();


    purchasedBooks =
      Array.isArray(data)
        ? data
        : data.data || [];


    renderLibrary();


  } catch (err) {

    console.error(
      "Library loading failed:",
      err
    );


    if (grid) {

      grid.innerHTML = `

        <div class="library-empty">

          <div class="library-empty-icon">

            <i class="bi bi-exclamation-circle"></i>

          </div>

          <h2>
            Unable to load your library
          </h2>

          <p>
            Something went wrong while loading
            your purchased books.
          </p>

          <button
            class="library-btn"
            onclick="loadLibrary()"
          >
            Try Again
          </button>

        </div>

      `;

    }

  }

}


// =====================================
// MEDIA URL
// =====================================

function getLibraryCover(book) {

  const cover =
    book.coverImage ||
    book.coverUrl ||
    book.cover ||
    "";


  if (!cover) {

    return "";

  }


  if (
    cover.startsWith("http://") ||
    cover.startsWith("https://")
  ) {

    return cover;

  }


  return API_BASE_URL + cover;

}


// =====================================
// ESCAPE HTML
// =====================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// =====================================
// RENDER LIBRARY
// =====================================

function renderLibrary() {

  const grid =
    document.getElementById(
      "libraryGrid"
    );


  const count =
    document.getElementById(
      "libraryCount"
    );


  if (!grid) {

    return;

  }


  // ===================================
  // UPDATE COUNT
  // ===================================

  if (count) {

    const total =
      purchasedBooks.length;


    count.textContent =
      `${total} ${
        total === 1
          ? "book"
          : "books"
      }`;

  }


  // ===================================
  // EMPTY LIBRARY
  // ===================================

  if (!purchasedBooks.length) {

    grid.innerHTML = `

      <div class="library-empty">

        <div class="library-empty-icon">

          <i class="bi bi-book"></i>

        </div>

        <span class="library-empty-label">
          YOUR LIBRARY
        </span>

        <h2>
          Your library is waiting
        </h2>

        <p>
          Purchase ebooks from the Vindarr
          marketplace and they will appear here.
        </p>

        <a
          href="market.html"
          class="library-btn"
        >
          <i class="bi bi-bag"></i>
          Explore Marketplace
        </a>

      </div>

    `;

    return;

  }


  // ===================================
  // BOOK CARDS
  // ===================================

  grid.innerHTML =
    purchasedBooks
      .map((book, index) => {

        const cover =
          getLibraryCover(book);


        const title =
          escapeHtml(
            book.title ||
            "Untitled"
          );


        const author =
          escapeHtml(
            book.creatorUsername ||
            book.creator?.username ||
            "Unknown author"
          );


        return `

          <article
            class="library-card"
            style="--card-index:${index}"
          >

            <button
              class="library-cover-button"
              onclick="openBook('${book.id}')"
              aria-label="Read ${title}"
            >

              ${
                cover

                  ? `

                    <img
                      src="${escapeHtml(cover)}"
                      class="library-cover"
                      alt="${title}"
                      loading="lazy"
                    >

                  `

                  : `

                    <div class="library-cover-placeholder">

                      <i class="bi bi-book"></i>

                      <span>
                        Vindarr
                      </span>

                    </div>

                  `
              }


              <div class="library-cover-overlay">

                <span>
                  <i class="bi bi-book-open"></i>
                  Read
                </span>

              </div>

            </button>


            <div class="library-info">

              <h2>
                ${title}
              </h2>

              <p class="library-author">

                <span>
                  by
                </span>

                ${author}

              </p>


              <button
                class="read-btn"
                onclick="openBook('${book.id}')"
              >

                <i class="bi bi-book-open"></i>

                Read Ebook

                <i class="bi bi-arrow-right"></i>

              </button>

            </div>

          </article>

        `;

      })
      .join("");

}


// =====================================
// OPEN BOOK
// =====================================

function openBook(id) {

  if (!id) {

    return;

  }


  window.location.href =
    `ebook-detail.html?id=${encodeURIComponent(id)}`;

}