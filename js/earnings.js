const token = localStorage.getItem("token");

if(!token){
  window.location.href = "login.html";
}

let earningsData = [];
let totalEarnings = 0;

loadEarnings();

async function loadEarnings(){

  try{

    const res = await fetch(`${API_BASE_URL}/earnings/me`,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    });

    const data = await res.json();

    earningsData =
      data.transactions || [];

    totalEarnings =
      data.totalEarnings || 0;

    renderEarnings();

  }catch(err){

    console.error(err);

    document.getElementById("transactions").innerHTML = `
      <div class="earnings-empty">
        Failed to load earnings
      </div>
    `;

  }

}

function renderEarnings(){

  document.getElementById("earningsAmount").innerText =
    `₦${Number(totalEarnings).toLocaleString()}`;

  const container =
    document.getElementById("transactions");

  if(!earningsData.length){

    container.innerHTML = `
      <div class="earnings-empty">

        <h3>No earnings yet</h3>

        <p>
          Start selling ebooks and products
          to earn on Vindarr.
        </p>

        <a href="publish.html" class="earn-btn">
          Upload Content
        </a>

      </div>
    `;

    return;
  }

  container.innerHTML =
    earningsData.map(item => `

      <div class="transaction-card">

        <div class="transaction-left">

          <div class="transaction-icon">

            ${
              item.type === "ebook"
              ? "📚"
              : item.type === "fashion"
              ? "🛍️"
              : "🎥"
            }

          </div>

          <div>

            <h4>
              ${item.title || "Content Sale"}
            </h4>

            <p>
              ${formatDate(item.createdAt)}
            </p>

          </div>

        </div>

        <div class="transaction-right">

          +₦${Number(item.amount || 0).toLocaleString()}

        </div>

      </div>

    `).join("");

}

function formatDate(date){

  if(!date) return "";

  return new Date(date)
    .toLocaleDateString("en-NG",{
      day:"numeric",
      month:"short",
      year:"numeric"
    });

}