const token =
localStorage.getItem("token");

let stories = [];

loadStories();

async function loadStories(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/stories`
    );

    const data =
    await res.json();

    stories = data || [];

    renderStories();

  }catch(err){

    console.error(err);

  }

}

function renderStories(){

  const container =
  document.getElementById("storiesFeed");

  if(!stories.length){

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
  stories.map(story => `

    <div class="story-card">

      <img
        src="${
          story.image
          ? API_BASE_URL + story.image
          : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop'
        }"
        class="story-image"
      >

      <div class="story-content">

        <div class="story-meta">

          <div class="story-user">

            <img
              src="${
                story.userAvatar
                ? API_BASE_URL + story.userAvatar
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

        <button
          class="read-story-btn"
          onclick="openStory('${story._id}')"
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