// =====================================
// VINDARR COMMENTS PAGE
// =====================================

const commentParams =
  new URLSearchParams(
    window.location.search
  );

const videoId =
  commentParams.get("video");


// =====================================
// LOAD COMMENTS
// =====================================

async function loadComments(){

  const list =
    document.getElementById(
      "commentsList"
    );

  if(!videoId){

    list.innerHTML = `
      <div class="empty-comments">
        Invalid video.
      </div>
    `;

    return;

  }

  try{

    const res =
      await fetch(
        `${API_BASE_URL}/comments/video/${videoId}`
      );

    if(!res.ok){

      throw new Error(
        "Could not load comments"
      );

    }

    const comments =
      await res.json();

    renderComments(comments);

  }catch(err){

    console.error(err);

    list.innerHTML = `

      <div class="empty-comments">

        <i class="bi bi-chat-square-text"></i>

        <div>
          Unable to load comments.
        </div>

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

      const avatar =

        comment.author?.avatar

        ? (

            comment.author.avatar
              .startsWith("http")

            ?

            comment.author.avatar

            :

            API_BASE_URL +
            comment.author.avatar

          )

        :

        "https://i.pravatar.cc/100";


      const username =

        comment.author?.username ||
        "User";


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

              ${escapeHtml(
                comment.text || ""
              )}

            </div>

            <div class="comment-time">

              ${formatCommentTime(
                comment.createdAt
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

  const input =
    document.getElementById(
      "commentInput"
    );

  const button =
    document.getElementById(
      "sendCommentBtn"
    );

  const text =
    input.value.trim();


  if(!text)
    return;


  const token =
    localStorage.getItem(
      "token"
    );


  if(!token){

    window.location.href =
      "login.html";

    return;

  }


  button.disabled = true;


  try{

    const res =
      await fetch(

        `${API_BASE_URL}/comments`,

        {

          method:"POST",

          headers:{

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:JSON.stringify({

            videoId:
              Number(videoId),

            text

          })

        }

      );


    if(!res.ok){

      throw new Error(
        "Comment failed"
      );

    }


    input.value = "";


    await loadComments();


  }catch(err){

    console.error(err);

    alert(
      "Unable to post comment."
    );

  }finally{

    button.disabled = false;

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