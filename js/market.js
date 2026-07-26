// =====================================
// VINDARR MARKET
// PART 1
// Variables + Initialization + Load Feed
// =====================================


let currentMarketType = "all";

let marketItems = [];

let currentItem = null;

let loading = false;

// -------------------------------------
// DOM
// -------------------------------------

const marketContainer =
document.getElementById("marketFeedList");

const loadingScreen =
document.getElementById("marketLoading");

// =====================================
// LOADING
// =====================================

function showLoading(){

    if(loadingScreen){

        loadingScreen.style.display = "flex";

    }

}

function hideLoading(){

    if(loadingScreen){

        loadingScreen.style.display = "none";

    }

}

// =====================================
// LOAD MARKET
// =====================================

async function loadMarket(){

    if(loading) return;

    loading = true;

    showLoading();

    try{

        let url =
        `${API_BASE_URL}/videos/market`;

        if(currentMarketType !== "all"){

            url += `?type=${encodeURIComponent(currentMarketType)}`;

        }

        const response =
        await fetch(url);

        if(!response.ok){

            throw new Error("Unable to load market.");

        }

        const result =
        await response.json();

        marketItems =
        Array.isArray(result)

            ? result

            : Array.isArray(result.data)

                ? result.data

                : [];

        if(!marketItems.length){

            marketContainer.innerHTML = `

            <div class="video-error">

                <h2>No products found</h2>

                <p>

                    There are no products in this category.

                </p>

            </div>

            `;

            hideLoading();

            loading = false;

            return;

        }

        currentItem = marketItems[0];

        renderMarket();

    }

    catch(error){

        console.error(error);

        marketContainer.innerHTML = `

        <div class="video-error">

            <h2>

                Unable to load marketplace

            </h2>

            <p>

                Please try again later.

            </p>

            <button onclick="loadMarket()">

                Retry

            </button>

        </div>

        `;

    }

    hideLoading();

    loading = false;

}

// =====================================
// REFRESH
// =====================================

async function refreshMarket(){

    marketItems = [];
    console.log(marketItems);

    currentItem = null;

    await loadMarket();

}

// =====================================
// CATEGORY SWITCHING
// =====================================

document
.querySelectorAll(".market-tab")
.forEach(button=>{

    button.onclick = ()=>{

        document

        .querySelectorAll(".market-tab")

        .forEach(tab=>{

            tab.classList.remove(

                "active-category"

            );

        });

        button.classList.add(

            "active-category"

        );

        currentMarketType =
        button.dataset.type;

        refreshMarket();

    };

});

// =====================================
// INITIALIZE
// =====================================

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        loadMarket();

    }

);


// =====================================
// VINDARR MARKET
// PART 2
// Render Fullscreen Product Feed
// =====================================

function renderMarket(){

    if(!marketContainer) return;

    if(!marketContainer){
    console.error("marketFeedList not found");
    return;
}

    marketContainer.innerHTML = "";

    marketItems.forEach(item=>{

        //--------------------------------
// Only show products users can buy
//--------------------------------

if (
    item.type !== "ebook" &&
    item.type !== "fashion" &&
    item.type !== "essential"
){
    return;
}

//--------------------------------
// MEDIA
//--------------------------------

let media = "";
let isVideo = false;

switch(item.type){

    case "ebook":

        media = item.coverUrl;
        isVideo = false;
        break;

    case "fashion":

        media = item.fileUrl;

        isVideo =
            media &&
            (
                media.endsWith(".mp4") ||
                media.endsWith(".mov") ||
                media.endsWith(".webm")
            );

        break;

    case "essential":

        media = item.fileUrl;
        isVideo = false;
        break;

}

if(!media) return;

media = media.startsWith("http")
    ? media
    : API_BASE_URL + media;
    

        //--------------------------------
        // Avatar
        //--------------------------------

        const avatar =

            item.creatorAvatar

            ? (

                item.creatorAvatar.startsWith("http")

                ? item.creatorAvatar

                : API_BASE_URL + item.creatorAvatar

            )

            : "https://i.pravatar.cc/150";

        //--------------------------------
        // Card
        //--------------------------------

        const card =
        document.createElement("div");

        card.className =
        "single-video";

        card.dataset.id =
        item.id;

        card.innerHTML = `

<!-- ===========================
MEDIA
=========================== -->

${
isVideo

?

`

<video

class="market-video"

src="${media}"

autoplay

playsinline

loop

></video>

`

:

`

<img

class="market-image"

src="${media}"

loading="lazy"

>

`

}

<div class="video-overlay"></div>

<!-- ===========================
TOP BAR
=========================== -->

<div class="video-top">

    <div
        class="top-circle"
        onclick="history.back()">

        <i class="bi bi-arrow-left"></i>

    </div>

    <div class="top-circle">

        <i class="bi bi-three-dots"></i>

    </div>

</div>

<!-- ===========================
RIGHT ACTIONS
=========================== -->

<div class="video-actions">

    <div class="action-item">

        <button
            class="action-btn"
            onclick="openReviews(${item.id})">

            💬

        </button>

        <span>

            ${item.comments ? item.comments.length : 0}

        </span>

    </div>

    <div class="action-item">

        <button
            class="action-btn"
            onclick="saveProduct(${item.id})">

            🔖

        </button>

        <span>

            Save

        </span>

    </div>

    <div class="action-item">

        <button
            class="action-btn"
            onclick="shareProduct(${item.id})">

            📤

        </button>

        <span>

            Share

        </span>

    </div>

    <div class="action-item">

        <button
            class="action-btn"
            onclick="chatSeller('${item.creatorUsername}')">

            ✉️

        </button>

        <span>

            Chat

        </span>

    </div>

</div>

<!-- ===========================
PRODUCT INFO
=========================== -->

<div class="video-info">

    <div class="creator-row">

        <img

            class="creator-avatar"

            src="${avatar}"

            onclick="openSeller('${item.creatorUsername}')"

        >

        <div>

            <div class="creator-name">

                @${item.creatorUsername}

            </div>

            <div class="market-price">

                ₦${Number(item.price || 0).toLocaleString()}

            </div>

        </div>

        <button

            class="follow-btn"

            onclick="buyNow(${item.id})">

            Buy Now

        </button>

    </div>

    <div class="video-description">

        <strong>

            ${item.title || ""}

        </strong>

        <div

            id="desc-${item.id}"

            class="description-text collapsed">

            ${item.context || ""}

        </div>

        ${
        (item.context || "").length > 120

        ?

        `

        <span

            class="read-more"

            onclick="toggleDescription(${item.id})">

            ...more

        </span>

        `

        :

        ""

        }

    </div>

    <div class="audio-pill">

        <i class="bi bi-bag"></i>

        <span>

            Vindarr Marketplace

        </span>

    </div>

</div>

<!-- ===========================
BOTTOM BAR
=========================== -->

<div class="comment-bar">

    <div

        class="comment-input"

        onclick="openReviews(${item.id})">

        <div class="comment-icon">

            💬

        </div>

        <input

            readonly

            placeholder="Write a review..."

        >

    </div>

    <button

        class="send-btn"

        onclick="shareProduct(${item.id})">

        <i class="bi bi-send-fill"></i>

    </button>

</div>

`;

        marketContainer.appendChild(card);

    });

    setupObserver();

}


// =====================================
// VINDARR MARKET
// PART 3
// Product Actions
// =====================================

// =====================================
// BUY NOW
// =====================================

function buyNow(id){

    window.location.href =
    `product.html?id=${id}`;

}

// =====================================
// REVIEWS
// =====================================

function openReviews(id){

    window.location.href =
    `comments.html?video=${id}`;

}

// =====================================
// SAVE PRODUCT
// =====================================

function saveProduct(id){

    let saved = JSON.parse(

        localStorage.getItem(
            "savedProducts"
        ) || "[]"

    );

    if(saved.includes(id)){

        alert("Already saved");

        return;

    }

    saved.push(id);

    localStorage.setItem(

        "savedProducts",

        JSON.stringify(saved)

    );

    alert("Saved successfully");

}

// =====================================
// SHARE PRODUCT
// =====================================

async function shareProduct(id){

    const url =
    `${window.location.origin}/product.html?id=${id}`;

    try{

        if(navigator.share){

            await navigator.share({

                title:"Vindarr Marketplace",

                text:"Check out this product on Vindarr",

                url

            });

        }

        else{

            await navigator.clipboard.writeText(url);

            alert("Product link copied");

        }

    }

    catch(err){

        console.error(err);

    }

}

// =====================================
// CHAT SELLER
// =====================================

function chatSeller(username){

    window.location.href =

    `messages.html?user=${encodeURIComponent(username)}`;

}

// =====================================
// SELLER PROFILE
// =====================================

function openSeller(username){

    window.location.href =

    `profile.html?user=${encodeURIComponent(username)}`;

}

// =====================================
// READ MORE
// =====================================

function toggleDescription(id){

    const text =
    document.getElementById(`desc-${id}`);

    if(!text) return;

    const btn =
    text.nextElementSibling;

    if(text.classList.contains("collapsed")){

        text.classList.remove("collapsed");

        if(btn){

            btn.textContent =
            "Show less";

        }

    }

    else{

        text.classList.add("collapsed");

        if(btn){

            btn.textContent =
            "...more";

        }

    }

}

// =====================================
// PLAY / PAUSE VIDEO
// =====================================

document.addEventListener("click",(e)=>{

    if(

        !e.target.classList.contains("market-video")

    ){

        return;

    }

    if(e.target.paused){

        e.target.play();

    }

    else{

        e.target.pause();

    }

});

// =====================================
// AUTO HIDE CONTROLS
// =====================================

let hideTimer;

document.addEventListener("mousemove",()=>{

    const videos =

    document.querySelectorAll(".market-video");

    videos.forEach(video=>{

        video.controls = true;

    });

    clearTimeout(hideTimer);

    hideTimer = setTimeout(()=>{

        videos.forEach(video=>{

            video.controls = false;

        });

    },3000);

});


// =====================================
// VINDARR MARKET
// PART 4
// Autoplay + Feed Behaviour + Initialize
// =====================================

let observer;

// =====================================
// AUTOPLAY VIDEOS
// =====================================

function setupObserver(){

    if(observer){

        observer.disconnect();

    }

    observer = new IntersectionObserver(

        entries=>{

            entries.forEach(entry=>{

                const media =
                entry.target;

                if(

                    !media.classList.contains(
                        "market-video"
                    )

                ){

                    return;

                }

                if(entry.isIntersecting){

                    media.play().catch(()=>{});

                }

                else{

                    media.pause();

                }

            });

        },

        {

            threshold:0.75

        }

    );

    document

    .querySelectorAll(".market-video")

    .forEach(video=>{

        observer.observe(video);

    });

}

// =====================================
// PAGE VISIBILITY
// Pause videos when user leaves tab
// =====================================

document.addEventListener(

    "visibilitychange",

    ()=>{

        document

        .querySelectorAll(".market-video")

        .forEach(video=>{

            if(document.hidden){

                video.pause();

            }

            else{

                video.play().catch(()=>{});

            }

        });

    }

);

// =====================================
// MUTE / UNMUTE
// Double click video
// =====================================

document.addEventListener("dblclick",(e)=>{

    if(

        !e.target.classList.contains(
            "market-video"
        )

    ){

        return;

    }

    e.target.muted =
    !e.target.muted;

});

// =====================================
// KEEP TRACK OF CURRENT PRODUCT
// =====================================

window.addEventListener("scroll",()=>{

    const cards =

    document.querySelectorAll(".single-video");

    cards.forEach((card,index)=>{

        const rect =
        card.getBoundingClientRect();

        if(

            rect.top >= -100 &&

            rect.top <= 100

        ){

            currentItem =
            marketItems[index];

        }

    });

});



// =====================================
// CATEGORY ACTIVE STATE
// =====================================

window.addEventListener(

    "DOMContentLoaded",

    ()=>{

        document

        .querySelectorAll(".market-tab")

        .forEach(tab=>{

            if(

                tab.dataset.type ===

                currentMarketType

            ){

                tab.classList.add(
                    "active-category"
                );

            }

        });

    }

);

