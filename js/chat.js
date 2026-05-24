const token = localStorage.getItem("token");

const currentUser =
JSON.parse(localStorage.getItem("user"));

const currentUsername =
currentUser?.username;

const params =
new URLSearchParams(window.location.search);

const userId = params.get("user");

async function loadChat(){

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages/chat/${userId}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const messages = await res.json();

    console.log("CHAT DATA:", messages);

    document.getElementById(
      "chatUsername"
    ).innerText = userId;

    renderMessages(messages);

  }catch(err){

    console.error(err);

  }

}

function renderMessages(messages){

  const container =
  document.getElementById("chatMessages");

  if(!Array.isArray(messages)){

    console.log(messages);

    container.innerHTML =
    `<p>Error loading messages</p>`;

    return;

  }

  container.innerHTML = messages.map(msg => `

    <div class="
      message-bubble
      ${
        msg.senderUsername === currentUsername
        ? 'mine'
        : 'theirs'
      }
    ">

      ${msg.text || ''}

    </div>

  `).join("");

  container.scrollTop =
  container.scrollHeight;

}

async function sendMessage(){

  const input =
  document.getElementById("chatInput");

  const text =
  input.value.trim();

  if(!text) return;

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${token}`
        },

        body:JSON.stringify({
          receiverUsername:userId,
          text
        })
      }
    );

    const data = await res.json();

    console.log("SEND RESULT:", data);

    input.value = "";

    await loadChat();

  }catch(err){

    console.error(err);

  }

}

loadChat();