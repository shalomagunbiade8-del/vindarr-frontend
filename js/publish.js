/* ==========================================
   VINDARR PUBLISH
   DIRECT-TO-CLOUDINARY VERSION
   ========================================== */

"use strict";

/* ==========================================
   STATE
   ========================================== */

let currentType = "video";
let publishing = false;
let activeXHRs = [];

const params = new URLSearchParams(
  window.location.search
);

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
   SAFE DOM HELPER
   ========================================== */

function $(id) {
  return document.getElementById(id);
}

/* ==========================================
   TYPE SWITCHING
   ========================================== */

function setType(type) {

  currentType = type;

  const file = $("uFile");
  const cover = $("uCoverImage");
  const price = $("uPrice");

  const coverWrapper =
    $("coverWrapper");

  const priceWrapper =
    $("priceWrapper");

  const fileLabel =
    $("fileLabel");

  if (!file) {
    return;
  }

  /* ----------------------------------------
     RESET TYPE BUTTONS
  ---------------------------------------- */

  document
    .querySelectorAll(".publish-types button")
    .forEach((button) => {
      button.classList.remove("active");
    });

  /* ----------------------------------------
     VIDEO
  ---------------------------------------- */

  if (type === "video") {

    $("videoBtn")
      ?.classList
      .add("active");

    file.accept = "video/*";

    if (fileLabel) {
      fileLabel.textContent =
        "Choose Video";
    }

    if (coverWrapper) {
      coverWrapper.style.display =
        "none";
    }

    if (priceWrapper) {
      priceWrapper.style.display =
        "none";
    }

    if (cover) {
      cover.value = "";
    }

    if (price) {
      price.value = "";
    }
  }

  /* ----------------------------------------
     EBOOK
  ---------------------------------------- */

  else if (type === "ebook") {

    $("ebookBtn")
      ?.classList
      .add("active");

    file.accept =
      ".pdf,application/pdf";

    if (fileLabel) {
      fileLabel.textContent =
        "Choose PDF";
    }

    if (coverWrapper) {
      coverWrapper.style.display =
        "block";
    }

    if (priceWrapper) {
      priceWrapper.style.display =
        "block";
    }
  }

  /* ----------------------------------------
     FASHION
  ---------------------------------------- */

  else if (type === "fashion") {

    $("fashionBtn")
      ?.classList
      .add("active");

    file.accept =
      "image/*,video/*";

    if (fileLabel) {
      fileLabel.textContent =
        "Choose Product Image or Video";
    }

    if (coverWrapper) {
      coverWrapper.style.display =
        "none";
    }

    if (priceWrapper) {
      priceWrapper.style.display =
        "block";
    }

    if (cover) {
      cover.value = "";
    }
  }

  /* ----------------------------------------
     ESSENTIAL
  ---------------------------------------- */

  else if (type === "essential") {

    $("essentialBtn")
      ?.classList
      .add("active");

    file.accept =
      "image/*,video/*";

    if (fileLabel) {
      fileLabel.textContent =
        "Choose Product Image or Video";
    }

    if (coverWrapper) {
      coverWrapper.style.display =
        "none";
    }

    if (priceWrapper) {
      priceWrapper.style.display =
        "block";
    }

    if (cover) {
      cover.value = "";
    }
  }

  /* ----------------------------------------
     RESET PREVIEW
  ---------------------------------------- */

  resetPreviews();
}

/* ==========================================
   RESET PREVIEWS
   ========================================== */

function resetPreviews() {

  if (preview) {
    preview.style.display =
      "none";
  }

  const imagePreview =
    $("imagePreview");

  const videoPreview =
    $("videoPreview");

  const pdfPreview =
    $("pdfPreview");

  if (imagePreview) {

    imagePreview.style.display =
      "none";

    imagePreview.removeAttribute(
      "src"
    );
  }

  if (videoPreview) {

    videoPreview.style.display =
      "none";

    videoPreview.removeAttribute(
      "src"
    );
  }

  if (pdfPreview) {

    pdfPreview.style.display =
      "none";
  }

  if (coverPreview) {

    coverPreview.removeAttribute(
      "src"
    );
  }

  $("coverPreviewWrapper")
    ?.style
    .setProperty(
      "display",
      "none"
    );
}

/* ==========================================
   MAIN FILE PREVIEW
   ========================================== */

fileInput?.addEventListener(
  "change",
  () => {

    const file =
      fileInput.files?.[0];

    const imagePreview =
      $("imagePreview");

    const videoPreview =
      $("videoPreview");

    const pdfPreview =
      $("pdfPreview");

    const pdfName =
      $("pdfName");

    if (!file) {

      resetPreviews();

      return;
    }

    resetPreviews();

    const url =
      URL.createObjectURL(file);

    if (preview) {
      preview.style.display =
        "block";
    }

    /* IMAGE */

    if (
      file.type.startsWith(
        "image/"
      )
    ) {

      if (imagePreview) {

        imagePreview.src =
          url;

        imagePreview.style.display =
          "block";
      }

      return;
    }

    /* VIDEO */

    if (
      file.type.startsWith(
        "video/"
      )
    ) {

      if (videoPreview) {

        videoPreview.src =
          url;

        videoPreview.style.display =
          "block";
      }

      return;
    }

    /* PDF */

    if (pdfName) {

      pdfName.textContent =
        file.name;
    }

    if (pdfPreview) {

      pdfPreview.style.display =
        "flex";
    }
  }
);

/* ==========================================
   COVER PREVIEW
   ========================================== */

coverInput?.addEventListener(
  "change",
  () => {

    const file =
      coverInput.files?.[0];

    if (!file) {
      return;
    }

    const url =
      URL.createObjectURL(file);

    if (coverPreview) {

      coverPreview.src =
        url;
    }

    $("coverPreviewWrapper")
      ?.style
      .setProperty(
        "display",
        "block"
      );
  }
);

/* ==========================================
   VALIDATION
   ========================================== */

function validatePublish() {

  if (
    !titleInput?.value.trim()
  ) {

    alert(
      "Enter a title."
    );

    titleInput?.focus();

    return false;
  }

  if (
    !contextInput?.value.trim()
  ) {

    alert(
      "Enter a description."
    );

    contextInput?.focus();

    return false;
  }

  if (
    !categoryInput?.value
  ) {

    alert(
      "Select a category."
    );

    categoryInput?.focus();

    return false;
  }

  const hasNewFile =
    Boolean(
      fileInput?.files?.[0]
    );

  /*
   * Creating new content requires media.
   * Editing existing content does not require
   * the user to select new media.
   */

  if (
    !editId &&
    !hasNewFile
  ) {

    alert(
      "Choose a file."
    );

    return false;
  }

  /*
   * New ebooks require a cover.
   *
   * During editing, an existing cover may remain
   * unchanged if the user does not select another.
   */

  if (
    currentType === "ebook" &&
    !editId &&
    !coverInput?.files?.[0]
  ) {

    alert(
      "Choose a cover image."
    );

    return false;
  }

  /*
   * Ebooks and products require a price.
   */

  if (
    currentType !== "video"
  ) {

    const price =
      String(
        priceInput?.value || ""
      )
        .replace(/,/g, "")
        .replace(/₦/g, "")
        .trim();

    if (
      !price ||
      Number.isNaN(
        Number(price)
      )
    ) {

      alert(
        "Enter a valid price."
      );

      priceInput?.focus();

      return false;
    }
  }

  return true;
}

/* ==========================================
   UPLOAD PROGRESS
   ========================================== */

function showUploadProgress(
  title,
  percent,
  detail = "Please wait..."
) {

  if (!uploadStatus) {
    return;
  }

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );

  uploadStatus.innerHTML = `
    <div class="upload-status-card">

      <div class="upload-status-top">

        <div class="upload-spinner"></div>

        <div>

          <div class="upload-status-title">
            ${escapeHtml(title)}
          </div>

          <div class="upload-status-text">
            ${escapeHtml(detail)}
          </div>

        </div>

      </div>

      <div class="progress">

        <div
          class="progress-bar"
          style="width:${safePercent}%"
        >
          ${safePercent}%
        </div>

      </div>

    </div>
  `;
}

/* ==========================================
   STATUS MESSAGE
   ========================================== */

function showStatus(
  title,
  message,
  type = "success"
) {

  if (!uploadStatus) {
    return;
  }

  const icon =
    type === "success"
      ? "bi-check-circle-fill"
      : "bi-x-circle-fill";

  uploadStatus.innerHTML = `
    <div class="upload-status-card ${type}">

      <i class="bi ${icon}"></i>

      <div>

        <div class="upload-status-title">
          ${escapeHtml(title)}
        </div>

        <div class="upload-status-text">
          ${escapeHtml(message)}
        </div>

      </div>

    </div>
  `;
}

/* ==========================================
   TOKEN
   ========================================== */

function getToken() {

  const token =
    localStorage.getItem("token");

  if (!token) {

    window.location.href =
      "login.html";

    return null;
  }

  return token;
}

/* ==========================================
   CLOUDINARY SIGNATURE
   ========================================== */

async function getCloudinarySignature(
  type,
  token,
  purpose = null
) {

  const response =
    await fetch(
      `${API_BASE_URL}/cloudinary/signature`,
      {
        method: "POST",

        headers: {

          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

            type,

            ...(purpose
              ? { purpose }
              : {})

          })
      }
    );

  const data =
    await readResponse(
      response
    );

  if (
    response.status === 401
  ) {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    window.location.href =
      "login.html";

    throw new Error(
      "Your session has expired."
    );
  }

  if (!response.ok) {

    throw new Error(
      data?.message ||
      "Unable to prepare media upload."
    );
  }

  if (
    !data?.cloudName ||
    !data?.apiKey ||
    !data?.timestamp ||
    !data?.signature ||
    !data?.resourceType
  ) {

    throw new Error(
      "Invalid Cloudinary upload configuration returned by the server."
    );
  }

  return data;
}

/* ==========================================
   DIRECT CLOUDINARY UPLOAD
   ========================================== */

function uploadToCloudinary(
  file,
  signatureData,
  onProgress
) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {

        reject(
          new Error(
            "No file selected."
          )
        );

        return;
      }

      const xhr =
        new XMLHttpRequest();

      activeXHRs.push(xhr);

      const resourceType =
        signatureData.resourceType ||
        "auto";

      const uploadUrl =
        `https://api.cloudinary.com/v1_1/` +
        `${encodeURIComponent(
          signatureData.cloudName
        )}/` +
        `${encodeURIComponent(
          resourceType
        )}/upload`;

      xhr.open(
        "POST",
        uploadUrl,
        true
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      formData.append(
        "api_key",
        signatureData.apiKey
      );

      formData.append(
        "timestamp",
        String(
          signatureData.timestamp
        )
      );

      formData.append(
        "signature",
        signatureData.signature
      );

      if (
        signatureData.folder
      ) {

        formData.append(
          "folder",
          signatureData.folder
        );
      }

      /*
       * If the backend supplies a public_id,
       * include it.
       */

      if (
        signatureData.publicId
      ) {

        formData.append(
          "public_id",
          signatureData.publicId
        );
      }

      /*
       * Cloudinary upload progress.
       */

      xhr.upload.onprogress =
        (event) => {

          if (
            !event.lengthComputable
          ) {

            return;
          }

          const percent =
            Math.round(
              (
                event.loaded /
                event.total
              ) * 100
            );

          if (
            typeof onProgress ===
            "function"
          ) {

            onProgress(
              percent
            );
          }
        };

      /*
       * Success / failure.
       */

      xhr.onload =
        () => {

          removeActiveXHR(
            xhr
          );

          let data = null;

          try {

            data =
              JSON.parse(
                xhr.responseText
              );

          }
          catch {

            data = {
              message:
                xhr.responseText ||
                "Cloudinary returned an invalid response."
            };
          }

          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {

            if (
              !data?.secure_url
            ) {

              reject(
                new Error(
                  "Cloudinary did not return a media URL."
                )
              );

              return;
            }

            resolve(data);

            return;
          }

          reject(
            new Error(
              data?.error?.message ||
              data?.message ||
              "Cloudinary upload failed."
            )
          );
        };

      xhr.onerror =
        () => {

          removeActiveXHR(
            xhr
          );

          reject(
            new Error(
              "Network error while uploading media."
            )
          );
        };

      xhr.onabort =
        () => {

          removeActiveXHR(
            xhr
          );

          reject(
            new Error(
              "Upload cancelled."
            )
          );
        };

      xhr.send(
        formData
      );
    }
  );
}

/* ==========================================
   REMOVE ACTIVE XHR
   ========================================== */

function removeActiveXHR(
  xhr
) {

  activeXHRs =
    activeXHRs.filter(
      (item) =>
        item !== xhr
    );
}

/* ==========================================
   UPLOAD MEDIA
   ========================================== */

async function uploadMedia(
  file,
  type,
  token,
  label,
  progressStart = 0,
  progressEnd = 100,
  purpose = null
) {

  showUploadProgress(
    `Preparing ${label}`,
    progressStart,
    "Preparing secure upload..."
  );

  /*
   * Request a signed Cloudinary upload.
   */

  const signature =
    await getCloudinarySignature(
      type,
      token,
      purpose
    );

  /*
   * Upload directly from the browser
   * to Cloudinary.
   */

  const result =
    await uploadToCloudinary(
      file,
      signature,
      (percent) => {

        const overall =
          progressStart +
          (
            (
              progressEnd -
              progressStart
            ) *
            percent
          ) / 100;

        showUploadProgress(
          `Uploading ${label}`,
          Math.round(
            overall
          ),
          `${percent}% uploaded`
        );
      }
    );

  return result;
}

/* ==========================================
   PUBLISH
   ========================================== */

async function publish() {

  if (publishing) {
    return;
  }

  if (
    !validatePublish()
  ) {

    return;
  }

  const token =
    getToken();

  if (!token) {
    return;
  }

  publishing = true;

  setPublishingState(
    true
  );

  try {

    const file =
      fileInput?.files?.[0] ||
      null;

    const cover =
      coverInput?.files?.[0] ||
      null;

    let videoUrl =
      undefined;

    let fileUrl =
      undefined;

    let coverUrl =
      undefined;

    /* ======================================
       VIDEO
       ====================================== */

    if (
      file &&
      currentType === "video"
    ) {

      const result =
        await uploadMedia(
          file,
          "video",
          token,
          "video",
          0,
          100,
          "video"
        );

      videoUrl =
        result.secure_url;
    }

    /* ======================================
       EBOOK
       ====================================== */

    else if (
      file &&
      currentType === "ebook"
    ) {

      showUploadProgress(
        "Uploading book",
        0,
        "Preparing book and cover..."
      );

      /*
       * Upload PDF and cover simultaneously.
       *
       * PDF occupies 75% of progress.
       * Cover occupies 25%.
       */

      const pdfPromise =
        uploadMedia(
          file,
          "ebook",
          token,
          "book PDF",
          0,
          75,
          "pdf"
        );

      const coverPromise =
        cover
          ? uploadMedia(
              cover,
              "ebook",
              token,
              "book cover",
              25,
              100,
              "cover"
            )
          : Promise.resolve(
              null
            );

      const [
        pdfResult,
        coverResult
      ] =
        await Promise.all([
          pdfPromise,
          coverPromise
        ]);

      fileUrl =
        pdfResult.secure_url;

      if (
        coverResult
      ) {

        coverUrl =
          coverResult.secure_url;
      }
    }

    /* ======================================
       FASHION / ESSENTIAL
       ====================================== */

    else if (
      file &&
      (
        currentType === "fashion" ||
        currentType === "essential"
      )
    ) {

      const result =
        await uploadMedia(
          file,
          currentType,
          token,
          "product media",
          0,
          100,
          "product"
        );

      fileUrl =
        result.secure_url;
    }

    /* ======================================
       BUILD DATABASE PAYLOAD
       ====================================== */

    const payload = {

      title:
        titleInput.value.trim(),

      context:
        contextInput.value.trim(),

      category:
        categoryInput.value,

      type:
        currentType,

      price:
        0
    };

    /* ======================================
       PRICE
       ====================================== */

    if (
      currentType !== "video"
    ) {

      const cleanPrice =
        String(
          priceInput?.value || ""
        )
          .replace(/,/g, "")
          .replace(/₦/g, "")
          .trim();

      payload.price =
        cleanPrice
          ? Number(cleanPrice)
          : 0;
    }

    /* ======================================
       MEDIA URLS
       ====================================== */

    /*
     * Only send URLs that were actually
     * uploaded in this operation.
     *
     * This is important during editing.
     */

    if (
      videoUrl !== undefined
    ) {

      payload.videoUrl =
        videoUrl;
    }

    if (
      fileUrl !== undefined
    ) {

      payload.fileUrl =
        fileUrl;
    }

    if (
      coverUrl !== undefined
    ) {

      payload.coverUrl =
        coverUrl;
    }

    /* ======================================
       SAVE DATABASE RECORD
       ====================================== */

    showUploadProgress(
      editId
        ? "Saving changes"
        : "Finishing publication",
      100,
      "Saving your content to Vindarr..."
    );

    const endpoint =
      editId
        ? `${API_BASE_URL}/videos/${editId}`
        : `${API_BASE_URL}/videos`;

    const method =
      editId
        ? "PATCH"
        : "POST";

    const response =
      await fetch(
        endpoint,
        {

          method,

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    const data =
      await readResponse(
        response
      );

    if (
      response.status === 401
    ) {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href =
        "login.html";

      return;
    }

    if (
      !response.ok
    ) {

      throw new Error(
        data?.message ||
        "Unable to save your content."
      );
    }

    /* ======================================
       SUCCESS
       ====================================== */

    showStatus(

      editId
        ? "Updated Successfully"
        : "Published Successfully",

      editId
        ? "Your changes are now live."
        : "Your content is now live.",

      "success"
    );

    resetPublishForm();

  }
  catch (error) {

    console.error(
      "VINDARR PUBLISH ERROR:",
      error
    );

    showStatus(
      "Publication Failed",
      error?.message ||
        "Something went wrong while publishing.",
      "error"
    );
  }
  finally {

    publishing = false;

    setPublishingState(
      false
    );
  }
}

/* ==========================================
   PUBLISHING BUTTON STATE
   ========================================== */

function setPublishingState(
  active
) {

  if (!publishButton) {
    return;
  }

  publishButton.disabled =
    active;

  if (active) {

    publishButton.innerHTML = `
      <span class="button-spinner"></span>
      Publishing...
    `;

  }
  else {

    publishButton.innerHTML = `
      <i class="bi bi-cloud-upload"></i>
      Publish
    `;
  }
}

/* ==========================================
   RESET FORM
   ========================================== */

function resetPublishForm() {

  if (titleInput) {
    titleInput.value = "";
  }

  if (contextInput) {
    contextInput.value = "";
  }

  if (categoryInput) {
    categoryInput.value = "";
  }

  if (priceInput) {
    priceInput.value = "";
  }

  if (fileInput) {
    fileInput.value = "";
  }

  if (coverInput) {
    coverInput.value = "";
  }

  resetPreviews();

  setType(
    "video"
  );
}

/* ==========================================
   LOAD EDIT CONTENT
   ========================================== */

async function loadEditPost() {

  if (!editId) {
    return;
  }

  const token =
    getToken();

  if (!token) {
    return;
  }

  try {

    showUploadProgress(
      "Loading content",
      50,
      "Loading content for editing..."
    );

    const response =
      await fetch(
        `${API_BASE_URL}/videos/${editId}`,
        {

          method: "GET",

          headers: {

            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const post =
      await readResponse(
        response
      );

    if (
      response.status === 401
    ) {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href =
        "login.html";

      return;
    }

    if (
      !response.ok
    ) {

      throw new Error(
        post?.message ||
        "Unable to load content."
      );
    }

    if (titleInput) {

      titleInput.value =
        post.title || "";
    }

    if (contextInput) {

      contextInput.value =
        post.context || "";
    }

    if (categoryInput) {

      categoryInput.value =
        post.category || "";
    }

    if (priceInput) {

      priceInput.value =
        post.price ?? "";
    }

    if (post.type) {

      setType(
        post.type
      );
    }

    if (uploadStatus) {

      uploadStatus.innerHTML =
        "";
    }

  }
  catch (error) {

    console.error(
      "LOAD EDIT ERROR:",
      error
    );

    showStatus(
      "Unable to Load",
      error?.message ||
        "Unable to load content.",
      "error"
    );
  }
}

/* ==========================================
   RESPONSE PARSER
   ========================================== */

async function readResponse(
  response
) {

  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {

    return JSON.parse(
      text
    );

  }
  catch {

    return {
      message:
        text
    };
  }
}

/* ==========================================
   HTML ESCAPE
   ========================================== */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

/* ==========================================
   CANCEL ACTIVE UPLOADS
   ========================================== */

function cancelActiveUploads() {

  activeXHRs.forEach(
    (xhr) => {

      try {
        xhr.abort();
      }
      catch {
        // Ignore abort errors.
      }
    }
  );

  activeXHRs = [];
}

/* ==========================================
   INITIALIZATION
   ========================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setType(
      "video"
    );

    loadEditPost();

  }
);

/* ==========================================
   PAGE EXIT
   ========================================== */

window.addEventListener(
  "beforeunload",
  () => {

    /*
     * Do not automatically abort uploads.
     *
     * Browser navigation rules differ between
     * browsers and automatic aborting here can
     * interfere with normal navigation.
     */

  }
);
