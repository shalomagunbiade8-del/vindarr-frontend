/* ==========================================
   VINDARR — CREATE POLL
========================================== */

const MAX_OPTIONS = 4;
const MIN_OPTIONS = 2;

let optionCount = 0;
let publishing = false;

const question =
    document.getElementById("question");

const questionCount =
    document.getElementById("questionCount");

const category =
    document.getElementById("category");

const optionsGrid =
    document.getElementById("optionsGrid");

const addOptionBtn =
    document.getElementById("addOptionBtn");

const preview =
    document.getElementById("pollPreview");

const publishBtn =
    document.getElementById("publishBtn");

const publishTopBtn =
    document.getElementById("publishTopBtn");

const backBtn =
    document.getElementById("backBtn");

const statusCard =
    document.getElementById("statusCard");

const statusTitle =
    document.getElementById("statusTitle");

const statusText =
    document.getElementById("statusText");

const progressBar =
    document.getElementById("progressBar");


/* ==========================================
   AUTH
========================================== */

function getToken() {
    return localStorage.getItem("token");
}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ==========================================
   ADD OPTION
========================================== */

function addOption() {

    if (optionCount >= MAX_OPTIONS) {

        alert(
            "A poll can have a maximum of 4 choices."
        );

        return;
    }

    optionCount++;

    const number =
        optionCount;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "poll-option-builder";

    wrapper.dataset.option =
        number;

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
                        aria-label="Remove option"
                    >
                        <i class="bi bi-x"></i>
                    </button>
                  `
                : ""
        }

        <div class="media-picker">

            <input
                type="file"
                class="media-input"
                accept="image/*,video/*"
            >

            <label class="media-picker-label">

                <i class="bi bi-image"></i>

                <strong>
                    Add media
                </strong>

                <span>
                    Image or video
                </span>

            </label>

            <div class="option-media-preview"></div>

        </div>

        <input
            type="text"
            class="option-caption"
            maxlength="200"
            placeholder="Choice caption..."
        >

    `;

    optionsGrid.appendChild(
        wrapper
    );

    const input =
        wrapper.querySelector(
            ".media-input"
        );

    input.addEventListener(
        "change",
        () => {

            handleMedia(
                wrapper,
                input.files[0]
            );

            updatePreview();

        }
    );

    const captionInput =
        wrapper.querySelector(
            ".option-caption"
        );

    captionInput.addEventListener(
        "input",
        updatePreview
    );

    const removeBtn =
        wrapper.querySelector(
            ".remove-option"
        );

    if (removeBtn) {

        removeBtn.addEventListener(
            "click",
            () => {

                wrapper.remove();

                renumberOptions();

                updatePreview();

            }
        );

    }

    updateOptionButton();

    updatePreview();
}


/* ==========================================
   MEDIA
========================================== */

function handleMedia(
    wrapper,
    file
) {

    if (!file) {
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

    const url =
        URL.createObjectURL(
            file
        );

    previewBox.innerHTML = "";

    if (
        file.type.startsWith(
            "video/"
        )
    ) {

        const video =
            document.createElement(
                "video"
            );

        video.src = url;

        video.muted = true;

        video.playsInline = true;

        video.controls = true;

        previewBox.appendChild(
            video
        );

    }

    else if (
        file.type.startsWith(
            "image/"
        )
    ) {

        const img =
            document.createElement(
                "img"
            );

        img.src = url;

        previewBox.appendChild(
            img
        );

    }

    else {

        alert(
            "Please choose an image or video."
        );

        return;
    }

    previewBox.style.display =
        "block";

    pickerLabel.style.display =
        "none";
}


/* ==========================================
   RENUMBER
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
                number;

            option.querySelector(
                ".option-number"
            ).textContent =
                number;

        }
    );

    updateOptionButton();
}


/* ==========================================
   OPTION BUTTON
========================================== */

function updateOptionButton() {

    addOptionBtn.disabled =
        optionCount >= MAX_OPTIONS;

    if (
        optionCount >= MAX_OPTIONS
    ) {

        addOptionBtn.textContent =
            "Maximum 4 choices";

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

        questionCount.textContent =
            `${question.value.length} / 300`;

        updatePreview();

    }
);


/* ==========================================
   PREVIEW
========================================== */

function updatePreview() {

    if (!preview) {
        return;
    }

    const questionText =
        question.value.trim() ||
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
                options.map(
                    (
                        option,
                        index
                    ) => {

                        const caption =
                            option.querySelector(
                                ".option-caption"
                            )?.value ||
                            `Choice ${index + 1}`;

                        const media =
                            option.querySelector(
                                ".media-input"
                            )?.files?.[0];

                        let mediaHtml = `
                            <div class="preview-media">
                                <div
                                    style="
                                        height:100%;
                                        display:grid;
                                        place-items:center;
                                        color:#777;
                                    "
                                >
                                    <i
                                        class="bi bi-image"
                                        style="
                                            font-size:28px;
                                            color:#d10000;
                                        "
                                    ></i>
                                </div>
                            </div>
                        `;

                        if (media) {

                            const url =
                                URL.createObjectURL(
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
                                        ></video>
                                    </div>
                                `;

                            }

                            else {

                                mediaHtml = `
                                    <div class="preview-media">
                                        <img
                                            src="${url}"
                                            alt=""
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
            }

        </div>
    `;
}


/* ==========================================
   VALIDATION
========================================== */

function validatePoll() {

    if (
        !question.value.trim()
    ) {

        alert(
            "Please enter a poll question."
        );

        question.focus();

        return false;
    }

    if (
        !category.value
    ) {

        alert(
            "Please choose a category."
        );

        category.focus();

        return false;
    }

    const options =
        [
            ...document.querySelectorAll(
                ".poll-option-builder"
            ),
        ];

    if (
        options.length < MIN_OPTIONS
    ) {

        alert(
            "Add at least 2 choices."
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
            option.querySelector(
                ".media-input"
            )?.files?.[0];

        const caption =
            option.querySelector(
                ".option-caption"
            )?.value.trim();

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

    const percent =
        Math.max(
            0,
            Math.min(
                100,
                Math.round(value)
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

    publishing = true;

    publishBtn.disabled =
        true;

    publishTopBtn.disabled =
        true;

    statusCard.style.display =
        "block";

    statusTitle.textContent =
        "Publishing poll...";

    statusText.textContent =
        "Preparing your choices.";

    setProgress(0);

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
                    option.querySelector(
                        ".option-caption"
                    ).value.trim()
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
                    option.querySelector(
                        ".media-input"
                    ).files[0];

                formData.append(
                    "media",
                    file,
                    file.name
                );

            }
        );

        await new Promise(
            (
                resolve,
                reject
            ) => {

                const xhr =
                    new XMLHttpRequest();

                xhr.open(
                    "POST",
                    `${API_BASE_URL}/polls`
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

                        statusText.textContent =
                            `Uploading ${Math.round(percent)}%`;

                    };

                xhr.onload = () => {

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {

                        resolve();

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

                xhr.send(
                    formData
                );

            }
        );

        setProgress(100);

        statusTitle.textContent =
            "Poll published";

        statusText.textContent =
            "Your poll is now live.";

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

        statusTitle.textContent =
            "Publishing failed";

        statusText.textContent =
            error.message ||
            "Something went wrong.";

        publishBtn.disabled =
            false;

        publishTopBtn.disabled =
            false;

        publishing = false;
    }
}


/* ==========================================
   EVENTS
========================================== */

addOptionBtn.addEventListener(
    "click",
    addOption
);

publishBtn.addEventListener(
    "click",
    publishPoll
);

publishTopBtn.addEventListener(
    "click",
    publishPoll
);

backBtn.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


/* ==========================================
   INITIALIZE
========================================== */

addOption();
addOption();
updatePreview();