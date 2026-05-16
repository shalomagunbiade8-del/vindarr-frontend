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

  inbox.innerHTML = chats.map(chat => `

    <div
      class="inbox-card"
      onclick="openChat('${chat.user.id}')"
    >

      <img
        src="${
          chat.user.avatar
          ? API_BASE_URL + chat.user.avatar
          : 'https://i.pravatar.cc/100'
        }"
      >

      <div class="inbox-content">

        <h4>${chat.user.username}</h4>

        <p>
          ${chat.lastMessage || "Start conversation"}
        </p>

      </div>

    </div>

  `).join("");

}

function openChat(userId){

  window.location.href =
  `chat.html?user=${userId}`;

}

loadInbox();