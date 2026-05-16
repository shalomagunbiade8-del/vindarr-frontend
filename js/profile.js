let allPosts = [];
let currentTab = "videos";

const params =
new URLSearchParams(window.location.search);

const profileUserId =
params.get("id");

let isOwnProfile = false;

/* =========================
   LOAD PROFILE
========================= */
async function loadProfile(){

  const token =
    localStorage.getItem("token");

  try{

    // CURRENT USER
    const meRes =
  await fetch(`${API_BASE_URL}/users/me`,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

    const me = await meRes.json();

    // VISITING PROFILE?
    const endpoint =
      profileUserId
      ? `${API_BASE_URL}/users/${profileUserId}`
      : `${API_BASE_URL}/users/me`;

    const res =
      await fetch(endpoint,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

    const user =
      await res.json();

    isOwnProfile =
      me.id === user.id;

    // PROFILE INFO
    document.getElementById("profileUsername")
      .innerText =
      user.username || "User";

    document.getElementById("profileBio")
      .innerText =
      user.bio || "Creator on Vindarr";

    document.getElementById("profileAvatar")
  .src =
  user.avatar
    ? (
        user.avatar.startsWith("http")
          ? user.avatar
          : API_BASE_URL + user.avatar
      )
    : "https://i.pravatar.cc/200";

    // ACTION BUTTONS
    renderProfileActions(user);

    // POSTS
    loadUserPosts(user.id);

  }catch(err){

    console.error(err);

  }

}

function renderProfileActions(user){

  const actions =
    document.getElementById(
      "profileActions"
    );

  if(!actions) return;

  if(isOwnProfile){

    actions.innerHTML = `

      <div class="profile-actions">

        <button
          class="edit-profile-btn"
          onclick="openEditProfile()">

          Edit Profile

        </button>

      </div>

    `;

  }else{

    actions.innerHTML = `

      <div class="profile-actions">

        <button
          class="message-profile-btn"
          onclick="messageUser('${user.id}')">

          Message

        </button>

      </div>

    `;

  }

}


function messageUser(userId){

  window.location.href =
    `chat.html?user=${userId}`;

}

function openEditProfile(){

  document.getElementById(
    "editUsername"
  ).value =
  document.getElementById(
    "profileUsername"
  ).innerText;

  document.getElementById(
    "editBio"
  ).value =
  document.getElementById(
    "profileBio"
  ).innerText;

  document.getElementById(
    "editProfileModal"
  ).style.display = "flex";

}


/* =========================
   LOAD POSTS
========================= */
async function loadUserPosts(userId){

  const token =
    localStorage.getItem("token");

  try{

    const res =
      await fetch(`${API_BASE_URL}/videos/user/${userId}`,{

      headers:{
        Authorization:`Bearer ${token}`
      }

    });

    allPosts = await res.json();

    // COUNTS
    document.getElementById("postCount")
      .innerText =
      allPosts.filter(x => x.type === "video").length;

    document.getElementById("ebookCount")
      .innerText =
      allPosts.filter(x => x.type === "ebook").length;

    document.getElementById("productCount")
      .innerText =
      allPosts.filter(x => x.type === "fashion").length;

    renderPosts();

  }catch(err){

    console.error(err);

  }

}

/* =========================
   SWITCH TAB
========================= */
function switchTab(event, tab){

  currentTab = tab;

  document.querySelectorAll(".tab-btn")
    .forEach(btn =>
      btn.classList.remove("active-tab")
    );

  event.target.classList.add("active-tab");

  renderPosts();

}

/* =========================
   RENDER POSTS
========================= */
function renderPosts(){

  const grid =
    document.getElementById("profilePosts");

  let filtered = [];

  // VIDEOS
  if(currentTab === "videos"){
    filtered =
      allPosts.filter(x => x.type === "video");
  }

  // EBOOKS
  if(currentTab === "ebooks"){
    filtered =
      allPosts.filter(x => x.type === "ebook");
  }

  // PRODUCTS
  if(currentTab === "products"){
    filtered =
      allPosts.filter(x => x.type === "fashion");
  }

  if(filtered.length === 0){

    grid.innerHTML = `
      <div class="empty-state">

        <i class="bi bi-grid"></i>

        <p>No content yet</p>

      </div>
    `;

    return;

  }

  let html = "";

  filtered.forEach(post => {

    html += `

      <div class="profile-card">

        ${
          post.type === "video"

          ? `

          <video
src="${
  post.videoUrl?.startsWith("http")
    ? post.videoUrl
    : API_BASE_URL + post.videoUrl
}"
muted></video>

          `

          :

          `

          <img
src="${
  (post.coverUrl || post.fileUrl || post.videoUrl)?.startsWith("http")
    ? (post.coverUrl || post.fileUrl || post.videoUrl)
    : API_BASE_URL + (post.coverUrl || post.fileUrl || post.videoUrl)
}">

          `
        }

        <div class="profile-card-overlay">

          <h4>${post.title || ""}</h4>

          ${
            post.price

            ? `<span>₦${post.price}</span>`

            : ""
          }

        </div>

      </div>

    `;

  });

  grid.innerHTML = html;

}

/* =========================
   INIT
========================= */
loadProfile();

async function saveProfile(){

  const token =
    localStorage.getItem("token");

  let avatarUrl = "";

  const avatarFile =
    document.getElementById("editAvatar").files[0];

  // UPLOAD TO CLOUDINARY
  if(avatarFile){

    const avatarData = new FormData();

    avatarData.append("file", avatarFile);

    const uploadRes = await fetch(
      `${API_BASE_URL}/upload/avatar`,
      {
        method:"POST",
        body: avatarData
      }
    );

    const uploadJson =
      await uploadRes.json();

    avatarUrl = uploadJson.avatar;
  }

  try{

    const res = await fetch(
      `${API_BASE_URL}/profile`,
      {
        method:"PATCH",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body: JSON.stringify({
          username:
            document.getElementById("editUsername").value,

          bio:
            document.getElementById("editBio").value,

          avatar: avatarUrl
        })
      }
    );

    const data = await res.json();

    if(res.ok){

      alert("Profile updated");

      closeEditProfile();

      loadProfile();

    }else{

      alert(data.message || "Update failed");

    }

  }catch(err){

    console.error(err);

    alert("Network error");

  }

}

function closeEditProfile(){

  document.getElementById(
    "editProfileModal"
  ).style.display = "none";

}