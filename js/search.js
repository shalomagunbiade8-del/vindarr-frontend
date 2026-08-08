/* ==========================================
VINDARR SEARCH
PART 1
SEARCH INPUT + LIVE SEARCH
========================================== */

const searchInput =
document.getElementById("globalSearch");

const searchResults =
document.getElementById("searchResults");

let searchTimeout;

/* ==========================================
LIVE SEARCH
========================================== */

searchInput.addEventListener("input",(e)=>{

const query =
e.target.value.trim();

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

/* Initial Screen */

renderEmptySearch();

/* ==========================================
SEARCH API
========================================== */

async function searchAll(query){

try{

searchResults.innerHTML =

`
<div class="search-loading">

<div class="search-spinner"></div>

<p>

Searching Vindarr...

</p>

</div>
`;

const res = await fetch(

`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`

);

const data =
await res.json();

renderResults(data);

}catch(err){

console.error(err);

searchResults.innerHTML =

`
<div class="search-empty">

<h3>

Search failed

</h3>

<p>

Please check your connection.

</p>

</div>
`;

}

}

/* ==========================================
RENDER RESULTS
========================================== */

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

searchResults.innerHTML =

`
<div class="search-empty">

<h2>

Nothing found

</h2>

<p>

Try another search.

</p>

</div>
`;

return;

}

searchResults.innerHTML =

`

${

creators.length

?

`

<div class="search-section">

<h3 class="search-title">

Creators

</h3>

<div class="creator-results">

${creators.map(user=>`

<div
class="creator-card"
onclick="openCreator('${user.username}')">

<img
src="${
user.avatar ||
'https://i.pravatar.cc/100'
}">

<div>

<h4>

${user.username}

</h4>

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

""

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

${videos.map(video=>`

<div
class="search-video-card"
onclick="openVideo('${video.id}')">

<video

muted

playsinline

preload="metadata"

src="${
video.videoUrl ||
video.file ||
""
}">

</video>

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

""

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

${ebooks.map(book=>`

<div
class="search-product-card"
onclick="openEbook('${book.id}')">

<img
src="${
book.coverImage ||
book.coverUrl ||
'https://placehold.co/600x800'
}">

<h4>

${book.title}

</h4>

<p>

₦${Number(book.price || 0).toLocaleString()}

</p>

</div>

`).join("")}

</div>

</div>

`

:

""

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

${stories.map(story=>`

<div
class="search-product-card story-card"
onclick="openStory('${story.id}')">

<img
src="${
story.imageUrl ||
'https://placehold.co/600x400'
}">

<h4>

${story.title}

</h4>

<p>

@${story.username}

</p>

</div>

`).join("")}

</div>

</div>

`

:

""

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

${products.map(product=>`

<div
class="search-product-card"
onclick="openProduct('${product.id}')">

${

product.videoUrl || product.file

?

`

<video

muted

playsinline

preload="metadata"

src="${
product.videoUrl ||
product.file
}">

</video>

`

:

`

<img

src="${

product.coverUrl ||

product.coverImage ||

'https://placehold.co/600x400?text=Product'

}">

`

}

<h4>

${product.title}

</h4>

<p>

₦${Number(product.price || 0).toLocaleString()}

</p>

</div>

`).join("")}

</div>

</div>

`

:

""

}

`;

}


/* ==========================================
EMPTY STATE
========================================== */

function renderEmptySearch(){

searchResults.innerHTML =

`
<div class="search-discover">

<div class="discover-icon">

<i class="bi bi-search-heart-fill"></i>

</div>

<h2>

Discover on Vindarr

</h2>

<p>

Search creators, videos, ebooks, products and stories.


</p>

</div>
`;

}

/* ==========================================
CAMERA SEARCH (COMING SOON)
========================================== */

function openRecordSearch(){

window.location.href =
"record-search.html";

/*
Future feature:

Users record a short video describing
what they need.

Others can reply with videos
containing products, ebooks,
recommendations or themselves.

*/

}

/* ==========================================
OPEN VIDEO
========================================== */

function openVideo(id){

window.location.href =
`video.html?id=${id}`;

}

/* ==========================================
OPEN EBOOK
========================================== */

function openEbook(id){

window.location.href =
`product.html?id=${id}`;

}

/* ==========================================
OPEN PRODUCT
========================================== */

function openProduct(id){

window.location.href =
`product.html?id=${id}`;

}

/* ==========================================
OPEN CREATOR
========================================== */

function openCreator(username){

window.location.href =
`profile.html?user=${encodeURIComponent(username)}`;

}

/* ==========================================
OPEN STORY
========================================== */

function openStory(id){

window.location.href =
`story.html?id=${id}`;

}

/* ==========================================
AUTO PLAY PREVIEWS
========================================== */

document.addEventListener(

"mouseover",

e=>{

const video =
e.target.closest("video");

if(video){

video.play().catch(()=>{});

}

}

);

document.addEventListener(

"mouseout",

e=>{

const video =
e.target.closest("video");

if(video){

video.pause();

video.currentTime = 0;

}

}

);

/* ==========================================
INITIALIZE
========================================== */

document.addEventListener(

"DOMContentLoaded",

()=>{

renderEmptySearch();

}
);