const token = localStorage.getItem("token");

const currentUser =
JSON.parse(localStorage.getItem("user"));

const currentUsername =
currentUser?.username;

async function loadInbox(){

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages/inbox`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const chats = await res.json();

    console.log("INBOX:", chats);

    renderInbox(chats);

  }catch(err){

    console.error(err);

  }

}

function renderInbox(chats){

  const inbox =
  document.getElementById("inboxList");

  if(!Array.isArray(chats)){

    inbox.innerHTML =
    `<p>Failed to load inbox</p>`;

    return;

  }

  if(!chats.length){

    inbox.innerHTML = `
      <div class="empty-state">
        No conversations yet
      </div>
    `;

    return;
  }

  inbox.innerHTML = chats.map(chat => {

    const otherUser =
      chat.senderUsername === currentUsername
      ? chat.receiverUsername
      : chat.senderUsername;

    return `

      <div
        class="inbox-card"
        onclick="openChat('${otherUser}')"
      >

        <img
          src="https://i.pravatar.cc/100"
        >

        <div class="inbox-content">

          <h4>${otherUser}</h4>

          <p>
            ${chat.text || "Attachment"}
          </p>

        </div>

      </div>

    `;

  }).join("");

}

function openChat(userId){

  window.location.href =
  `chat.html?user=${userId}`;

}

loadInbox();