let allPosts = [];
let currentTab = "videos";

const params =
new URLSearchParams(window.location.search);

const profileUsername =
params.get("user");

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
await fetch(`${API_BASE_URL}/profile/me`,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

    const me = await meRes.json();

    // VISITING PROFILE?
    const endpoint =
  profileUsername
  ? `${API_BASE_URL}/profile/${profileUsername}`
  : `${API_BASE_URL}/profile/me`;

    const res =
      await fetch(endpoint,{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

    const user =
      await res.json();

    isOwnProfile =
  me.username === user.username;

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
          onclick="messageUser('${user.username}')">

          Message

        </button>

      </div>

    `;

  }

}


function messageUser(username){

  window.location.href =
    `chat.html?user=${username}`;

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

  // UPLOAD AVATAR
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

  // BUILD PAYLOAD
  const payload = {

    username:
      document.getElementById(
        "editUsername"
      ).value,

    bio:
      document.getElementById(
        "editBio"
      ).value

  };

  // ONLY SEND AVATAR IF EXISTS
  if(avatarUrl){
    payload.avatar = avatarUrl;
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

        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if(res.ok){

      // UPDATE LOCAL STORAGE
      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      localStorage.setItem(
        "username",
        data.username
      );

      alert("Profile updated");

      closeEditProfile();

      loadProfile();

    }else{

      alert(
        data.message ||
        "Update failed"
      );

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