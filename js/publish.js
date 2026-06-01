let currentType = "video";

const params =
new URLSearchParams(window.location.search);

const editId =
params.get("edit");

if(editId){

  loadEditPost();

}



/* =========================
   SET TYPE
========================= */
function setType(type){

  currentType = type;

  const fileInput =
    document.getElementById("uFile");

  const coverInput =
    document.getElementById("uCoverImage");

  const priceInput =
    document.getElementById("uPrice");

  // RESET ACTIVE
  document.querySelectorAll(".publish-types button")
    .forEach(btn => btn.classList.remove("active"));

  // VIDEO
  if(type === "video"){

    document.getElementById("videoBtn")
      .classList.add("active");

    fileInput.accept = "video/*";

    coverInput.style.display = "none";

    priceInput.style.display = "none";

  }

  // EBOOK
  if(type === "ebook"){

    document.getElementById("ebookBtn")
      .classList.add("active");

    fileInput.accept = ".pdf";

    coverInput.style.display = "block";

    priceInput.style.display = "block";

  }

  // PRODUCT
  if(type === "fashion"){

    document.getElementById("fashionBtn")
      .classList.add("active");

    fileInput.accept = "image/*,video/*";

    coverInput.style.display = "none";

    priceInput.style.display = "block";

  }

  // VINDARR ESSENTIAL
if(type === "essential"){

  document.getElementById("essentialBtn")
    .classList.add("active");

  fileInput.accept =
    "image/*,video/*";

  coverInput.style.display =
    "none";

  priceInput.style.display =
    "block";

}

}

/* =========================
   PUBLISH
========================= */
async function publish(){

  const token =
    localStorage.getItem("token");

  if(!token){
    alert("Login required");
    return;
  }

  const title =
    document.getElementById("uTitle").value;

  const context =
    document.getElementById("uContext").value;

  const category =
    document.getElementById("uCategory").value;

  const price =
  document.getElementById("uPrice")
    .value
    .replace(/,/g,'')
    .replace(/₦/g,'');

  const file =
    document.getElementById("uFile").files[0];

  const cover =
    document.getElementById("uCoverImage").files[0];

  const status =
    document.getElementById("uploadStatus");

  /* VALIDATION */

  if(!title || !context || !category){
    alert("Fill all fields");
    return;
  }

  if(!file){
    alert("Select a file");
    return;
  }

  if(currentType === "ebook" && !cover){
    alert("Select ebook cover image");
    return;
  }

  const formData = new FormData();

  formData.append("title", title);
  formData.append("context", context);
  formData.append("category", category);
  formData.append("type", currentType);

if(
  currentType !== "video" &&
  (!price || isNaN(Number(price)))
){
  alert("Enter a valid price");
  return;
}

  if(price){
    formData.append("price", price);
  }

  formData.append("file", file);

  if(cover){
    formData.append("cover", cover);
  }

  try{

    status.innerHTML = "Uploading...";

    const res = await fetch(

  editId
  ? `${API_BASE_URL}/videos/${editId}`
  : `${API_BASE_URL}/videos`,

{

      method: editId ? "PUT" : "POST",

      headers:{
        Authorization:`Bearer ${token}`
      },

      body:formData

    });

    const data = await res.json();

    if(!res.ok){

      status.innerHTML =
  data.message ||
  "Upload failed ❌";

console.log(data);

alert(JSON.stringify(data));

return;

    }

    status.innerHTML = "Published successfully ✅";

    // RESET FORM
    document.getElementById("uTitle").value = "";
    document.getElementById("uContext").value = "";
    document.getElementById("uCategory").value = "";
    document.getElementById("uPrice").value = "";
    document.getElementById("uFile").value = "";
    document.getElementById("uCoverImage").value = "";

  }catch(err){

    console.error(err);

    status.innerHTML = "Network error ❌";

  }

}

/* DEFAULT */
setType("video");

async function loadEditPost(){

  try{

    const res =
      await fetch(
        `${API_BASE_URL}/videos/${editId}`
      );

    const post =
      await res.json();

    document.getElementById("uTitle").value =
      post.title || "";

    document.getElementById("uContext").value =
      post.context || "";

    document.getElementById("uPrice").value =
      post.price || "";

  }catch(err){

    console.error(err);

  }

}

