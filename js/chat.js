const token = localStorage.getItem("token");

const params =
new URLSearchParams(window.location.search);

const userId = params.get("user");

let receiver = null;

async function loadChat(){

  try{

    const res = await fetch(
      `${API_BASE_URL}/messages/${userId}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    receiver = data.user;

    document.getElementById(
      "chatUsername"
    ).innerText =
    receiver.username;

    document.getElementById(
      "chatAvatar"
    ).src =
    receiver.avatar
    ? API_BASE_URL + receiver.avatar
    : "https://i.pravatar.cc/100";

    renderMessages(data.messages);

  }catch(err){

    console.error(err);

  }

}

function renderMessages(messages){

  const container =
  document.getElementById("chatMessages");

  container.innerHTML = messages.map(msg => `

    <div class="
      message-bubble
      ${msg.isMine ? 'mine' : 'theirs'}
    ">

      ${msg.text}

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
          receiverId:userId,
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