const token = localStorage.getItem("token");

if(!token){
  window.location.href = "login.html";
}

let purchasedBooks = [];

loadLibrary();

async function loadLibrary(){

  try{

    const res = await fetch(`${API_BASE_URL}/library/me`,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    });

    const data = await res.json();

    purchasedBooks = data || [];

    renderLibrary();

  }catch(err){

    console.error(err);

    document.getElementById("libraryGrid").innerHTML = `
      <div class="library-empty">
        Failed to load library
      </div>
    `;

  }

}

function renderLibrary(){

  const grid =
    document.getElementById("libraryGrid");

  if(!purchasedBooks.length){

    grid.innerHTML = `
      <div class="library-empty">

        <h2>No ebooks purchased yet</h2>

        <p>
          Buy ebooks from the marketplace
          to see them here.
        </p>

        <a href="market.html" class="library-btn">
          Explore Market
        </a>

      </div>
    `;

    return;
  }

  grid.innerHTML =
    purchasedBooks.map(book => `

      <div class="library-card">

        <img
          src="${API_BASE_URL + (book.coverImage || "")}"
          class="library-cover"
        >

        <div class="library-info">

          <h3>${book.title || "Untitled"}</h3>

          <p class="library-author">
            by ${book.creatorUsername || "Unknown"}
          </p>

          <button
            class="read-btn"
            onclick="openBook('${book.id}')"
          >
            Read Ebook
          </button>

        </div>

      </div>

    `).join("");

}

function openBook(id){

  window.location.href =
    `ebook-detail.html?id=${id}`;

}