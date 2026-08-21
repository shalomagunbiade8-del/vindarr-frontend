// ===============================
// EARNINGS
// ===============================

const token =
  localStorage.getItem("token");

if (!token) {

  window.location.href =
    "login.html";

}


let earningsData = [];
let totalEarnings = 0;
let walletBalance = 0;
let withdrawals = [];


// ===============================
// INIT
// ===============================

loadEarnings();
loadWallet();
loadBankDetails();
loadWithdrawals();


// ===============================
// LOAD EARNINGS
// ===============================

async function loadEarnings() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/earnings/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      throw new Error(
        data.message ||
        "Failed to load earnings"
      );

    }

    earningsData =
      data.transactions || [];

    totalEarnings =
      Number(
        data.totalEarnings || 0
      );

    renderEarnings();

  }

  catch (err) {

    console.error(err);

    const container =
      document.getElementById(
        "transactions"
      );

    if (container) {

      container.innerHTML = `
        <div class="earnings-empty compact-empty">

          <i class="bi bi-exclamation-circle"></i>

          <h3>
            Unable to load earnings
          </h3>

          <p>
            Please try again later.
          </p>

        </div>
      `;

    }

  }

}


// ===============================
// RENDER EARNINGS
// ===============================

function renderEarnings() {

  const amount =
    document.getElementById(
      "earningsAmount"
    );

  if (amount) {

    amount.innerText =
      `₦${Number(
        totalEarnings
      ).toLocaleString()}`;

  }


  const container =
    document.getElementById(
      "transactions"
    );

  if (!container) return;


  if (!earningsData.length) {

    container.innerHTML = `

      <div class="earnings-empty">

        <div class="empty-finance-icon">

          <i class="bi bi-bar-chart"></i>

        </div>

        <h3>
          No earnings yet
        </h3>

        <p>
          Start selling ebooks and products
          to begin earning on Vindarr.
        </p>

        <a
          href="publish.html"
          class="empty-action">

          Upload content

          <i class="bi bi-arrow-right"></i>

        </a>

      </div>

    `;

    return;

  }


  container.innerHTML =
    earningsData.map(
      item => `

      <div class="transaction-card">

        <div class="transaction-left">

          <div class="transaction-icon">

            ${
              item.type === "ebook"
                ? `<i class="bi bi-book"></i>`
                : item.type === "fashion"
                ? `<i class="bi bi-bag"></i>`
                : `<i class="bi bi-play-btn"></i>`
            }

          </div>


          <div class="transaction-details">

            <h4>
              ${escapeEarningsHtml(
                item.title ||
                "Content Sale"
              )}
            </h4>

            <p>

              ${
                item.type
                  ? item.type
                  : "Sale"
              }

              <span>•</span>

              ${formatDate(
                item.createdAt
              )}

            </p>

          </div>

        </div>


        <div class="transaction-right">

          +₦${Number(
            item.amount || 0
          ).toLocaleString()}

        </div>

      </div>

    `
    ).join("");

}


// ===============================
// DATE
// ===============================

function formatDate(date) {

  if (!date) return "";

  try {

    return new Date(date)
      .toLocaleDateString(
        "en-NG",
        {
          day: "numeric",
          month: "short",
          year: "numeric"
        }
      );

  }

  catch {

    return "";

  }

}


// ===============================
// WITHDRAW
// ===============================

document
  .getElementById("withdrawBtn")
  ?.addEventListener(
    "click",
    async () => {

      const amount =
        prompt(
          "Enter withdrawal amount"
        );


      if (!amount) return;


      const numericAmount =
        Number(amount);


      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {

        alert(
          "Enter a valid amount"
        );

        return;

      }


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
                  `Bearer ${token}`
              },

              body:
                JSON.stringify({
                  amount:
                    numericAmount
                })
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

      }

      catch (err) {

        console.error(err);

        alert(
          "Withdrawal failed"
        );

      }

    }
  );


// ===============================
// WALLET
// ===============================

async function loadWallet() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/wallets/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await res.json();


    if (!res.ok) return;


    walletBalance =
      Number(
        data.balance || 0
      );


    const element =
      document.getElementById(
        "walletBalance"
      );


    if (element) {

      element.innerText =
        `₦${walletBalance
          .toLocaleString()}`;

    }

  }

  catch (err) {

    console.error(err);

  }

}


// ===============================
// BANK DETAILS
// ===============================

async function loadBankDetails() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/users/bank-details`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const user =
      await res.json();


    if (!res.ok) return;


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

  catch (err) {

    console.error(err);

  }

}


// ===============================
// WITHDRAWALS
// ===============================

async function loadWithdrawals() {

  try {

    const res =
      await fetch(
        `${API_BASE_URL}/withdrawals/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await res.json();


    if (!res.ok) return;


    withdrawals =
      data || [];


    renderWithdrawals();

  }

  catch (err) {

    console.error(err);

  }

}


// ===============================
// RENDER WITHDRAWALS
// ===============================

function renderWithdrawals() {

  const container =
    document.getElementById(
      "withdrawalHistory"
    );


  if (!container) return;


  if (!withdrawals.length) {

    container.innerHTML = `

      <div class="earnings-empty compact-empty">

        <i class="bi bi-wallet2"></i>

        <h3>
          No withdrawals yet
        </h3>

        <p>
          Your payout history will appear here.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    withdrawals.map(
      withdrawal => {

        const status =
          String(
            withdrawal.status ||
            "pending"
          ).toLowerCase();


        return `

          <div class="transaction-card withdrawal-card">

            <div class="transaction-left">

              <div class="transaction-icon withdrawal-icon">

                <i class="bi bi-arrow-up-right"></i>

              </div>


              <div class="transaction-details">

                <h4>
                  Withdrawal
                </h4>

                <p>

                  ${formatDate(
                    withdrawal.createdAt
                  )}

                </p>

              </div>

            </div>


            <div class="withdrawal-right">

              <strong>
                ₦${Number(
                  withdrawal.amount || 0
                ).toLocaleString()}
              </strong>

              <span class="
                withdrawal-status
                status-${status}
              ">

                ${status}

              </span>

            </div>

          </div>

        `;

      }
    ).join("");

}


// ===============================
// SAVE BANK DETAILS
// ===============================

document
  .getElementById("saveBankBtn")
  ?.addEventListener(
    "click",
    async () => {

      const bankName =
        document.getElementById(
          "bankName"
        ).value.trim();


      const accountNumber =
        document.getElementById(
          "accountNumber"
        ).value.trim();


      const accountName =
        document.getElementById(
          "accountName"
        ).value.trim();


      if (
        !bankName ||
        !accountNumber ||
        !accountName
      ) {

        alert(
          "Please complete all bank details"
        );

        return;

      }


      try {

        const res =
          await fetch(
            `${API_BASE_URL}/users/bank-details`,
            {
              method: "PATCH",

              headers: {

                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`

              },

              body:
                JSON.stringify({

                  bankName,
                  accountNumber,
                  accountName

                })

            }
          );


        const data =
          await res.json();


        if (res.ok) {

          alert(
            "Bank details saved"
          );

        }

        else {

          alert(
            data.message ||
            "Unable to save bank details"
          );

        }

      }

      catch (err) {

        console.error(err);

        alert(
          "Network error"
        );

      }

    }
  );


// ===============================
// HTML ESCAPE
// ===============================

function escapeEarningsHtml(value) {

  return String(
    value ?? ""
  )
  .replace(
    /&/g,
    "&amp;"
  )
  .replace(
    /</g,
    "&lt;"
  )
  .replace(
    />/g,
    "&gt;"
  )
  .replace(
    /"/g,
    "&quot;"
  )
  .replace(
    /'/g,
    "&#039;"
  );

}