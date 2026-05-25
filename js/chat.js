const token = localStorage.getItem("token");

const currentUser =
JSON.parse(localStorage.getItem("user"));

const currentUsername =
currentUser?.username;

const params =
new URLSearchParams(window.location.search);

const userId = params.get("user");

if(!token){
  window.location.href = "login.html";
}

// LOAD CHAT
async function loadChat(){

  try{

    console.log("LOADING CHAT WITH:", userId);

    const res = await fetch(
      `${API_BASE_URL}/messages/chat/${userId}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    console.log("CHAT STATUS:", res.status);

    if(!res.ok){

      const errText = await res.text();

      console.log("CHAT ERROR:", errText);

      document.getElementById(
        "chatMessages"
      ).innerHTML =
      `<p>Failed to load chat</p>`;

      return;
    }

    const messages = await res.json();

    console.log("CHAT DATA:", messages);

    document.getElementById(
      "chatUsername"
    ).innerText = userId;

    renderMessages(messages);

  }catch(err){

    console.error("LOAD CHAT ERROR:", err);

  }

}

// RENDER
function renderMessages(messages){

  const container =
  document.getElementById("chatMessages");

  if(!Array.isArray(messages)){

    console.log("NOT ARRAY:", messages);

    container.innerHTML =
    `<p>Error loading messages</p>`;

    return;

  }

  if(messages.length === 0){

    container.innerHTML =
    `<p class="empty-state">No messages yet</p>`;

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

// SEND
async function sendMessage(){

  const input =
  document.getElementById("chatInput");

  const text =
  input.value.trim();

  console.log("USER ID:", userId);
  console.log("TEXT:", text);

  if(!userId){

    alert("No receiver found");

    return;
  }

  if(!text){

    alert("Enter message");

    return;
  }

  const payload = {
    receiverUsername: userId,
    text: text
  };

  console.log("PAYLOAD:", payload);

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

    console.log("SEND STATUS:", res.status);

    const data = await res.json();

    console.log("SEND RESPONSE:", data);

    if(!res.ok){

      alert(data.message || "Send failed");

      return;
    }

    input.value = "";

    await loadChat();

  }catch(err){

    console.error("SEND ERROR:", err);

  }

}

loadChat();