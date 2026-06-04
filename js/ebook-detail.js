const params =
new URLSearchParams(window.location.search);

const id = params.get("id");

loadBook();

async function loadBook() {

  const token =
    localStorage.getItem("token");

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/library/ebook/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

    console.log(
      "STATUS:",
      res.status
    );

    const book =
      await res.json();

    console.log(
      "BOOK:",
      book
    );

    if (!book.fileUrl) {

      alert(
        "No PDF URL found"
      );

      return;
    }

    window.location.href =
      book.fileUrl;

  } catch (err) {

    console.error(
      "EBOOK ERROR:",
      err
    );

  }
}

function goBack(){
  history.back();
}