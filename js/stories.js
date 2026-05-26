const token =
localStorage.getItem("token");

let stories = [];

loadStories();

async function loadStories(){

  try{

    const res = await fetch(
  `${API_BASE_URL}/stories`,
  {
    headers:{
      Authorization:`Bearer ${token}`
    }
  }
);

    const data =
    await res.json();

    stories = data.data || [];

    renderStories();

  }catch(err){

    console.error(err);

  }

}

function renderStories(){

  const container =
  document.getElementById("storiesFeed");

  // IMPORTANT
  const storyList = stories || [];

  if(!storyList.length){

    container.innerHTML = `

      <div class="stories-empty">

        <h2>
          No stories yet
        </h2>

        <p>
          Be the first creator
          to publish a story.
        </p>

      </div>

    `;

    return;

  }

  container.innerHTML =
  storyList.map(story => `

    <div class="story-card">

      <img
        src="${
          story.imageUrl
          ? story.imageUrl
          : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop'
        }"
        class="story-image"
      >

      <div class="story-content">

        <div class="story-meta">

          <div class="story-user">

            <img
              src="${
                story.avatar
                ? story.avatar
                : 'https://i.pravatar.cc/100'
              }"
            >

            <span>
              @${story.username || 'creator'}
            </span>

          </div>

          <div class="story-date">

            ${formatDate(story.createdAt)}

          </div>

        </div>

        <h2 class="story-title">

          ${story.title}

        </h2>

        <p class="story-preview">

          ${
            story.content
            ? story.content.substring(0,180)
            : ''
          }...

        </p>

        <div class="story-actions">

  <button onclick="likeStory(${story.id})">

    ❤️ ${story.likesCount || 0}

  </button>

  ${
    getCurrentUser()?.id === story.userId
    ? `
      <button
        onclick="deleteStory(${story.id})"
        class="story-delete-btn"
      >
        Delete
      </button>

      <button
  onclick="editStory(${story.id})"
  class="story-edit-btn"
>
  Edit
</button>
    `
    : ''
  }

</div>

        <button
          class="read-story-btn"
          onclick="openStory('${story.id}')"
        >

          Read Story

        </button>

      </div>

    </div>

  `).join("");

}

function openStory(id){

  window.location.href =
  `story.html?id=${id}`;

}

function openStoryModal(){

  document.getElementById(
    "storyModal"
  ).style.display = "flex";

}

function closeStoryModal(){

  document.getElementById(
    "storyModal"
  ).style.display = "none";

}

if(!token){

  alert("Login required");

  return;

}

async function publishStory(){

  const title =
  document.getElementById(
    "storyTitle"
  ).value;

  const content =
  document.getElementById(
    "storyContent"
  ).value;

  const image =
  document.getElementById(
    "storyImage"
  ).files[0];

  const formData =
  new FormData();

  formData.append("title",title);

  formData.append("content",content);

  if(image){

    formData.append("image",image);

  }

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/stories`,
      {
        method:"POST",

        headers:{
          Authorization:`Bearer ${token}`
        },

        body:formData
      }
    );

    if(res.ok){

      closeStoryModal();

      loadStories();

    }

  }catch(err){

    console.error(err);

  }

}

function formatDate(date){

  if(!date) return "";

  return new Date(date)
  .toLocaleDateString(
    "en-NG",
    {
      day:"numeric",
      month:"short",
      year:"numeric"
    }
  );

}


async function likeStory(id){

  try{

    await fetch(
      `${API_BASE_URL}/stories/${id}/like`,
      {
        method:"POST",

        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    loadStories();

  }catch(err){

    console.error(err);

  }

}

async function deleteStory(id){

  const confirmDelete =
  confirm(
    "Delete this story?"
  );

  if(!confirmDelete) return;

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/stories/${id}`,
      {
        method:"DELETE",

        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    if(res.ok){

      loadStories();

    }

  }catch(err){

    console.error(err);

  }

}

async function editStory(id){

  const story =
  stories.find(s => s.id === id);

  if(!story) return;

  const newTitle =
  prompt(
    "Edit title",
    story.title
  );

  if(!newTitle) return;

  const newContent =
  prompt(
    "Edit content",
    story.content
  );

  if(!newContent) return;

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/stories/${id}`,
      {
        method:"PATCH",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({
          title:newTitle,
          content:newContent
        })
      }
    );

    if(res.ok){

      loadStories();

    }

  }catch(err){

    console.error(err);

  }

}