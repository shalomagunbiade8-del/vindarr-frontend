// =====================================
// VINDARR NOTIFICATIONS
// =====================================

let notificationsData = [];


// =====================================
// LOAD NOTIFICATIONS
// =====================================

async function loadNotifications(){

  const token =
    localStorage.getItem("token");

  if(!token){

    window.location.href =
      "login.html";

    return;

  }

  const list =
    document.getElementById(
      "notificationsList"
    );

  try{

    const res =
      await fetch(
        `${API_BASE_URL}/notifications/me`,
        {
          headers:{
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    if(!res.ok){

      throw new Error(
        "Failed to load notifications"
      );

    }

    const notifications =
      await res.json();

    notificationsData =
      Array.isArray(notifications)
        ? notifications
        : [];

    renderNotifications(
      notificationsData
    );

    updateNotificationSummary();

  }catch(err){

    console.error(
      "Notifications error:",
      err
    );

    list.innerHTML = `

      <div class="notifications-error">

        <div class="error-icon">

          <i class="bi bi-exclamation-circle"></i>

        </div>

        <h2>
          Couldn't load notifications
        </h2>

        <p>
          Something went wrong while loading
          your notifications.
        </p>

        <button
          class="retry-btn"
          onclick="loadNotifications()"
        >
          Try Again
        </button>

      </div>

    `;

  }

}


// =====================================
// RENDER NOTIFICATIONS
// =====================================

function renderNotifications(
  notifications
){

  const list =
    document.getElementById(
      "notificationsList"
    );

  if(!notifications.length){

    list.innerHTML = `

      <div class="notifications-empty">

        <div class="empty-icon">

          <i class="bi bi-bell-slash"></i>

        </div>

        <span class="empty-label">
          ALL QUIET
        </span>

        <h2>
          You're all caught up.
        </h2>

        <p>
          New sales, milestones, withdrawals
          and other Vindarr activity will
          appear here.
        </p>

      </div>

    `;

    return;

  }


  list.innerHTML =
    notifications
      .map(
        notification =>
          createNotificationHTML(
            notification
          )
      )
      .join("");

}


// =====================================
// CREATE NOTIFICATION
// =====================================

function createNotificationHTML(n){

  const isUnread =
    !n.isRead;

  const icon =
    getNotificationIcon(
      n.type
    );

  const date =
    formatNotificationDate(
      n.createdAt
    );

  return `

    <article
      class="
        notification-item
        ${isUnread ? "unread" : ""}
      "
      data-id="${n.id}"
      onclick="markNotificationRead(${n.id})"
    >

      ${
        isUnread
        ? `
          <span class="unread-dot"></span>
        `
        : ""
      }


      <div
        class="
          notification-icon
          notification-${escapeHtml(
            n.type || "default"
          )}
        "
      >

        <i class="${icon}"></i>

      </div>


      <div class="notification-body">

        <div class="notification-top">

          <h3>
            ${escapeHtml(
              n.title ||
              "Vindarr Notification"
            )}
          </h3>

          <time>
            ${date}
          </time>

        </div>


        <p class="notification-message">

          ${escapeHtml(
            n.message || ""
          )}

        </p>


        ${
          isUnread
          ? `
            <span class="notification-status">
              <i class="bi bi-circle-fill"></i>
              New
            </span>
          `
          : ""
        }

      </div>

    </article>

  `;

}


// =====================================
// ICONS
// =====================================

function getNotificationIcon(type){

  switch(type){

    case "sale":

      return "bi bi-bag-check-fill";

    case "milestone":

      return "bi bi-trophy-fill";

    case "withdrawal":

      return "bi bi-bank2";

    case "review":

      return "bi bi-star-fill";

    case "comment":

      return "bi bi-chat-left-text-fill";

    case "message":

      return "bi bi-chat-dots-fill";

    case "like":

      return "bi bi-heart-fill";

    case "understand":

      return "bi bi-hand-thumbs-up-fill";

    case "announcement":

      return "bi bi-megaphone-fill";

    default:

      return "bi bi-bell-fill";

  }

}


// =====================================
// MARK SINGLE NOTIFICATION READ
// =====================================

async function markNotificationRead(id){

  const token =
    localStorage.getItem("token");

  if(!token) return;


  const notification =
    notificationsData.find(
      n => String(n.id) === String(id)
    );


  if(
    !notification ||
    notification.isRead
  ){

    return;

  }


  try{

    const res =
      await fetch(
        `${API_BASE_URL}/notifications/${id}/read`,
        {
          method:"PATCH",

          headers:{
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if(!res.ok){

      throw new Error(
        "Unable to mark notification as read"
      );

    }


    notification.isRead = true;


    const element =
      document.querySelector(
        `.notification-item[data-id="${id}"]`
      );


    if(element){

      element.classList.remove(
        "unread"
      );

      const dot =
        element.querySelector(
          ".unread-dot"
        );

      if(dot){

        dot.remove();

      }

      const status =
        element.querySelector(
          ".notification-status"
        );

      if(status){

        status.remove();

      }

    }


    updateNotificationSummary();

  }catch(err){

    console.error(
      "Mark notification read error:",
      err
    );

  }

}


// =====================================
// MARK ALL READ
// =====================================

async function markAllRead(){

  const token =
    localStorage.getItem("token");

  if(!token) return;


  const unread =
    notificationsData.filter(
      n => !n.isRead
    );


  if(!unread.length){

    return;

  }


  /*
   * Use the existing individual
   * read endpoint so this does not
   * require a new backend route.
   */

  try{

    await Promise.all(

      unread.map(
        notification =>
          fetch(
            `${API_BASE_URL}/notifications/${notification.id}/read`,
            {
              method:"PATCH",

              headers:{
                Authorization:
                  `Bearer ${token}`
              }
            }
          )
      )

    );


    notificationsData =
      notificationsData.map(
        notification => ({
          ...notification,
          isRead:true
        })
      );


    renderNotifications(
      notificationsData
    );

    updateNotificationSummary();

  }catch(err){

    console.error(
      "Mark all read error:",
      err
    );

  }

}


// =====================================
// SUMMARY
// =====================================

function updateNotificationSummary(){

  const unread =
    notificationsData.filter(
      n => !n.isRead
    ).length;


  const count =
    document.getElementById(
      "unreadCount"
    );


  if(count){

    count.innerText =
      unread;

  }

}


// =====================================
// DATE
// =====================================

function formatNotificationDate(
  date
){

  if(!date){

    return "";

  }


  const notificationDate =
    new Date(date);

  const now =
    new Date();


  const difference =
    now - notificationDate;


  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;


  if(difference < minute){

    return "Just now";

  }


  if(difference < hour){

    const minutes =
      Math.floor(
        difference / minute
      );

    return `${minutes}m ago`;

  }


  if(difference < day){

    const hours =
      Math.floor(
        difference / hour
      );

    return `${hours}h ago`;

  }


  if(difference < 7 * day){

    const days =
      Math.floor(
        difference / day
      );

    return `${days}d ago`;

  }


  return notificationDate
    .toLocaleDateString(
      "en-NG",
      {
        day:"numeric",
        month:"short",
        year:"numeric"
      }
    );

}


// =====================================
// HTML ESCAPING
// =====================================

function escapeHtml(value){

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


// =====================================
// INIT
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  loadNotifications
);