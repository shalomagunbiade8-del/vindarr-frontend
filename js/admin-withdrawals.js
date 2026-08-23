// =====================================
// VINDARR ADMIN DASHBOARD
// =====================================

(function () {

  "use strict";


  // =====================================
  // AUTHENTICATION
  // =====================================

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const token =
    localStorage.getItem("token");


  if (!token) {

    window.location.href =
      "login.html";

    return;

  }


  if (
    !user ||
    user.role !== "admin"
  ) {

    window.location.href =
      "index.html";

    return;

  }


  // =====================================
  // STATE
  // =====================================

  let withdrawals = [];

  let selectedWithdrawalId = null;


  // =====================================
  // DOM HELPERS
  // =====================================

  const $ = (id) =>
    document.getElementById(id);


  // =====================================
  // INIT
  // =====================================

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      setDashboardDate();

      bindEvents();

      loadDashboard();

    }
  );


  // =====================================
  // EVENTS
  // =====================================

  function bindEvents() {

    $("refreshBtn")
      ?.addEventListener(
        "click",
        loadDashboard
      );


    $("retryBtn")
      ?.addEventListener(
        "click",
        loadDashboard
      );


    $("logoutBtn")
      ?.addEventListener(
        "click",
        logout
      );


    $("cancelPaymentBtn")
      ?.addEventListener(
        "click",
        closeConfirmModal
      );


    $("confirmPaymentBtn")
      ?.addEventListener(
        "click",
        confirmPayment
      );


    $("confirmModal")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("confirmModal")
          ) {

            closeConfirmModal();

          }

        }
      );

  }


  // =====================================
  // DATE
  // =====================================

  function setDashboardDate() {

    const date =
      new Date();

    $("dashboardDate").innerText =
      date.toLocaleDateString(
        "en-NG",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

  }


  // =====================================
  // LOAD DASHBOARD
  // =====================================

  async function loadDashboard() {

    setRefreshing(true);

    hideError();

    try {

      const [
        stats,
        pending
      ] =
        await Promise.all([

          fetchDashboardStats(),

          fetchPendingWithdrawals(),

        ]);


      renderStats(stats);

      withdrawals =
        Array.isArray(pending)
          ? pending
          : [];


      renderWithdrawals();

    }
    catch (error) {

      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      showError(
        error.message ||
        "Unable to load dashboard."
      );

    }
    finally {

      setRefreshing(false);

    }

  }


  // =====================================
  // DASHBOARD STATS
  // =====================================

  async function fetchDashboardStats() {

    const res =
      await fetch(
        `${API_BASE_URL}/admin/stats`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },
        }
      );


    const data =
      await readResponse(res);


    if (!res.ok) {

      throw new Error(
        data?.message ||
        "Failed to load admin statistics."
      );

    }


    return data;

  }


  // =====================================
  // PENDING WITHDRAWALS
  // =====================================

  async function fetchPendingWithdrawals() {

    const res =
      await fetch(
        `${API_BASE_URL}/withdrawals/pending`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },
        }
      );


    const data =
      await readResponse(res);


    if (!res.ok) {

      throw new Error(
        data?.message ||
        "Failed to load withdrawals."
      );

    }


    return data;

  }


  // =====================================
  // RENDER STATS
  // =====================================

  function renderStats(data) {

    if (!data)
      return;


    const users =
      data.users || {};

    const content =
      data.content || {};

    const sales =
      data.sales || {};

    const withdrawalStats =
      data.withdrawals || {};


    // =====================================
    // USERS
    // =====================================

    setText(
      "totalUsers",
      formatNumber(
        users.total
      )
    );


    setText(
      "newToday",
      formatNumber(
        users.newToday
      )
    );


    setText(
      "newThisWeek",
      formatNumber(
        users.newThisWeek
      )
    );


    setText(
      "newThisMonth",
      formatNumber(
        users.newThisMonth
      )
    );


    // =====================================
    // CONTENT
    // =====================================

    setText(
      "totalContent",
      formatNumber(
        content.total
      )
    );


    setText(
      "totalVideos",
      formatNumber(
        content.videos
      )
    );


    setText(
      "totalEbooks",
      formatNumber(
        content.ebooks
      )
    );


    setText(
      "totalFashion",
      formatNumber(
        content.fashion
      )
    );


    setText(
      "totalEssentials",
      formatNumber(
        content.essentials
      )
    );


    // =====================================
    // SALES
    // =====================================

    const totalSales =
      Number(
        sales.totalSales || 0
      );


    const platformRevenue =
      Number(
        sales.platformRevenue || 0
      );


    const creatorRevenue =
      Number(
        sales.creatorRevenue || 0
      );


    setText(
      "totalSales",
      formatCurrency(
        totalSales
      )
    );


    setText(
      "platformRevenue",
      formatCurrency(
        platformRevenue
      )
    );


    setText(
      "creatorRevenue",
      formatCurrency(
        creatorRevenue
      )
    );


    setText(
      "commercePlatformRevenue",
      formatCurrency(
        platformRevenue
      )
    );


    setText(
      "commerceCreatorRevenue",
      formatCurrency(
        creatorRevenue
      )
    );


    setText(
      "totalOrders",
      formatNumber(
        sales.orders
      )
    );


    // =====================================
    // WITHDRAWALS
    // =====================================

    setText(
      "pendingCount",
      formatNumber(
        withdrawalStats.pendingCount
      )
    );


    setText(
      "pendingAmount",
      formatCurrency(
        withdrawalStats.pendingAmount
      )
    );


    setText(
      "paidAmount",
      formatCurrency(
        withdrawalStats.paidAmount
      )
    );

  }


  // =====================================
  // WITHDRAWALS RENDER
  // =====================================

  function renderWithdrawals() {

    const container =
      $("withdrawalsContainer");


    if (!container)
      return;


    if (!withdrawals.length) {

      container.innerHTML = `

        <div class="withdrawals-empty">

          <div class="empty-icon">

            <i class="bi bi-check2-circle"></i>

          </div>

          <h3>
            No pending withdrawals
          </h3>

          <p>
            All withdrawal requests have been handled.
          </p>

        </div>

      `;

      return;

    }


    container.innerHTML =
      withdrawals
        .map(
          renderWithdrawal
        )
        .join("");

  }


  // =====================================
  // SINGLE WITHDRAWAL
  // =====================================

  function renderWithdrawal(
    withdrawal
  ) {

    const amount =
      Number(
        withdrawal.amount || 0
      );


    const date =
      withdrawal.createdAt
        ? new Date(
            withdrawal.createdAt
          ).toLocaleString(
            "en-NG",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )
        : "—";


    return `

      <article
        class="withdrawal-card"
      >

        <div class="withdrawal-main">

          <div class="withdrawal-avatar">

            <i class="bi bi-person"></i>

          </div>


          <div class="withdrawal-user">

            <div class="withdrawal-user-top">

              <strong>
                User #${escapeHtml(
                  withdrawal.userId
                )}
              </strong>

              <span class="status-badge">
                Pending
              </span>

            </div>


            <div class="withdrawal-amount">

              ${formatCurrency(
                amount
              )}

            </div>


            <div class="withdrawal-date">

              <i class="bi bi-clock"></i>

              ${escapeHtml(date)}

            </div>

          </div>

        </div>


        <div class="account-details">

          <div class="account-row">

            <span>
              Bank
            </span>

            <strong>
              ${escapeHtml(
                withdrawal.bankName ||
                "Not provided"
              )}
            </strong>

          </div>


          <div class="account-row">

            <span>
              Account name
            </span>

            <strong>
              ${escapeHtml(
                withdrawal.accountName ||
                "Not provided"
              )}
            </strong>

          </div>


          <div class="account-row">

            <span>
              Account number
            </span>

            <strong class="account-number">
              ${escapeHtml(
                withdrawal.accountNumber ||
                "Not provided"
              )}
            </strong>

          </div>

        </div>


        <div class="withdrawal-action">

          <button
            class="mark-paid-btn"
            type="button"
            data-withdrawal-id="${withdrawal.id}"
          >

            <i class="bi bi-check2"></i>

            Mark Paid

          </button>

        </div>

      </article>

    `;

  }


  // =====================================
  // WITHDRAWAL BUTTON DELEGATION
  // =====================================

  document.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(
          "[data-withdrawal-id]"
        );


      if (!button)
        return;


      const id =
        Number(
          button.dataset.withdrawalId
        );


      if (!id)
        return;


      openConfirmModal(id);

    }
  );


  // =====================================
  // CONFIRM MODAL
  // =====================================

  function openConfirmModal(id) {

    selectedWithdrawalId =
      id;


    $("confirmModal")
      ?.classList
      .remove("hidden");


    document.body.classList.add(
      "modal-open"
    );

  }


  function closeConfirmModal() {

    selectedWithdrawalId =
      null;


    $("confirmModal")
      ?.classList
      .add("hidden");


    document.body.classList.remove(
      "modal-open"
    );

  }


  // =====================================
  // CONFIRM PAYMENT
  // =====================================

  async function confirmPayment() {

    if (
      !selectedWithdrawalId
    ) {

      return;

    }


    const id =
      selectedWithdrawalId;


    const button =
      $("confirmPaymentBtn");


    if (button) {

      button.disabled = true;

      button.innerHTML = `
        <span class="button-spinner"></span>
        Processing...
      `;

    }


    try {

      const res =
        await fetch(
          `${API_BASE_URL}/withdrawals/${id}/pay`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      const data =
        await readResponse(res);


      if (!res.ok) {

        throw new Error(
          data?.message ||
          "Failed to mark withdrawal as paid."
        );

      }


      closeConfirmModal();


      await loadDashboard();

    }
    catch (error) {

      console.error(
        "MARK PAID ERROR:",
        error
      );


      alert(
        error.message ||
        "Unable to complete payment."
      );

    }
    finally {

      if (button) {

        button.disabled = false;

        button.innerHTML =
          "Yes, mark paid";

      }

    }

  }


  // =====================================
  // LOGOUT
  // =====================================

  function logout() {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );


    window.location.href =
      "login.html";

  }


  // =====================================
  // REFRESH STATE
  // =====================================

  function setRefreshing(
    refreshing
  ) {

    const button =
      $("refreshBtn");


    if (!button)
      return;


    if (refreshing) {

      button.disabled = true;

      button.innerHTML = `
        <span class="button-spinner"></span>
        <span>Refreshing</span>
      `;

    }
    else {

      button.disabled = false;

      button.innerHTML = `
        <i class="bi bi-arrow-clockwise"></i>
        <span>Refresh</span>
      `;

    }

  }


  // =====================================
  // ERROR
  // =====================================

  function showError(
    message
  ) {

    const error =
      $("dashboardError");


    const text =
      $("dashboardErrorText");


    if (text) {

      text.innerText =
        message;

    }


    error
      ?.classList
      .remove("hidden");

  }


  function hideError() {

    $("dashboardError")
      ?.classList
      .add("hidden");

  }


  // =====================================
  // RESPONSE PARSER
  // =====================================

  async function readResponse(
    response
  ) {

    const text =
      await response.text();


    if (!text)
      return null;


    try {

      return JSON.parse(
        text
      );

    }
    catch {

      return {
        message: text,
      };

    }

  }


  // =====================================
  // TEXT
  // =====================================

  function setText(
    id,
    value
  ) {

    const element =
      $(id);


    if (element) {

      element.innerText =
        value;

    }

  }


  // =====================================
  // NUMBER FORMAT
  // =====================================

  function formatNumber(
    value
  ) {

    return Number(
      value || 0
    ).toLocaleString(
      "en-NG"
    );

  }


  // =====================================
  // CURRENCY FORMAT
  // =====================================

  function formatCurrency(
    value
  ) {

    return Number(
      value || 0
    ).toLocaleString(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
      }
    );

  }


  // =====================================
  // HTML ESCAPE
  // =====================================

  function escapeHtml(
    value
  ) {

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

})();