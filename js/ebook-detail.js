const params =
new URLSearchParams(window.location.search);

const id = params.get("id");

loadBook();

async function loadBook(){

  const token =
    localStorage.getItem("token");

  try{

    const res =
      await fetch(
        `${API_BASE_URL}/videos/${id}/read`,
        {
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

    if(!res.ok){

      alert(
        "You must purchase this ebook first"
      );

      window.location.href =
        "library.html";

      return;
    }

    const book =
      await res.json();

    document.getElementById(
      "ebookTitle"
    ).innerText =
      book.title;

    document.getElementById(
      "ebookFrame"
    ).src =
      `${book.fileUrl}#toolbar=0`

  }catch(err){

    console.error(err);

  }

}

function goBack(){
  history.back();
}