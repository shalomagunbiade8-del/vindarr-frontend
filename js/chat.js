console.log("CHAT JS LOADED");

const token = localStorage.getItem("token");

const currentUser =
JSON.parse(localStorage.getItem("user"));

const currentUsername =
currentUser?.username;

const params =
new URLSearchParams(window.location.search);

const receiverUsername =
params.get("user");

const chatContainer =
document.getElementById("chatMessages");

const input =
document.getElementById("chatInput");

const sendBtn =
document.getElementById("sendBtn");

document.getElementById(
  "chatUsername"
).innerText = receiverUsername;


// ===============================
// LOAD CHAT
// ===============================

async function loadChat(){

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages/chat/${receiverUsername}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const messages =
    await res.json();

    console.log("CHAT:", messages);

    renderMessages(messages);

  }catch(err){

    console.error(err);

  }

}


// ===============================
// RENDER MESSAGES
// ===============================

function renderMessages(messages){

  if(!Array.isArray(messages)){

    chatContainer.innerHTML =
    `<p>Failed to load messages</p>`;

    return;

  }

  chatContainer.innerHTML =
  messages.map(msg => `

    <div class="
      message-bubble
      ${
        msg.senderUsername === currentUsername
        ? "mine"
        : "theirs"
      }
    ">

      ${msg.text || ""}

    </div>

  `).join("");

  chatContainer.scrollTop =
  chatContainer.scrollHeight;

}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage(){

  const text =
  input.value.trim();

  if(!text) return;

  const payload = {
    receiverUsername,
    text
  };

  console.log("SENDING:", payload);

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body: JSON.stringify(payload)
      }
    );

    const data =
    await res.json();

    console.log("SEND RESPONSE:", data);

    if(!res.ok){

      alert(data.message || "Send failed");

      return;
    }

    input.value = "";

    await loadChat();

  }catch(err){

    console.error(err);

  }

}


// ===============================
// EVENTS
// ===============================

sendBtn.addEventListener(
  "click",
  sendMessage
);

input.addEventListener(
  "keypress",
  function(e){

    if(e.key === "Enter"){

      sendMessage();

    }

  }
);


// ===============================
// INIT
// ===============================

loadChat();