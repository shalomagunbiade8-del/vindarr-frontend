// =====================================
// VINDARR EBOOK READER
// =====================================

const params =
  new URLSearchParams(
    window.location.search
  );

const id =
  params.get("id");


// =====================================
// ELEMENTS
// =====================================

const ebookTitle =
  document.getElementById(
    "ebookTitle"
  );

const ebookFrame =
  document.getElementById(
    "ebookFrame"
  );

const ebookLoading =
  document.getElementById(
    "ebookLoading"
  );

const ebookError =
  document.getElementById(
    "ebookError"
  );


// =====================================
// INITIALIZE
// =====================================

if (!id) {

  showReaderError(
    "No ebook was specified."
  );

} else {

  loadBook();

}


// =====================================
// LOAD BOOK
// =====================================

async function loadBook() {

  hideReaderError();

  showLoading();

  const token =
    localStorage.getItem("token");


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  try {

    const res =
      await fetch(
        `${API_BASE_URL}/library/ebook/${id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!res.ok) {

      throw new Error(
        `Failed to load ebook: ${res.status}`
      );

    }


    const book =
      await res.json();


    console.log(
      "BOOK FROM API:",
      book
    );


    // =================================
    // TITLE
    // =================================

    ebookTitle.innerText =
      book.title ||
      "Untitled Ebook";


    // =================================
    // PDF URL
    // =================================

    const fileUrl =
      getFileUrl(
        book.fileUrl
      );


    if (!fileUrl) {

      throw new Error(
        "Ebook file URL is missing."
      );

    }


    console.log(
      "PDF URL:",
      fileUrl
    );


    // =================================
    // PDF.JS VIEWER
    // =================================

    const viewerUrl =
      "https://mozilla.github.io/pdf.js/web/viewer.html" +
      `?file=${encodeURIComponent(fileUrl)}`;


    console.log(
      "VIEWER URL:",
      viewerUrl
    );


    ebookFrame.src =
      viewerUrl;


    ebookFrame.onload =
      function () {

        hideLoading();

      };


    ebookFrame.onerror =
      function () {

        showReaderError(
          "The ebook viewer could not be loaded."
        );

      };


    // Fallback in case iframe
    // does not fire correctly.

    setTimeout(
      () => {

        if (
          ebookFrame.src &&
          !ebookLoading.hidden
        ) {

          hideLoading();

        }

      },
      5000
    );


  } catch (err) {

    console.error(
      "EBOOK LOAD ERROR:",
      err
    );


    showReaderError(
      "We couldn't open this ebook."
    );

  }

}


// =====================================
// FILE URL HELPER
// =====================================

function getFileUrl(
  fileUrl
) {

  if (!fileUrl) {

    return "";

  }


  const value =
    String(fileUrl);


  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {

    return value;

  }


  if (
    value.startsWith("//")
  ) {

    return window.location.protocol +
      value;

  }


  if (
    value.startsWith("/")
  ) {

    return API_BASE_URL +
      value;

  }


  return API_BASE_URL +
    "/" +
    value;

}


// =====================================
// LOADING STATE
// =====================================

function showLoading() {

  ebookLoading.hidden =
    false;

  ebookError.hidden =
    true;

  ebookFrame.style.visibility =
    "hidden";

}


function hideLoading() {

  ebookLoading.hidden =
    true;

  ebookFrame.style.visibility =
    "visible";

}


// =====================================
// ERROR STATE
// =====================================

function showReaderError(
  message
) {

  ebookLoading.hidden =
    true;

  ebookFrame.style.visibility =
    "hidden";

  ebookError.hidden =
    false;


  const paragraph =
    ebookError.querySelector("p");


  if (paragraph) {

    paragraph.innerText =
      message ||
      "Something went wrong.";

  }

}


function hideReaderError() {

  ebookError.hidden =
    true;

}


// =====================================
// BACK
// =====================================

function goBack() {

  if (
    window.history.length > 1
  ) {

    window.history.back();

  } else {

    window.location.href =
      "library.html";

  }

}


// =====================================
// FULLSCREEN
// =====================================

function toggleFullscreen() {

  const page =
    document.querySelector(
      ".ebook-reader-page"
    );


  if (!document.fullscreenElement) {

    if (
      page.requestFullscreen
    ) {

      page.requestFullscreen();

    }

  } else {

    if (
      document.exitFullscreen
    ) {

      document.exitFullscreen();

    }

  }

}


// =====================================
// FULLSCREEN ICON
// =====================================

document.addEventListener(
  "fullscreenchange",
  () => {

    const button =
      document.getElementById(
        "fullscreenBtn"
      );

    if (!button) return;


    const icon =
      button.querySelector("i");

    if (!icon) return;


    if (document.fullscreenElement) {

      icon.className =
        "bi bi-fullscreen-exit";

    } else {

      icon.className =
        "bi bi-fullscreen";

    }

  }
);