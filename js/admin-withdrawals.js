const user =
  JSON.parse(
    localStorage.getItem(
      "user"
    )
  );

if(
  !user ||
  user.role !== "admin"
){

  window.location.href =
    "index.html";

}

const token =
  localStorage.getItem(
    "token"
  );

if (!token) {

  window.location.href =
    "login.html";

}

let withdrawals = [];

loadWithdrawals();

async function loadWithdrawals(){

  try{

    const res =
      await fetch(
        `${API_BASE_URL}/withdrawals/pending`,
        {
          headers:{
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    if(!res.ok){

      alert(
        "Admin access required"
      );

      return;

    }

    withdrawals =
      await res.json();

    renderWithdrawals();

  }catch(err){

    console.error(err);

  }

}

function renderWithdrawals(){

  document.getElementById(
    "pendingCount"
  ).innerText =
    withdrawals.length;

  const container =
    document.getElementById(
      "withdrawalsContainer"
    );

  if(!withdrawals.length){

    container.innerHTML = `

      <div class="earnings-empty">

        <h3>
          No pending withdrawals
        </h3>

      </div>

    `;

    return;

  }

  container.innerHTML =
    withdrawals.map(w => `

      <div
        class="transaction-card"
      >

        <div>

          <h3>

            ₦${Number(w.amount)
              .toLocaleString()}

          </h3>

          <p>
            User ID:
            ${w.userId}
          </p>

          <p>
            ${w.bankName}
          </p>

          <p>
            ${w.accountNumber}
          </p>

          <p>
            ${w.accountName}
          </p>

          <p>

            ${new Date(
              w.createdAt
            ).toLocaleDateString()}

          </p>

        </div>

        <button

          class="earn-btn"

          onclick="
            markPaid(
              ${w.id}
            )
          "

        >

          Mark Paid

        </button>

      </div>

    `).join("");

}

async function markPaid(id){

  const confirmPay =
    confirm(
      "Confirm payment sent?"
    );

  if(!confirmPay)
    return;

  try{

    const res =
      await fetch(

        `${API_BASE_URL}/withdrawals/${id}/pay`,

        {

          method:"PATCH",

          headers:{
            Authorization:
              `Bearer ${token}`
          }

        }

      );

    const data =
      await res.json();

    if(!res.ok){

      alert(
        data.message ||
        "Failed"
      );

      return;

    }

    alert(
      "Withdrawal marked paid"
    );

    loadWithdrawals();

  }catch(err){

    console.error(err);

  }

}