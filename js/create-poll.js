/* ==========================================
   VINDARR — CREATE POLL
========================================== */

"use strict";


/* ==========================================
   CONFIG
========================================== */

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;


/* ==========================================
   STATE
========================================== */

let optionCount = 0;
let publishing = false;


/*
 * Keeps references to object URLs created
 * for local previews.
 */
const objectUrls = new Set();


/* ==========================================
   ELEMENTS
========================================== */

const question =
    document.getElementById(
        "question"
    );


const questionCount =
    document.getElementById(
        "questionCount"
    );


const category =
    document.getElementById(
        "category"
    );


const optionsGrid =
    document.getElementById(
        "optionsGrid"
    );


const addOptionBtn =
    document.getElementById(
        "addOptionBtn"
    );


const preview =
    document.getElementById(
        "pollPreview"
    );


const publishBtn =
    document.getElementById(
        "publishBtn"
    );


const publishTopBtn =
    document.getElementById(
        "publishTopBtn"
    );


const backBtn =
    document.getElementById(
        "backBtn"
    );


const statusCard =
    document.getElementById(
        "statusCard"
    );


const statusTitle =
    document.getElementById(
        "statusTitle"
    );


const statusText =
    document.getElementById(
        "statusText"
    );


const progressBar =
    document.getElementById(
        "progressBar"
    );


/* ==========================================
   API
========================================== */

const API_BASE =
    typeof API_BASE_URL !== "undefined"
        ? API_BASE_URL
        : "";


/* ==========================================
   AUTH
========================================== */

function getToken() {

    return localStorage.getItem(
        "token"
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* ==========================================
   CREATE OBJECT URL
========================================== */

function createObjectUrl(
    file
) {

    const url =
        URL.createObjectURL(
            file
        );

    objectUrls.add(
        url
    );

    return url;

}


/* ==========================================
   REMOVE OBJECT URL
========================================== */

function revokeObjectUrl(
    url
) {

    if (!url) {
        return;
    }

    try {

        URL.revokeObjectURL(
            url
        );

    } catch {}

    objectUrls.delete(
        url
    );

}


/* ==========================================
   CLEANUP ALL URLS
========================================== */

function cleanupObjectUrls() {

    objectUrls.forEach(
        url => {

            try {

                URL.revokeObjectURL(
                    url
                );

            } catch {}

        }
    );

    objectUrls.clear();

}


/* ==========================================
   ADD OPTION
========================================== */

function addOption() {

    if (
        optionCount >=
        MAX_OPTIONS
    ) {

        return;

    }


    optionCount++;


    const number =
        optionCount;


    const mediaInputId =
        `media-input-${number}`;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "poll-option-builder";


    wrapper.dataset.option =
        String(number);


    wrapper.innerHTML = `

        <div class="option-number">
            ${number}
        </div>


        ${
            number > MIN_OPTIONS
                ? `
                    <button
                        class="remove-option"
                        type="button"
                        aria-label="Remove choice ${number}"
                    >
                        <i class="bi bi-x"></i>
                    </button>
                `
                : ""
        }


        <div class="media-picker">

            <input
                id="${mediaInputId}"
                type="file"
                class="media-input"
                accept="image/*,video/*"
            >


            <label
                for="${mediaInputId}"
                class="media-picker-label"
            >

                <i class="bi bi-image"></i>

                <strong>
                    Add media
                </strong>

                <span>
                    Image or video
                </span>

            </label>


            <div
                class="option-media-preview"
            ></div>

        </div>


        <input
            type="text"
            class="option-caption"
            maxlength="200"
            placeholder="Choice caption..."
            autocomplete="off"
        >

    `;


    optionsGrid.appendChild(
        wrapper
    );


    /* ======================================
       MEDIA INPUT
    ====================================== */

    const input =
        wrapper.querySelector(
            ".media-input"
        );


    const pickerLabel =
        wrapper.querySelector(
            ".media-picker-label"
        );


    /*
     * Standard label -> input behavior.
     */
    pickerLabel?.addEventListener(
        "click",
        () => {

            /*
             * Do not preventDefault.
             *
             * The label already points to
             * the input through "for".
             *
             * This direct click is only a
             * safety fallback.
             */
        }
    );


    /*
     * Additional fallback.
     *
     * If browser/CSS behavior prevents
     * label activation, clicking anywhere
     * on the picker still opens the file
     * selector.
     */
    const mediaPicker =
        wrapper.querySelector(
            ".media-picker"
        );


    mediaPicker?.addEventListener(
        "click",
        event => {

            const clickedInput =
                event.target.closest(
                    ".media-input"
                );


            const clickedButton =
                event.target.closest(
                    ".change-media-btn"
                );


            if (
                clickedInput ||
                clickedButton
            ) {

                return;

            }


            if (
                input &&
                !input.disabled
            ) {

                input.click();

            }

        }
    );


    input?.addEventListener(
        "change",
        () => {

            const file =
                input.files?.[0];


            handleMedia(
                wrapper,
                file
            );


            updatePreview();

        }
    );


    /* ======================================
       CAPTION
    ====================================== */

    const captionInput =
        wrapper.querySelector(
            ".option-caption"
        );


    captionInput?.addEventListener(
        "input",
        updatePreview
    );


    /* ======================================
       REMOVE
    ====================================== */

    const removeBtn =
        wrapper.querySelector(
            ".remove-option"
        );


    removeBtn?.addEventListener(
        "click",
        () => {

            const mediaPreview =
                wrapper.querySelector(
                    ".option-media-preview"
                );


            const currentUrl =
                mediaPreview?.dataset
                    ?.objectUrl;


            revokeObjectUrl(
                currentUrl
            );


            wrapper.remove();


            renumberOptions();


            updatePreview();

        }
    );


    updateOptionButton();

    updatePreview();

}


/* ==========================================
   HANDLE MEDIA
========================================== */

function handleMedia(
    wrapper,
    file
) {

    if (!file) {
        return;
    }


    const validImage =
        file.type.startsWith(
            "image/"
        );


    const validVideo =
        file.type.startsWith(
            "video/"
        );


    if (
        !validImage &&
        !validVideo
    ) {

        alert(
            "Please choose an image or video."
        );

        return;

    }


    const previewBox =
        wrapper.querySelector(
            ".option-media-preview"
        );


    const pickerLabel =
        wrapper.querySelector(
            ".media-picker-label"
        );


    if (
        !previewBox
    ) {

        return;

    }


    /* ======================================
       REVOKE PREVIOUS URL
    ====================================== */

    const oldUrl =
        previewBox.dataset.objectUrl;


    revokeObjectUrl(
        oldUrl
    );


    const url =
        createObjectUrl(
            file
        );


    previewBox.innerHTML = "";


    previewBox.dataset.objectUrl =
        url;


    /* ======================================
       IMAGE
    ====================================== */

    if (validImage) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            url;


        img.alt =
            "Selected poll media";


        previewBox.appendChild(
            img
        );

    }


    /* ======================================
       VIDEO
    ====================================== */

    if (validVideo) {

        const video =
            document.createElement(
                "video"
            );


        video.src =
            url;


        video.muted =
            true;


        video.playsInline =
            true;


        video.controls =
            true;


        video.preload =
            "metadata";


        previewBox.appendChild(
            video
        );

    }


    /* ======================================
       CHANGE BUTTON
    ====================================== */

    const changeButton =
        document.createElement(
            "button"
        );


    changeButton.type =
        "button";


    changeButton.className =
        "change-media-btn";


    changeButton.innerHTML = `
        <i class="bi bi-arrow-repeat"></i>
        Change
    `;


    changeButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            wrapper
                .querySelector(
                    ".media-input"
                )
                ?.click();

        }
    );


    previewBox.appendChild(
        changeButton
    );


    previewBox.style.display =
        "block";


    if (pickerLabel) {

        pickerLabel.style.display =
            "none";

    }

}


/* ==========================================
   RENUMBER OPTIONS
========================================== */

function renumberOptions() {

    const options =
        [
            ...document.querySelectorAll(
                ".poll-option-builder"
            ),
        ];


    optionCount =
        options.length;


    options.forEach(
        (
            option,
            index
        ) => {

            const number =
                index + 1;


            option.dataset.option =
                String(number);


            const numberBadge =
                option.querySelector(
                    ".option-number"
                );


            if (numberBadge) {

                numberBadge.textContent =
                    String(number);

            }


            const input =
                option.querySelector(
                    ".media-input"
                );


            const label =
                option.querySelector(
                    ".media-picker-label"
                );


            if (
                input &&
                label
            ) {

                const newId =
                    `media-input-${number}`;


                input.id =
                    newId;


                label.setAttribute(
                    "for",
                    newId
                );

            }


            const removeBtn =
                option.querySelector(
                    ".remove-option"
                );


            if (number <= MIN_OPTIONS) {

                removeBtn?.remove();

            }

            else if (!removeBtn) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "remove-option";


                button.setAttribute(
                    "aria-label",
                    `Remove choice ${number}`
                );


                button.innerHTML =
                    `<i class="bi bi-x"></i>`;


                button.addEventListener(
                    "click",
                    () => {

                        const previewBox =
                            option.querySelector(
                                ".option-media-preview"
                            );


                        revokeObjectUrl(
                            previewBox
                                ?.dataset
                                ?.objectUrl
                        );


                        option.remove();


                        renumberOptions();


                        updatePreview();

                    }
                );


                option.appendChild(
                    button
                );

            }

        }
    );


    updateOptionButton();

}


/* ==========================================
   OPTION BUTTON
========================================== */

function updateOptionButton() {

    if (!addOptionBtn) {
        return;
    }


    addOptionBtn.disabled =
        optionCount >=
        MAX_OPTIONS;


    if (
        optionCount >=
        MAX_OPTIONS
    ) {

        addOptionBtn.innerHTML = `
            <i class="bi bi-check2"></i>
            Maximum 4 choices
        `;

    }

    else {

        addOptionBtn.innerHTML = `
            <i class="bi bi-plus-lg"></i>
            Add another choice
        `;

    }

}


/* ==========================================
   QUESTION COUNT
========================================== */

question?.addEventListener(
    "input",
    () => {

        if (questionCount) {

            questionCount.textContent =
                `${question.value.length} / 300`;

        }


        updatePreview();

    }
);


/* ==========================================
   PREVIEW MEDIA HTML
========================================== */

function createPreviewMedia(
    file,
    caption
) {

    if (!file) {

        return `
            <div class="preview-media">

                <div class="preview-placeholder">

                    <i class="bi bi-image"></i>

                </div>

            </div>
        `;

    }


    const url =
        createObjectUrl(
            file
        );


    if (
        file.type.startsWith(
            "video/"
        )
    ) {

        return `
            <div class="preview-media">

                <video
                    src="${url}"
                    muted
                    playsinline
                    controls
                    preload="metadata"
                ></video>

            </div>
        `;

    }


    return `
        <div class="preview-media">

            <img
                src="${url}"
                alt="${escapeHtml(caption)}"
            >

        </div>
    `;

}


/* ==========================================
   UPDATE PREVIEW
========================================== */

function updatePreview() {

    if (!preview) {
        return;
    }


    const questionText =
        question?.value.trim() ||
        "Your poll question will appear here.";


    const options =
        [
            ...document.querySelectorAll(
                ".poll-option-builder"
            ),
        ];


    preview.innerHTML = `

        <div class="preview-question">
            ${escapeHtml(questionText)}
        </div>

        <div class="preview-options">

            ${
                options.length
                    ? options.map(
                        (
                            option,
                            index
                        ) => {

                            const caption =
                                option
                                    .querySelector(
                                        ".option-caption"
                                    )
                                    ?.value
                                    .trim() ||
                                `Choice ${index + 1}`;


                            const media =
                                option
                                    .querySelector(
                                        ".media-input"
                                    )
                                    ?.files
                                    ?.[0];


                            let mediaHtml = `
                                <div class="preview-media">

                                    <div class="preview-placeholder">

                                        <i class="bi bi-image"></i>

                                    </div>

                                </div>
                            `;


                            if (media) {

                                const url =
                                    createObjectUrl(
                                        media
                                    );


                                if (
                                    media.type.startsWith(
                                        "video/"
                                    )
                                ) {

                                    mediaHtml = `
                                        <div class="preview-media">

                                            <video
                                                src="${url}"
                                                muted
                                                playsinline
                                                controls
                                                preload="metadata"
                                            ></video>

                                        </div>
                                    `;

                                }

                                else {

                                    mediaHtml = `
                                        <div class="preview-media">

                                            <img
                                                src="${url}"
                                                alt="${escapeHtml(caption)}"
                                            >

                                        </div>
                                    `;

                                }

                            }


                            return `

                                <div class="preview-option">

                                    ${mediaHtml}

                                    <div class="preview-caption">
                                        ${escapeHtml(caption)}
                                    </div>

                                </div>

                            `;

                        }
                    ).join("")
                    : `
                        <div class="preview-option">

                            <div class="preview-media">

                                <div class="preview-placeholder">

                                    <i class="bi bi-bar-chart"></i>

                                </div>

                            </div>

                            <div class="preview-caption">
                                Add your choices above.
                            </div>

                        </div>
                    `
            }

        </div>
    `;

}


/* ==========================================
   VALIDATION
========================================== */

function validatePoll() {

    if (
        !question?.value.trim()
    ) {

        alert(
            "Please enter a poll question."
        );


        question?.focus();


        return false;

    }


    if (
        !category?.value
    ) {

        alert(
            "Please choose a category."
        );


        category?.focus();


        return false;

    }


    const options =
        [
            ...document.querySelectorAll(
                ".poll-option-builder"
            ),
        ];


    if (
        options.length <
        MIN_OPTIONS
    ) {

        alert(
            "Add at least 2 choices."
        );


        return false;

    }


    if (
        options.length >
        MAX_OPTIONS
    ) {

        alert(
            "A poll can have a maximum of 4 choices."
        );


        return false;

    }


    for (
        let index = 0;
        index < options.length;
        index++
    ) {

        const option =
            options[index];


        const file =
            option
                .querySelector(
                    ".media-input"
                )
                ?.files
                ?.[0];


        const caption =
            option
                .querySelector(
                    ".option-caption"
                )
                ?.value
                .trim();


        if (!file) {

            alert(
                `Please add media to choice ${index + 1}.`
            );


            return false;

        }


        if (!caption) {

            alert(
                `Please add a caption to choice ${index + 1}.`
            );


            option
                .querySelector(
                    ".option-caption"
                )
                ?.focus();


            return false;

        }

    }


    return true;

}


/* ==========================================
   PROGRESS
========================================== */

function setProgress(
    value
) {

    if (!progressBar) {
        return;
    }


    const percent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    Number(value) || 0
                )
            )
        );


    progressBar.style.width =
        `${percent}%`;

}


/* ==========================================
   PUBLISH
========================================== */

async function publishPoll() {

    if (publishing) {
        return;
    }


    const token =
        getToken();


    if (!token) {

        window.location.href =
            "login.html";


        return;

    }


    if (!validatePoll()) {
        return;
    }


    if (!API_BASE) {

        alert(
            "API configuration is missing."
        );


        console.error(
            "API_BASE_URL is not defined."
        );


        return;

    }


    publishing =
        true;


    publishBtn.disabled =
        true;


    publishTopBtn.disabled =
        true;


    if (statusCard) {

        statusCard.style.display =
            "block";

    }


    if (statusTitle) {

        statusTitle.textContent =
            "Publishing poll...";

    }


    if (statusText) {

        statusText.textContent =
            "Preparing your choices.";

    }


    setProgress(
        0
    );


    try {

        const formData =
            new FormData();


        formData.append(
            "question",
            question.value.trim()
        );


        formData.append(
            "category",
            category.value
        );


        const options =
            [
                ...document.querySelectorAll(
                    ".poll-option-builder"
                ),
            ];


        const captions =
            options.map(
                option =>
                    option
                        .querySelector(
                            ".option-caption"
                        )
                        .value
                        .trim()
            );


        formData.append(
            "captions",
            JSON.stringify(
                captions
            )
        );


        options.forEach(
            option => {

                const file =
                    option
                        .querySelector(
                            ".media-input"
                        )
                        .files
                        ?.[0];


                if (file) {

                    formData.append(
                        "media",
                        file,
                        file.name
                    );

                }

            }
        );


        await uploadPoll(
            formData,
            token
        );


        setProgress(
            100
        );


        if (statusTitle) {

            statusTitle.textContent =
                "Poll published";

        }


        if (statusText) {

            statusText.textContent =
                "Your poll is now live.";

        }


        setTimeout(
            () => {

                window.location.href =
                    "poll.html";

            },
            800
        );

    }

    catch (error) {

        console.error(
            "Poll publish error:",
            error
        );


        if (statusTitle) {

            statusTitle.textContent =
                "Publishing failed";

        }


        if (statusText) {

            statusText.textContent =
                error?.message ||
                "Something went wrong.";

        }


        publishBtn.disabled =
            false;


        publishTopBtn.disabled =
            false;


        publishing =
            false;

    }

}


/* ==========================================
   XHR UPLOAD
========================================== */

function uploadPoll(
    formData,
    token
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const xhr =
                new XMLHttpRequest();


            xhr.open(
                "POST",
                `${API_BASE}/polls`
            );


            xhr.setRequestHeader(
                "Authorization",
                `Bearer ${token}`
            );


            xhr.upload.onprogress =
                event => {

                    if (
                        !event.lengthComputable
                    ) {

                        return;

                    }


                    const percent =
                        (
                            event.loaded /
                            event.total
                        ) * 100;


                    setProgress(
                        percent
                    );


                    if (statusText) {

                        statusText.textContent =
                            `Uploading ${Math.round(percent)}%`;

                    }

                };


            xhr.onload =
                () => {

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        resolve(
                            xhr.responseText
                        );


                        return;

                    }


                    let message =
                        "Unable to publish poll.";


                    try {

                        const response =
                            JSON.parse(
                                xhr.responseText
                            );


                        if (
                            response?.message
                        ) {

                            message =
                                Array.isArray(
                                    response.message
                                )
                                    ? response.message.join(
                                        ", "
                                    )
                                    : response.message;

                        }

                    }

                    catch {}


                    reject(
                        new Error(
                            message
                        )
                    );

                };


            xhr.onerror =
                () => {

                    reject(
                        new Error(
                            "Network error while publishing poll."
                        )
                    );

                };


            xhr.onabort =
                () => {

                    reject(
                        new Error(
                            "Poll upload was cancelled."
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
   EVENTS
========================================== */

addOptionBtn?.addEventListener(
    "click",
    addOption
);


publishBtn?.addEventListener(
    "click",
    publishPoll
);


publishTopBtn?.addEventListener(
    "click",
    publishPoll
);


backBtn?.addEventListener(
    "click",
    () => {

        if (
            window.history.length >
            1
        ) {

            window.history.back();

        }

        else {

            window.location.href =
                "poll.html";

        }

    }
);


/* ==========================================
   INITIALIZE
========================================== */

function initialize() {

    if (!getToken()) {

        /*
         * Do not immediately redirect while
         * developing if the page is opened
         * directly. The publish action itself
         * will still enforce authentication.
         *
         * If you prefer strict authentication,
         * uncomment the redirect below.
         */

        // window.location.href = "login.html";

    }


    /*
     * Start with exactly two choices.
     */

    addOption();

    addOption();


    updateOptionButton();

    updatePreview();

}


/* ==========================================
   PAGE LIFECYCLE
========================================== */

window.addEventListener(
    "beforeunload",
    cleanupObjectUrls
);


document.addEventListener(
    "DOMContentLoaded",
    initialize
);