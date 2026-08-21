// =====================================
// VINDARR EBOOK DETAIL
// =====================================
// IMPORTANT:
// This version intentionally preserves
// the original working PDF architecture:
//
// GET /library/ebook/:id
//        ↓
// book.fileUrl
//        ↓
// Mozilla PDF.js hosted viewer
//        ↓
// iframe
// =====================================


// =====================================
// URL PARAMETER
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

const titleElement =
  document.getElementById(
    "ebookTitle"
  );

const viewerContainer =
  document.getElementById(
    "viewerContainer"
  );

const viewer =
  document.getElementById(
    "ebookFrame"
  );

const loadingElement =
  document.getElementById(
    "ebookLoading"
  );

const errorElement =
  document.getElementById(
    "ebookError"
  );

const errorMessageElement =
  document.getElementById(
    "ebookErrorMessage"
  );


// =====================================
// LOAD BOOK
// =====================================

async function loadBook() {

  console.log(
    "====================================="
  );

  console.log(
    "VINDARR EBOOK LOADING"
  );

  console.log(
    "EBOOK ID:",
    id
  );

  console.log(
    "====================================="
  );


  // -----------------------------------
  // Validate ID
  // -----------------------------------

  if (!id) {

    showReaderError(
      "No ebook was specified."
    );

    return;

  }


  // -----------------------------------
  // Authentication
  // -----------------------------------

  const token =
    localStorage.getItem(
      "token"
    );


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  // -----------------------------------
  // Show loading
  // -----------------------------------

  showLoading();


  // -----------------------------------
  // Reset iframe
  // -----------------------------------

  if (viewer) {

    viewer.src = "";

  }


  try {

    // =================================
    // REQUEST OWNED EBOOK
    // =================================

    const endpoint =
      `${API_BASE_URL}/library/ebook/${id}`;


    console.log(
      "REQUESTING:",
      endpoint
    );


    const res =
      await fetch(
        endpoint,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    console.log(
      "LIBRARY RESPONSE:",
      res.status
    );


    // =================================
    // HANDLE API ERROR
    // =================================

    if (!res.ok) {

      let message =
        "Failed to load ebook.";


      try {

        const errorData =
          await res.json();


        message =
          errorData.message ||
          message;

      } catch (error) {

        console.warn(
          "Could not read API error response."
        );

      }


      showReaderError(
        message
      );

      return;

    }


    // =================================
    // READ BOOK
    // =================================

    const book =
      await res.json();


    console.log(
      "BOOK FROM API:",
      book
    );


    // =================================
    // TITLE
    // =================================

    const title =
      book.title ||
      "Untitled Ebook";


    if (titleElement) {

      titleElement.innerText =
        title;

      titleElement.title =
        title;

    }


    // =================================
    // FILE URL
    // =================================

    const pdfUrl =
      book.fileUrl;


    console.log(
      "FILE URL FROM API:",
      pdfUrl
    );


    // =================================
    // VALIDATE FILE URL
    // =================================

    if (!pdfUrl) {

      showReaderError(
        "This ebook does not have a PDF file."
      );

      return;

    }


    // =================================
    // IMPORTANT
    // =================================
    //
    // DO NOT use:
    //
    // pdfjsLib.getDocument()
    //
    // DO NOT create:
    //
    // /library/ebook/:id/file
    //
    // DO NOT proxy the PDF through
    // the NestJS backend.
    //
    // We retain the original working
    // Mozilla PDF.js hosted viewer.
    // =================================


    const viewerUrl =
      "https://mozilla.github.io/pdf.js/web/viewer.html?file=" +
      encodeURIComponent(
        pdfUrl
      );


    console.log(
      "PDF VIEWER URL:",
      viewerUrl
    );


    // =================================
    // SHOW IFRAME
    // =================================

    if (!viewer) {

      showReaderError(
        "PDF viewer could not be initialized."
      );

      return;

    }


    viewer.onload =
      function () {

        console.log(
          "PDF VIEWER IFRAME LOADED"
        );


        hideLoading();

      };


    viewer.onerror =
      function () {

        console.error(
          "PDF VIEWER IFRAME ERROR"
        );


        showReaderError(
          "The PDF reader could not be opened."
        );

      };


    // =================================
    // LOAD PDF
    // =================================

    viewer.src =
      viewerUrl;


    console.log(
      "PDF VIEWER STARTED"
    );


    // =================================
    // FALLBACK
    // =================================
    //
    // Some browsers/webviews do not
    // reliably fire iframe.onload.
    //
    // Give the hosted PDF.js viewer
    // enough time to initialize before
    // removing our loading screen.
    //
    // We intentionally DON'T show an
    // error just because the iframe
    // takes time.
    // =================================

    setTimeout(
      function () {

        hideLoading();

      },
      3000
    );


  } catch (error) {

    console.error(
      "EBOOK LOAD ERROR:",
      error
    );


    showReaderError(
      "Unable to load this ebook. Please try again."
    );

  }

}


// =====================================
// LOADING STATE
// =====================================

function showLoading() {

  if (loadingElement) {

    loadingElement.hidden =
      false;

  }


  if (errorElement) {

    errorElement.hidden =
      true;

  }


  if (viewer) {

    viewer.style.visibility =
      "hidden";

  }

}


// =====================================
// HIDE LOADING
// =====================================

function hideLoading() {

  if (loadingElement) {

    loadingElement.hidden =
      true;

  }


  if (errorElement) {

    errorElement.hidden =
      true;

  }


  if (viewer) {

    viewer.style.visibility =
      "visible";

  }

}


// =====================================
// ERROR
// =====================================

function showReaderError(
  message
) {

  console.error(
    "EBOOK READER ERROR:",
    message
  );


  if (loadingElement) {

    loadingElement.hidden =
      true;

  }


  if (viewer) {

    viewer.style.visibility =
      "hidden";

  }


  if (errorMessageElement) {

    errorMessageElement.innerText =
      message ||
      "We couldn't open this ebook.";

  }


  if (errorElement) {

    errorElement.hidden =
      false;

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


  if (!page) {

    return;

  }


  if (
    !document.fullscreenElement
  ) {

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
// UPDATE FULLSCREEN ICON
// =====================================

document.addEventListener(
  "fullscreenchange",
  function () {

    const button =
      document.getElementById(
        "fullscreenBtn"
      );


    if (!button) {

      return;

    }


    const icon =
      button.querySelector(
        "i"
      );


    if (!icon) {

      return;

    }


    if (
      document.fullscreenElement
    ) {

      icon.className =
        "bi bi-fullscreen-exit";

      button.title =
        "Exit fullscreen";

    } else {

      icon.className =
        "bi bi-fullscreen";

      button.title =
        "Fullscreen";

    }

  }
);


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
// START
// =====================================

loadBook();