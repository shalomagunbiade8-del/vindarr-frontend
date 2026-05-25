const token = localStorage.getItem("token");

const currentUser =
JSON.parse(localStorage.getItem("user"));

const currentUsername =
currentUser?.username;

if(!token){
  window.location.href = "login.html";
}

async function loadInbox(){

  try{

    console.log("LOADING INBOX");

    const res = await fetch(
      `${API_BASE_URL}/messages/inbox`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    console.log("INBOX STATUS:", res.status);

    if(!res.ok){

      const errText = await res.text();

      console.log("INBOX ERROR:", errText);

      document.getElementById(
        "inboxList"
      ).innerHTML =
      `<p>Failed to load inbox</p>`;

      return;
    }

    const chats = await res.json();

    console.log("INBOX DATA:", chats);

    renderInbox(chats);

  }catch(err){

    console.error("INBOX LOAD ERROR:", err);

  }

}

function renderInbox(chats){

  const inbox =
  document.getElementById("inboxList");

  if(!Array.isArray(chats)){

    inbox.innerHTML =
    `<p>Inbox failed</p>`;

    return;

  }

  if(chats.length === 0){

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