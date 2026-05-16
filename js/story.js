const params =
new URLSearchParams(window.location.search);

const storyId =
params.get("id");

loadStory();

async function loadStory(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/stories/${storyId}`
    );

    const story =
    await res.json();

    renderStory(story);

  }catch(err){

    console.error(err);

  }

}

function renderStory(story){

  const page =
  document.getElementById("storyPage");

  page.innerHTML = `

    <img
      src="${
        story.image
        ? API_BASE_URL + story.image
        : ''
      }"
      class="story-banner"
    >

    <div class="story-wrapper">

      <h1 class="story-main-title">

        ${story.title}

      </h1>

      <div class="story-author">

        By @${story.username || 'creator'}

      </div>

      <div class="story-body">

        ${story.content || ''}

      </div>

    </div>

  `;

}