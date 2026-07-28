// ===============================================
// VINDARR STORIES
// PART 4
// FULLSCREEN STORY FEED
// ===============================================

let stories = [];

let currentStory = null;

const token =
localStorage.getItem("token");

// ===============================================
// LOAD STORIES
// ===============================================

async function loadStories(){

    if(typeof showLoading==="function"){

    showLoading();

}

    try{

        const res = await fetch(
            `${API_BASE_URL}/stories`,
            {
                headers: token
                    ? {
                        Authorization:`Bearer ${token}`
                    }
                    : {}
            }
        );

        console.log("Stories status:",res.status);

        if(!res.ok){

            throw new Error(await res.text());

        }

        const result = await res.json();

        console.log(result);

        stories = Array.isArray(result)
    ? result
    : (result.data || []);

        renderStories();

    }

    catch(err){

        console.error("Stories error:",err);

        document.getElementById("storiesFeed").innerHTML=`

            <div
            style="
            display:flex;
            height:100vh;
            align-items:center;
            justify-content:center;
            font-size:22px;
            ">

                Failed to load stories

            </div>

        `;

    }

    

   if(typeof hideLoading==="function"){

    hideLoading();

}

}

// ===============================================
// RENDER
// ===============================================

function renderStories(){

const feed =
document.getElementById("storiesFeed");

feed.innerHTML = "";

stories.forEach(story=>{

const image =

story.imageUrl ||

"https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop";

const avatar =

story.avatar ||

"https://i.pravatar.cc/200";

feed.innerHTML += `

<div class="story-feed-card">

<img
src="${image}"
class="story-feed-image">

<div class="story-feed-overlay"></div>

<!-- TOP -->

<div class="story-top">

<button

class="story-top-btn"

onclick="openStoryModal()">

<i class="bi bi-plus-lg"></i>

</button>

<button

class="story-top-btn story-menu-btn"

onclick="toggleStoryMenu()">

<i class="bi bi-three-dots"></i>

</button>

</div>

<!-- RIGHT -->

<div class="story-actions">

<div class="story-action">

<button

onclick="likeStory(${story.id})">

❤️

</button>

<span>

${story.likesCount || 0}

</span>

</div>

<div class="story-action">

<button

onclick="window.location='comments.html?story=${story.id}'">

💬

</button>

<span>

Comments

</span>

</div>

<div class="story-action">

<button

onclick="saveStory(${story.id})">

🔖

</button>

<span>

Save

</span>

</div>

<div class="story-action">

<button

onclick="shareStory(${story.id})">

📤

</button>

<span>

Share

</span>

</div>

</div>

<!-- BOTTOM -->

<div class="story-bottom">

<div class="story-user">

<img

src="${avatar}"

class="story-avatar">

<div>

<div class="story-name">

@${story.username}

</div>

<div class="story-date">

${formatDate(story.createdAt)}

</div>

</div>

</div>

<div class="story-title">

${story.title}

</div>

<div

class="story-description"

id="storyBody-${story.id}">

${story.content}

</div>

<div
class="story-read-more"
onclick="openStory(${story.id})">

Read More

</div>

</div>

<!-- COMMENT BAR -->

<div class="story-comment-bar">

<div

class="story-comment-input"

onclick="window.location='comments.html?story=${story.id}'">

💬

<input

placeholder="Write a comment..."

readonly>

</div>

<button

class="story-comment-send"

onclick="window.location='comments.html?story=${story.id}'">

<i class="bi bi-send-fill"></i>

</button>

</div>

</div>

`;

});

setupStoryObserver();

}

// ===============================================
// READ MORE
// ===============================================
function openStory(id){

    window.location.href = `story.html?id=${id}`;

}


// ===============================================
// MENU
// ===============================================

function toggleStoryMenu(){

document

.getElementById("storyMenu")

.classList.toggle("show");

}

// ===============================================
// SAVE
// ===============================================

function saveStory(id){

let saved =

JSON.parse(

localStorage.getItem("savedStories")

|| "[]"

);

if(saved.includes(id)){

return;

}

saved.push(id);

localStorage.setItem(

"savedStories",

JSON.stringify(saved)

);

alert("Story saved");

}

// ===============================================
// SHARE
// ===============================================

async function shareStory(id){

const url =

`${window.location.origin}/story.html?id=${id}`;

if(navigator.share){

await navigator.share({

title:"Vindarr Story",

url

});

}else{

navigator.clipboard.writeText(url);

alert("Story link copied");

}

}

// ===============================================
// AUTOPLAY OBSERVER
// ===============================================

function setupStoryObserver(){

const cards =

document.querySelectorAll(

".story-feed-card"

);

const observer =

new IntersectionObserver(

entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

currentStory =

entry.target;

}

});

},

{

threshold:.7

}

);

cards.forEach(card=>{

observer.observe(card);

});

}

// ===============================================
// MODAL
// ===============================================

function openStoryModal(){

document

.getElementById(

"storyModal"

)

.style.display="flex";

}

function closeStoryModal(){

document

.getElementById(

"storyModal"

)

.style.display="none";

}

