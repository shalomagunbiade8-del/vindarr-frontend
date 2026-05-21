const token = localStorage.getItem("token");

const params =
new URLSearchParams(window.location.search);

const userId = params.get("user");

let receiver = null;

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

    // SET USERNAME
    document.getElementById(
      "chatUsername"
    ).innerText = userId;

    renderMessages(messages);

  }catch(err){

    console.error(err);

  }

}

function renderMessages(messages){

  const currentUsername =
    localStorage.getItem("username");

  const container =
  document.getElementById("chatMessages");

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

  const text = input.value.trim();

  if(!text) return;

  try{

    await fetch(
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

    input.value = "";

    loadChat();

  }catch(err){

    console.error(err);

  }

}

loadChat();