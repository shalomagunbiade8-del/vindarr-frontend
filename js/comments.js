// =====================================
// VINDARR COMMENTS PAGE
// =====================================

const params = new URLSearchParams(window.location.search);

const videoId = params.get("video");
const storyId = params.get("story");

const token = localStorage.getItem("token");


// =====================================
// LOAD COMMENTS
// =====================================

async function loadComments(){

    const list = document.getElementById("commentsList");

    try{

        let url = "";

        if(storyId){

            url = `${API_BASE_URL}/stories/${storyId}/comments`;

        }else if(videoId){

            url = `${API_BASE_URL}/comments/video/${videoId}`;

        }else{

            list.innerHTML=`
            <div class="empty-comments">
                Nothing to comment on.
            </div>
            `;

            return;

        }

        const res = await fetch(url,{
    headers: token
        ? {
            Authorization:`Bearer ${token}`
          }
        : {}
});

        if(!res.ok){

            throw new Error("Failed");

        }

        const comments = await res.json();

        renderComments(comments);

    }

    catch(err){

        console.error(err);

        list.innerHTML=`
        <div class="empty-comments">

            Unable to load comments.

        </div>
        `;

    }

}


// =====================================
// RENDER COMMENTS
// =====================================

function renderComments(comments){

  const list =
    document.getElementById(
      "commentsList"
    );

  const count =
    document.getElementById(
      "commentCount"
    );

  if(count){

    count.textContent =
      comments.length;

  }


  if(!comments.length){

    list.innerHTML = `

      <div class="empty-comments">

        <i class="bi bi-chat-square-text"></i>

        <div>
          No comments yet.
        </div>

        <small>
          Be the first to comment.
        </small>

      </div>

    `;

    return;

  }


  list.innerHTML =

    comments.map(comment => {

    const avatarRaw =
        comment.user?.avatar ||
        comment.author?.avatar;

    const avatar = avatarRaw
        ? (
            avatarRaw.startsWith("http")
                ? avatarRaw
                : API_BASE_URL + avatarRaw
        )
        : "https://i.pravatar.cc/100";

    const username =
        comment.user?.username ||
        comment.author?.username ||
        "User";

    const message =
        comment.text ||
        comment.content ||
        "";

    return `

        <article class="comment-card">

          <img

            class="comment-avatar"

            src="${avatar}"

            alt=""

          >

          <div class="comment-body">

            <div class="comment-user">

              @${escapeHtml(username)}

            </div>

           <div class="comment-text">

    ${escapeHtml(message)}

</div>

            <div class="comment-time">

              ${formatCommentTime(
    comment.createdAt || comment.created_at
)}

            </div>

          </div>

        </article>

      `;

    }).join("");

}


// =====================================
// SUBMIT COMMENT
// =====================================

async function submitComment(){

    const input=document.getElementById("commentInput");

    const button=document.getElementById("sendCommentBtn");

    const text=input.value.trim();

    if(!text) return;

    button.disabled=true;

    try{

        let url="";
        let body={};

        if(storyId){

            url=`${API_BASE_URL}/stories/${storyId}/comments`;

            body={
                content:text
            };

        }else{

            url=`${API_BASE_URL}/comments`;

            body={
                videoId:Number(videoId),
                text:text
            };

        }

        const res=await fetch(url,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${token}`
            },
            body:JSON.stringify(body)
        });

        if(!res.ok){

            throw new Error();

        }

        input.value="";

        loadComments();

    }

    catch(err){

    console.error(err);

    alert("Unable to post comment.");

}

    finally{

        button.disabled=false;

    }

}

// =====================================
// ENTER TO SEND
// =====================================

document.addEventListener(
  "keydown",
  function(event){

    if(
      event.key === "Enter" &&
      document.activeElement?.id ===
        "commentInput"
    ){

      event.preventDefault();

      submitComment();

    }

  }
);


// =====================================
// SAFE HTML
// =====================================

function escapeHtml(value){

  return String(value)

    .replaceAll("&","&amp;")

    .replaceAll("<","&lt;")

    .replaceAll(">","&gt;")

    .replaceAll('"',"&quot;")

    .replaceAll("'","&#039;");

}


// =====================================
// COMMENT TIME
// =====================================

function formatCommentTime(date){

  if(!date)
    return "";

  const created =
    new Date(date);

  const now =
    new Date();

  const seconds =
    Math.floor(
      (now - created) / 1000
    );


  if(seconds < 60)
    return "now";


  const minutes =
    Math.floor(
      seconds / 60
    );


  if(minutes < 60)
    return `${minutes}m`;


  const hours =
    Math.floor(
      minutes / 60
    );


  if(hours < 24)
    return `${hours}h`;


  const days =
    Math.floor(
      hours / 24
    );


  if(days < 7)
    return `${days}d`;


  return created.toLocaleDateString();

}


// =====================================
// INITIALIZE
// =====================================

loadComments();