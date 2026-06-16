const params =
new URLSearchParams(
window.location.search
);

const id =
params.get("id");

loadVideo();

async function loadVideo(){

const res =
await fetch(
`${API_BASE_URL}/videos/${id}`
);

const video =
await res.json();

renderVideo(video);

}

function renderVideo(video){

const media =
video.videoUrl ||
video.fileUrl;

const mediaUrl =
media.startsWith("http")
? media
: API_BASE_URL + media;

document.getElementById(
"videoPage"
).innerHTML = `

<div class="single-video">

<video
src="${mediaUrl}"
controls
autoplay
playsinline>
</video>

<h2>
${video.title}
</h2>

<p>
@${video.creatorUsername}
</p>

<p>
${video.context || ""}
</p>

<button
onclick="shareVideo()"
>
Share
</button>

</div>

`;

}

function shareVideo(){

const url =
window.location.href;

navigator.clipboard
.writeText(url);

alert(
"Video link copied"
);

}