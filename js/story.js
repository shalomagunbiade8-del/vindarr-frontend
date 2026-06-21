const params =
new URLSearchParams(window.location.search);

const storyId =
params.get("id");

loadStory();
loadComments();

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
        story.imageUrl
        ? story.imageUrl
        : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop'
      }"
      class="story-banner"
    >

    <div class="story-wrapper">

      <h1 class="story-main-title">

        ${story.title}

      </h1>

      <div class="story-author">

      <div class="story-share">

  <button
    onclick="shareCurrentStory()"
  >
    📤 Share Story
  </button>

</div>

        By @${story.username || 'creator'}

      </div>

      <div class="story-body">

        ${(story.content || '').replace(/\n/g, '<br>')}

      </div>

    </div>

  `;

}

const token =
localStorage.getItem("token");

async function loadComments(){

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/comments/story/${storyId}`
    );

    const comments =
    await res.json();

    renderComments(comments);

  }catch(err){

    console.error(err);

  }

}

function renderComments(comments){

  const container =
  document.getElementById(
    "commentsContainer"
  );

  if(!comments.length){

    container.innerHTML = `
      <p class="story-author">
        No comments yet
      </p>
    `;

    return;

  }

  container.innerHTML =
  comments.map(comment => `

    <div class="story-comment">

      <div class="story-comment-top">

        <img
          src="${
            comment.author?.avatar ||
            'https://i.pravatar.cc/100'
          }"
          class="story-comment-avatar"
        >

        <div>

          <div class="story-comment-user">
            @${comment.author?.username || 'user'}
          </div>

        </div>

      </div>

      <div class="story-comment-body">
        ${comment.text || ''}
      </div>

    </div>

  `).join("");

}

async function postComment(){

  const input =
  document.getElementById(
    "commentInput"
  );

  const text =
  input.value.trim();

  if(!text){

    alert("Comment required");

    return;

  }

  console.log("Sending comment...");

  try{

    const res =
    await fetch(
      `${API_BASE_URL}/comments`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({
          text,
          storyId:Number(storyId)
        })
      }
    );

    const data =
    await res.json();

    console.log("COMMENT RESPONSE:", data);

    if(!res.ok){

      alert(
        data.message ||
        "Failed to post comment"
      );

      return;

    }

    alert("Comment posted");

    input.value = "";

    loadComments();

  }catch(err){

    console.error(err);

    alert("Network error");

  }

}

function formatDate(date){

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

async function shareCurrentStory(){

  const shareUrl =
    `${window.location.origin}/story.html?id=${storyId}`;

  try{

    if(navigator.share){

      await navigator.share({
        title:"Vindarr Story",
        url:shareUrl
      });

    }else{

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert("Story link copied");

    }

  }catch(err){

    console.error(err);

  }

}