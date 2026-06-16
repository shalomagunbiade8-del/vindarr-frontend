const token =
localStorage.getItem("token");

/* ==========================
LOAD CREATORS
========================== */

async function loadCreators(){

try{

const res =
  await fetch(
    `${API_BASE_URL}/purview/my-creators`,
    {
      headers:{
        Authorization:
        `Bearer ${token}`
      }
    }
  );

const creators =
  await res.json();

renderCreators(creators);

}catch(err){


console.error(err);


}

}

/* ==========================
RENDER CREATORS
========================== */

function renderCreators(creators){

const container =
document.getElementById(
"purviewCreators"
);

if(!creators.length){


container.innerHTML = `
  <div class="empty-purview">
    No creators added yet
  </div>
`;

return;


}

let html = "";

creators.forEach(c => {


html += `

  <div
  class="purview-creator"
  onclick="
  location.href=
  'profile.html?user=${c.username}'
  ">

    <img

src="${
c.avatar
? (
c.avatar.startsWith('http')
? c.avatar
: API_BASE_URL + c.avatar
)
: 'https://i.pravatar.cc/100'
}">

    <span>
      ${c.username}
    </span>

  </div>

`;

});

container.innerHTML = html;

}

/* ==========================
LOAD FEED
========================== */

async function loadPurviewFeed(){

try{


const res =
  await fetch(
    `${API_BASE_URL}/purview/feed`,
    {
      headers:{
        Authorization:
        `Bearer ${token}`
      }
    }
  );

const posts =
  await res.json();

renderPurviewFeed(posts);

}catch(err){


console.error(err);


}

}

/* ==========================
RENDER FEED
========================== */

function renderPurviewFeed(posts){

const feed =
document.getElementById(
"purviewFeed"
);

if(!posts.length){

feed.innerHTML = `

  <div class="empty-purview">

    <h3>
      Your Purview is empty
    </h3>

    <p>
      Add creators from the feed
    </p>

  </div>

`;

return;

}

let html = "";

posts.forEach(post => {

let media = "";

if(post.type === "ebook"){

  media = post.coverUrl;

}else{

  media =
    post.videoUrl ||
    post.fileUrl ||
    post.coverUrl;
}

const mediaUrl =
  media?.startsWith("http")
  ? media
  : API_BASE_URL + media;

html += `

  <div
  class="purview-card"
  onclick="openPurviewItem(
    '${post.id}',
    '${post.type}'
  )"
>

    ${
      (
        post.type === "video" ||
        mediaUrl.includes(".mp4")
      )

      ?

      `
      <video
        src="${mediaUrl}"
        controls
        playsinline
      ></video>
      `

      :

      `
      <img
  src="${mediaUrl}"
  onclick="openPurviewItem('${post.id}')"
>
      `
    }

    <div
    class="purview-card-info">

      <h4>
        ${post.title || ""}
      </h4>

      <p>
        @${post.creator?.username || ""}
      </p>

    </div>

  </div>

`;

});

feed.innerHTML = html;

}

function openPurviewItem(id, type){

  if(
    type === "ebook" ||
    type === "fashion" ||
    type === "essential"
  ){

    window.location.href =
      `product.html?id=${id}`;

    return;
  }

  window.location.href =
    `index.html?video=${id}`;

}

function openPurviewItem(id){

  window.location.href =
    `product.html?id=${id}`;

}

/* ==========================
INIT
========================== */

loadCreators();

loadPurviewFeed();
