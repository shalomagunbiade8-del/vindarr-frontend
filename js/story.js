console.log("story.js loaded");

// ===========================================
// URL PARAMS
// ===========================================

const params = new URLSearchParams(window.location.search);

const storyId = params.get("id");

const token = localStorage.getItem("token");

let currentStory = null;

let expanded = false;

// ===========================================
// LOAD STORY
// ===========================================

async function loadStory(){

    try{

        const res = await fetch(

            `${API_BASE_URL}/stories/${storyId}`,

            {

                headers: token ? {

                    Authorization:`Bearer ${token}`

                } : {}

            }

        );

        const story = await res.json();

        currentStory = story;

        renderStory(story);

    }

    catch(err){

        console.error(err);

    }

}

// ===========================================
// RENDER STORY
// ===========================================

function renderStory(story){

    if(!story) return;

    const heroImage =
        story.imageUrl
        ? story.imageUrl
        : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop";

    const avatar =
        story.avatar
        ? story.avatar
        : "https://i.pravatar.cc/200";

    const words =
        (story.content || "")
        .trim()
        .split(/\s+/)
        .length;

    const readTime =
        Math.max(
            1,
            Math.ceil(words / 220)
        );

    // HERO

    document.getElementById(

        "storyHeroImage"

    ).src = heroImage;

    document.getElementById(

        "storyAuthorAvatar"

    ).src = avatar;

    document.getElementById(

        "storyAuthorName"

    ).textContent =

        `@${story.username || "creator"}`;

    document.getElementById(

        "storyMeta"

    ).textContent =

        `${formatDate(story.createdAt)} • ${readTime} min read`;

    document.getElementById(

        "storyTitle"

    ).textContent = story.title;

    // BODY

    const body =
        document.getElementById(

            "storyBody"

        );

    body.innerHTML =
        (story.content || "")
        .replace(/\n/g,"<br><br>");

    // COLLAPSE LONG STORIES

    if((story.content || "").length > 1200){

        body.classList.add("collapsed");

        document.getElementById(

            "storyReadMore"

        ).style.display = "inline-flex";

    }

    // LIKE COUNT

    document.getElementById(

        "storyLikeCount"

    ).textContent =
        story.likesCount || 0;

    // OWNER MENU

    checkStoryOwnership(story);

}

// ===========================================
// OWNER MENU
// ===========================================

function checkStoryOwnership(story){

    const currentUser = getCurrentUser?.();

    if(!currentUser) return;

    if(currentUser.id === story.userId){

        document.getElementById(

            "editStoryBtn"

        ).style.display = "flex";

        document.getElementById(

            "deleteStoryBtn"

        ).style.display = "flex";

    }

}

function toggleStoryMenu(){

    document.getElementById(

        "storyMenu"

    ).classList.toggle("show");

}

// ===========================================
// READ MORE
// ===========================================

function toggleStoryContent(){

    const body =
        document.getElementById("storyBody");

    const btn =
        document.getElementById("storyReadMore");

    expanded = !expanded;

    if(expanded){

        body.classList.remove("collapsed");

        btn.textContent = "Read Less";

    }

    else{

        body.classList.add("collapsed");

        btn.textContent = "Read More";

    }

}

// ===========================================
// EDIT STORY
// ===========================================

async function editCurrentStory(){

    const title = prompt(

        "Edit title",

        currentStory.title

    );

    if(title === null) return;

    const content = prompt(

        "Edit content",

        currentStory.content

    );

    if(content === null) return;

    try{

        const res = await fetch(

            `${API_BASE_URL}/stories/${storyId}`,

            {

                method:"PATCH",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:`Bearer ${token}`

                },

                body:JSON.stringify({

                    title,

                    content

                })

            }

        );

        if(res.ok){

            loadStory();

            alert("Story updated");

        }

    }

    catch(err){

        console.error(err);

    }

}

// ===========================================
// DELETE STORY
// ===========================================

async function deleteCurrentStory(){

    if(!confirm("Delete this story?"))

        return;

    try{

        const res = await fetch(

            `${API_BASE_URL}/stories/${storyId}`,

            {

                method:"DELETE",

                headers:{

                    Authorization:`Bearer ${token}`

                }

            }

        );

        if(res.ok){

            window.location.href =

            "stories.html";

        }

    }

    catch(err){

        console.error(err);

    }

}

// ===========================================
// LIKE
// ===========================================

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

        loadStory();

    }

    catch(err){

        console.error(err);

    }

}

// ===========================================
// SAVE
// ===========================================

function saveStory(id){

    let saved = JSON.parse(

        localStorage.getItem(

            "savedStories"

        ) || "[]"

    );

    if(!saved.includes(id)){

        saved.push(id);

        localStorage.setItem(

            "savedStories",

            JSON.stringify(saved)

        );

    }

    alert("Story saved");

    window.location.href = "saved.html";

}

// ===========================================
// COMMENTS
// ===========================================

function openComments(){

    window.location.href =

    `comments.html?story=${storyId}`;

}

// ===========================================
// SHARE
// ===========================================

async function shareCurrentStory(){

    const url =

    `${window.location.origin}/story.html?id=${storyId}`;

    try{

        if(navigator.share){

            await navigator.share({

                title:currentStory.title,

                url

            });

        }

        else{

            await navigator.clipboard.writeText(

                url

            );

            alert("Story link copied");

        }

    }

    catch(err){

        console.error(err);

    }

}

// ===========================================
// DATE
// ===========================================

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

// ===========================================
// READING PROGRESS
// ===========================================

window.addEventListener(

    "scroll",

    ()=>{

        const progress =

        document.getElementById(

            "storyProgressBar"

        );

        if(!progress) return;

        const total =

        document.documentElement.scrollHeight -

        window.innerHeight;

        const current =

        window.scrollY;

        const percent =

        Math.min(

            100,

            Math.max(

                0,

                (current / total) * 100

            )

        );

        progress.style.width =

        percent + "%";

    }

);

// ===========================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ===========================================

document.addEventListener(

    "click",

    function(e){

        const menu =

        document.getElementById("storyMenu");

        const wrapper =

        document.querySelector(".story-menu-wrapper");

        if(

            menu &&
            wrapper &&
            !wrapper.contains(e.target)

        ){

            menu.classList.remove("show");

        }

    }

);

// ===========================================
// INITIALIZE
// ===========================================

loadStory();



