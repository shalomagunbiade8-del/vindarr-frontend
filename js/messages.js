const token = localStorage.getItem("token");

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

    renderInbox(chats);

  }catch(err){

    console.error(err);

  }

}

function renderInbox(chats){

  const inbox =
  document.getElementById("inboxList");

  if(!chats.length){

    inbox.innerHTML = `
      <div class="empty-state">
        No conversations yet
      </div>
    `;

    return;
  }

  const currentUsername =
    localStorage.getItem("username");

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