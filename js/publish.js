/* ==========================================
VINDARR PUBLISH
PART 1
VARIABLES • TYPE SWITCHING • PREVIEWS
========================================== */

let currentType = "video";

let publishing = false;

const params = new URLSearchParams(window.location.search);

const editId = params.get("edit");

/* ==========================================
ELEMENTS
========================================== */

const titleInput =
document.getElementById("uTitle");

const contextInput =
document.getElementById("uContext");

const categoryInput =
document.getElementById("uCategory");

const fileInput =
document.getElementById("uFile");

const coverInput =
document.getElementById("uCoverImage");

const priceInput =
document.getElementById("uPrice");

const preview =
document.getElementById("previewWrapper");

const coverPreview =
document.getElementById("coverPreview");

const uploadStatus =
document.getElementById("uploadStatusCard");

const publishButton =
document.querySelector(".publish-btn");

/* ==========================================
TYPE SWITCHING
========================================== */

function setType(type){

    currentType = type;

    const fileInput =
        document.getElementById("uFile");

    const coverInput =
        document.getElementById("uCoverImage");

    const priceInput =
        document.getElementById("uPrice");

        const coverWrapper =
document.getElementById("coverWrapper");

const priceWrapper =
document.getElementById("priceWrapper");

const fileLabel =
document.getElementById("fileLabel");

    // reset buttons

    document
    .querySelectorAll(".publish-types button")
    .forEach(btn=>btn.classList.remove("active"));

    // VIDEO

    if(type==="video"){

        document
        .getElementById("videoBtn")
        .classList.add("active");

        fileInput.accept="video/*";

        fileLabel.textContent="Choose Video";

        coverWrapper.style.display = "none";

        priceWrapper.style.display = "none";

    }

    // EBOOK

    else if(type==="ebook"){

        document
        .getElementById("ebookBtn")
        .classList.add("active");

        fileInput.accept=".pdf";
        fileLabel.textContent="Choose PDF";

        coverWrapper.style.display="block";

       priceWrapper.style.display="block";

    }

    // PRODUCT

    else if(type==="fashion"){

        document
        .getElementById("fashionBtn")
        .classList.add("active");

        fileInput.accept="image/*,video/*";
        fileLabel.textContent="Choose Product Image or Video";

        coverWrapper.style.display="none";

        priceWrapper.style.display ="block";

    }

    // ESSENTIAL

    else if(type==="essential"){

        document
        .getElementById("essentialBtn")
        .classList.add("active");

        fileInput.accept="image/*,video/*";
        fileLabel.textContent="Choose Product Image or Video";

        coverWrapper.style.display="none";

       priceWrapper.style.display ="block";

    }

    // clear previews whenever switching

    preview.style.display="none";

document.getElementById("imagePreview").style.display="none";

document.getElementById("videoPreview").style.display="none";

document.getElementById("pdfPreview").style.display="none";

    coverPreview.removeAttribute("src");

document
.getElementById("coverPreviewWrapper")
.style.display="none";

    fileInput.value="";

    coverInput.value="";
}

/* ==========================================
MAIN FILE PREVIEW
========================================== */
fileInput.addEventListener("change",()=>{

const file = fileInput.files[0];

const imagePreview =
document.getElementById("imagePreview");

const videoPreview =
document.getElementById("videoPreview");

const pdfPreview =
document.getElementById("pdfPreview");

const pdfName =
document.getElementById("pdfName");

if(!file){

preview.style.display="none";

imagePreview.style.display="none";

videoPreview.style.display="none";

pdfPreview.style.display="none";

return;

}

const url =
URL.createObjectURL(file);

preview.style.display="block";

imagePreview.style.display="none";

videoPreview.style.display="none";

pdfPreview.style.display="none";

if(file.type.startsWith("image/")){

imagePreview.src=url;

imagePreview.style.display="block";

}

else if(file.type.startsWith("video/")){

videoPreview.src=url;

videoPreview.style.display="block";

}

else{

pdfName.textContent=file.name;

pdfPreview.style.display="flex";

}

});


/* ==========================================
COVER PREVIEW
========================================== */

coverInput.addEventListener("change",()=>{

const file =
coverInput.files[0];

if(!file) return;

const url =
URL.createObjectURL(file);

coverPreview.src = url;

document
.getElementById("coverPreviewWrapper")
.style.display = "block";

});

/* ==========================================
VALIDATION
========================================== */

function validatePublish(){

if(!titleInput.value.trim()){

alert("Enter a title");

return false;

}

if(!contextInput.value.trim()){

alert("Enter a description");

return false;

}

if(!categoryInput.value){

alert("Select a category");

return false;

}

if(!fileInput.files[0]){

alert("Choose a file");

return false;

}

if(

currentType==="ebook" &&
!coverInput.files[0]

){

alert("Choose a cover image");

return false;

}

if(

currentType!=="video"

){

const price =
priceInput.value
.replace(/,/g,"")
.replace(/₦/g,"");

if(

!price ||

isNaN(Number(price))

){

alert("Enter a valid price");

return false;

}

}

return true;

}

/* ==========================================
UPLOAD STATUS UI
========================================== */

function showUploadProgress(text,percent){

uploadStatus.innerHTML=

`
<div class="upload-status-card">

<div class="upload-status-top">

<div class="upload-spinner"></div>

<div>

<div class="upload-status-title">

${text}

</div>

<div class="upload-status-text">

Please wait...

</div>

</div>

</div>

<div class="progress">

<div
class="progress-bar"

style="width:${percent}%">

${percent}%

</div>

</div>

</div>
`;

}

/* default */

setType("video");



/* ==========================================
VINDARR PUBLISH
PART 2
UPLOAD WITH REAL PROGRESS
========================================== */

async function publish(){

if(publishing) return;

if(!validatePublish()) return;

publishing = true;

publishButton.disabled = true;

publishButton.innerHTML =
`
<i class="bi bi-cloud-upload"></i>
Publishing...
`;

const token =
localStorage.getItem("token");

const formData =
new FormData();

formData.append(
"title",
titleInput.value.trim()
);

formData.append(
"context",
contextInput.value.trim()
);

formData.append(
"category",
categoryInput.value
);

formData.append(
"type",
currentType
);

const price =
priceInput.value
.replace(/,/g,"")
.replace(/₦/g,"");

if(price){

formData.append(
"price",
price
);

}

formData.append(
"file",
fileInput.files[0]
);

if(

currentType==="ebook" &&
coverInput.files[0]

){

formData.append(
"cover",
coverInput.files[0]
);

}

/* ======================================
XHR FOR UPLOAD PROGRESS
====================================== */

const xhr =
new XMLHttpRequest();

xhr.open(

editId
? "PUT"
: "POST",

editId

? `${API_BASE_URL}/videos/${editId}`

: `${API_BASE_URL}/videos`

);

xhr.setRequestHeader(

"Authorization",

`Bearer ${token}`

);

/* progress */

xhr.upload.onprogress =
function(e){

if(!e.lengthComputable)
return;

const percent =
Math.round(

(e.loaded/e.total)*100

);

showUploadProgress(

"Uploading content",

percent

);

};

/* completed */

xhr.onload =
function(){

publishButton.disabled = false;

publishButton.innerHTML =
`
<i class="bi bi-cloud-upload"></i>
Publish
`;

publishing = false;

let data = {};

try{

data =
JSON.parse(xhr.responseText);

}catch{

}

/* failed */

if(

xhr.status < 200 ||

xhr.status >= 300

){

uploadStatus.innerHTML =

`
<div class="upload-status-card error">

<i class="bi bi-x-circle-fill"></i>

<div>

<div class="upload-status-title">

Upload Failed

</div>

<div class="upload-status-text">

${data.message || "Something went wrong."}

</div>

</div>

</div>
`;

return;

}

/* success */

uploadStatus.innerHTML =

`
<div class="upload-status-card success">

<i class="bi bi-check-circle-fill"></i>

<div>

<div class="upload-status-title">

Published Successfully

</div>

<div class="upload-status-text">

Your content is now live.

</div>

</div>

</div>
`;

resetPublishForm();

};

/* network error */

xhr.onerror =
function(){

publishButton.disabled = false;

publishButton.innerHTML =
`
<i class="bi bi-cloud-upload"></i>
Publish
`;

publishing = false;

uploadStatus.innerHTML =

`
<div class="upload-status-card error">

<i class="bi bi-wifi-off"></i>

<div>

<div class="upload-status-title">

Network Error

</div>

<div class="upload-status-text">

Check your internet connection and try again.

</div>

</div>

</div>
`;

};

xhr.send(formData);

}


/* ==========================================
VINDARR PUBLISH
PART 3
HELPERS + INITIALIZATION
========================================== */

function resetPublishForm(){

titleInput.value = "";

contextInput.value = "";

categoryInput.value = "";

priceInput.value = "";

fileInput.value = "";

coverInput.value = "";

coverPreview.removeAttribute("src");
document.getElementById("coverPreviewWrapper").style.display = "none";

uploadStatus.innerHTML = "";

setType("video");

}

/* ==========================================
LOAD POST FOR EDIT
========================================== */

async function loadEditPost(){

if(!editId) return;

try{

const res =
await fetch(
`${API_BASE_URL}/videos/${editId}`
);

const post =
await res.json();

titleInput.value =
post.title || "";

contextInput.value =
post.context || "";

categoryInput.value =
post.category || "";

priceInput.value =
post.price || "";

if(post.type){

setType(post.type);

}

}catch(err){

console.error(err);

}

}

/* ==========================================
INITIALIZE
========================================== */

document.addEventListener(

"DOMContentLoaded",

()=>{

setType("video");

loadEditPost();

}

);