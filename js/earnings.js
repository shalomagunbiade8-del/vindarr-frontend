const token = localStorage.getItem("token");

if(!token){
  window.location.href = "login.html";
}

let earningsData = [];
let totalEarnings = 0;
let walletBalance = 0;
let withdrawals = [];

loadEarnings();
loadWallet();
loadBankDetails();
loadWithdrawals();

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

document
  .getElementById("withdrawBtn")
  .addEventListener(
    "click",
    async () => {

      const amount =
        prompt(
          "Enter withdrawal amount"
        );

      if (!amount) return;

      try {

        const res =
          await fetch(
            `${API_BASE_URL}/payouts/withdraw`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                amount:
                  Number(amount),
              }),
            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          alert(
            data.message ||
            "Withdrawal failed"
          );

          return;
        }

        alert(
          "Withdrawal request submitted"
        );

        loadWallet();
        loadWithdrawals();

      } catch (err) {

        alert(
          "Withdrawal failed"
        );

      }

    }
);

async function loadWallet(){

  const res =
    await fetch(
      `${API_BASE_URL}/wallets/me`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

  const data =
    await res.json();

  walletBalance =
    data.balance || 0;

  document.getElementById(
    "walletBalance"
  ).innerText =
    `₦${Number(walletBalance)
      .toLocaleString()}`;

}

async function loadBankDetails(){

  const res =
    await fetch(
      `${API_BASE_URL}/users/bank-details`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

  const user =
    await res.json();

  document.getElementById(
    "bankName"
  ).value =
    user.bankName || "";

  document.getElementById(
    "accountNumber"
  ).value =
    user.accountNumber || "";

  document.getElementById(
    "accountName"
  ).value =
    user.accountName || "";

}

async function loadWithdrawals(){

  const res =
    await fetch(
      `${API_BASE_URL}/withdrawals/me`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

  withdrawals =
    await res.json();

  renderWithdrawals();

}

function renderWithdrawals(){

  const container =
    document.getElementById(
      "withdrawalHistory"
    );

  if(!withdrawals.length){

    container.innerHTML =
      "<p>No withdrawals yet</p>";

    return;

  }

  container.innerHTML =
    withdrawals.map(w => `

      <div class="transaction-card">

        <div>

          ₦${Number(w.amount)
            .toLocaleString()}

        </div>

        <div>

          ${w.status}

        </div>

      </div>

    `).join("");

}

document
  .getElementById("saveBankBtn")
  .addEventListener(
    "click",
  async (e) => {

    if(
      e.target.id !==
      "saveBankBtn"
    ) return;

    const bankName =
      document.getElementById(
        "bankName"
      ).value;

    const accountNumber =
      document.getElementById(
        "accountNumber"
      ).value;

    const accountName =
      document.getElementById(
        "accountName"
      ).value;

    const res =
      await fetch(
        `${API_BASE_URL}/users/bank-details`,
        {
          method:"PATCH",

          headers:{
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body:JSON.stringify({

            bankName,
            accountNumber,
            accountName,

          }),
        }
      );

    if(res.ok){

      alert(
        "Bank details saved"
      );

    }

  }
);