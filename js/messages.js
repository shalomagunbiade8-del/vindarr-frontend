console.log(
    "VINDARR MESSAGES JS LOADED"
);


/* ==========================================
   AUTH
========================================== */

const token =
    localStorage.getItem("token");


const currentUser =
    JSON.parse(
        localStorage.getItem("user") || "null"
    );


const currentUsername =
    currentUser?.username;


if (!token) {

    window.location.href =
        "login.html";

}


/* ==========================================
   ELEMENTS
========================================== */

const inboxList =
    document.getElementById(
        "inboxList"
    );


const searchInput =
    document.getElementById(
        "messageSearch"
    );


/* ==========================================
   STATE
========================================== */

let conversations = [];


/* ==========================================
   ESCAPE
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
   LOAD INBOX
========================================== */

async function loadInbox() {

    try {

        inboxList.innerHTML = `
            <div class="inbox-loading">

                <div class="loading-spinner"></div>

                Loading conversations...

            </div>
        `;


        const response =
            await fetch(
                `${API_BASE_URL}/messages/inbox`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load inbox."
            );

        }


        const data =
            await response.json();


        conversations =
            Array.isArray(data)
                ? data
                : [];


        renderInbox(
            conversations
        );


    }
    catch (error) {

        console.error(
            "INBOX ERROR:",
            error
        );


        inboxList.innerHTML = `
            <div class="inbox-empty">

                <i
                    class="bi bi-exclamation-circle"
                    style="
                        font-size:32px;
                        color:#d10000;
                    "
                ></i>

                Unable to load messages.

            </div>
        `;

    }

}


/* ==========================================
   RENDER
========================================== */

function renderInbox(
    list
) {

    if (!list.length) {

        inboxList.innerHTML = `
            <div class="inbox-empty">

                <i
                    class="bi bi-chat-heart"
                    style="
                        font-size:36px;
                        color:#d10000;
                    "
                ></i>

                <strong>
                    No conversations yet
                </strong>

                <span>
                    Start a conversation from a user's profile.
                </span>

            </div>
        `;

        return;

    }


    inboxList.innerHTML =
        list
            .map(
                chat => {

                    const otherUser =
                        chat.senderUsername ===
                        currentUsername

                            ? chat.receiverUsername

                            : chat.senderUsername;


                    const preview =
                        chat.text ||
                        (
                            chat.attachmentType?.startsWith(
                                "image/"
                            )
                                ? "Photo"
                                : "Attachment"
                        );


                    const time =
                        chat.createdAt
                            ? new Date(
                                chat.createdAt
                              ).toLocaleDateString(
                                [],
                                {
                                    month:
                                        "short",

                                    day:
                                        "numeric"
                                }
                              )
                            : "";


                    return `

                        <div
                            class="inbox-card"
                            data-user="${escapeHtml(otherUser)}"
                        >

                            <img
                                class="inbox-avatar"
                                src="https://i.pravatar.cc/100?u=${encodeURIComponent(otherUser)}"
                                alt=""
                            >


                            <div class="inbox-content">

                                <div class="inbox-top">

                                    <h4>
                                        ${escapeHtml(otherUser)}
                                    </h4>

                                    <span class="inbox-time">
                                        ${time}
                                    </span>

                                </div>


                                <p>
                                    ${escapeHtml(preview)}
                                </p>

                            </div>


                            <i class="bi bi-chevron-right inbox-arrow"></i>

                        </div>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".inbox-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const user =
                            card.dataset.user;


                        window.location.href =
                            `chat.html?user=${encodeURIComponent(user)}`;

                    }
                );

            }
        );

}


/* ==========================================
   SEARCH
========================================== */

searchInput?.addEventListener(
    "input",
    () => {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();


        if (!query) {

            renderInbox(
                conversations
            );

            return;

        }


        const filtered =
            conversations.filter(
                chat => {

                    const otherUser =
                        chat.senderUsername ===
                        currentUsername

                            ? chat.receiverUsername

                            : chat.senderUsername;


                    const text =
                        chat.text || "";


                    return (

                        otherUser
                            ?.toLowerCase()
                            .includes(query)

                        ||

                        text
                            .toLowerCase()
                            .includes(query)

                    );

                }
            );


        renderInbox(
            filtered
        );

    }
);


/* ==========================================
   INIT
========================================== */

loadInbox();