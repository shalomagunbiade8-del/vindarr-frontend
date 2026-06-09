const searchInput =
  document.getElementById("globalSearch");

const searchResults =
  document.getElementById("searchResults");

let searchTimeout;

searchInput.addEventListener("input",(e)=>{

  const query = e.target.value.trim();

  clearTimeout(searchTimeout);

  if(!query){

    renderEmptySearch();

    return;
  }

  searchTimeout =
    setTimeout(()=>{

      searchAll(query);

    },400);

});

renderEmptySearch();

async function searchAll(query){

  try{

    searchResults.innerHTML = `
      <div class="search-loading">
        Searching...
      </div>
    `;

    const res = await fetch(
      `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    renderResults(data);

  }catch(err){

    console.error(err);

    searchResults.innerHTML = `
      <div class="search-loading">
        Search failed
      </div>
    `;

  }

}

function renderResults(data){

  const videos =
    data.videos || [];

  const ebooks =
    data.ebooks || [];

  const products =
    data.products || [];

  const creators =
    data.creators || [];

    const stories =
  data.stories || [];

 if(
  !videos.length &&
  !ebooks.length &&
  !products.length &&
  !creators.length &&
  !stories.length
){

    searchResults.innerHTML = `
      <div class="search-empty">
        No results found
      </div>
    `;

    return;
  }

  searchResults.innerHTML = `

    ${
      creators.length
      ?
      `
      <div class="search-section">

        <h3 class="search-title">
          Creators
        </h3>

        <div class="creator-results">

          ${creators.map(user => `

            <div
              class="creator-card"
              onclick="openCreator('${user.username}')"
            >

              <img
                src="${
  user.avatar
  ? user.avatar
  : 'https://i.pravatar.cc/100'
}"
              >

              <div>

                <h4>${user.username}</h4>

                <p>
                  ${user.bio || "Vindarr Creator"}
                </p>

              </div>

            </div>

          `).join("")}

        </div>

      </div>
      `
      :
      ``
    }

    ${
      videos.length
      ?
      `
      <div class="search-section">

        <h3 class="search-title">
          Videos
        </h3>

        <div class="search-video-grid">

          ${videos.map(video => `

            <div
              class="search-video-card"
              onclick="openVideo('${video.id}')"
            >

              <video
                src="${video.videoUrl || video.file || ""}"
                muted
              ></video>

              <div class="search-video-info">

                <h4>
                  ${video.title || "Untitled"}
                </h4>

                <p>
                  @${video.creatorUsername || "creator"}
                </p>

              </div>

            </div>

          `).join("")}

        </div>

      </div>
      `
      :
      ``
    }

    ${
      ebooks.length
      ?
      `
      <div class="search-section">

        <h3 class="search-title">
          Ebooks
        </h3>

        <div class="search-product-grid">

          ${ebooks.map(book => `

            <div
              class="search-product-card"
              onclick="openEbook('${book.id}')"
            >

              <img
                src="${book.coverImage || ""}"
              >

              <h4>${book.title}</h4>

              <p>
                ₦${Number(book.price || 0).toLocaleString()}
              </p>

            </div>

          `).join("")}

        </div>

      </div>
      `
      :
      ``
    }

    ${
stories.length
?
`
<div class="search-section">

  <h3 class="search-title">
    Stories
  </h3>

  <div class="search-product-grid">

    ${stories.map(story => `

      <div
        class="search-product-card"
        onclick="openStory('${story.id}')"
      >

        <img
          src="${
            story.imageUrl ||
            'https://placehold.co/600x400'
          }"
        >

        <h4>${story.title}</h4>

        <p>
          @${story.username}
        </p>

      </div>

    `).join('')}

  </div>

</div>
`
:
''
}

    ${
      products.length
      ?
      `
      <div class="search-section">

        <h3 class="search-title">
          Products
        </h3>

        <div class="search-product-grid">

          ${products.map(product => `

            <div
              class="search-product-card"
              onclick="openProduct('${product.id}')"
            >

              ${
                product.videoUrl || product.file
                ?
                `
                <video
                  src="${product.videoUrl || product.file}"
                  muted
                ></video>
                `
                :
                `
                <img
  src="${
    product.coverUrl ||
    product.coverImage ||
    'https://placehold.co/600x400?text=Product'
  }"
>
                `
              }

              <h4>${product.title}</h4>

              <p>
                ₦${Number(product.price || 0).toLocaleString()}
              </p>

            </div>

          `).join("")}

        </div>

      </div>
      `
      :
      ``

    }

  `;

}

function renderEmptySearch(){

  searchResults.innerHTML = `

    <div class="search-discover">

      <h2>
        Discover on Vindarr
      </h2>

      <p>
        Search creators, videos,
        ebooks and products.
      </p>

    </div>

  `;

}

function openVideo(id){

  window.location.href =
    `index.html?video=${id}`;

}

function openEbook(id){

  window.location.href =
    `product.html?id=${id}`;

}

function openProduct(id){

  window.location.href =
    `product.html?id=${id}`;

}

function openCreator(username){

  window.location.href =
    `profile.html?user=${username}`;

}

function openStory(id){

  window.location.href =
    `story.html?id=${id}`;

}