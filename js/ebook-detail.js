const params =
  new URLSearchParams(window.location.search);

const id = params.get("id");

loadBook();

async function loadBook() {

  const token =
    localStorage.getItem("token");

  const res =
    await fetch(
      `${API_BASE_URL}/library/ebook/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
  console.error("Failed to load ebook");
  return;
}

  const book =
    await res.json();

  console.log("BOOK:", book);

  document.getElementById(
    "ebookTitle"
  ).innerText =
    book.title;

  console.log(
  "PDF URL:",
  book.fileUrl
);

const viewer =
  document.getElementById(
    "ebookFrame"
  );

viewer.src =
  `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(book.fileUrl)}`;

viewer.onerror = () => {

  console.log(
    "PDF FAILED TO LOAD"
  );

};

function goBack() {
  history.back();
}


}