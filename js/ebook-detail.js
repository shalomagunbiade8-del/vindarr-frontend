const params =
new URLSearchParams(window.location.search);

const id = params.get("id");

loadBook();

async function loadBook(){

  try{

    const res =
    await fetch(`${API_BASE_URL}/videos/${id}`);

    const book =
    await res.json();

    document.getElementById("ebookTitle")
      .innerText = book.title || "Ebook";

    document.getElementById("ebookFrame")
  .src = book.fileUrl?.startsWith("http")
    ? book.fileUrl
    : API_BASE_URL + book.fileUrl;

  }catch(err){

    console.error(err);

    alert("Failed to load ebook");

  }

}

function goBack(){
  history.back();
}