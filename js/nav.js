// ===============================
// MENU TOGGLE
// ===============================

function toggleMenu() {

  const menu =
    document.getElementById("topMenu");

  if (!menu) return;

  menu.classList.toggle("show-menu");

}

// ===============================
// NOTIFICATIONS
// ===============================
function openNotifications(){

  window.location.href =
  "notifications.html";

}

async function loadUnreadCount(){

const token =
localStorage.getItem("token");

const res =
await fetch(

`${API_BASE_URL}/notifications/unread`,

{
headers:{
Authorization:
`Bearer ${token}`
}
}

);

const data =
await res.json();

document.getElementById(
"notifBadge"
).innerText =
data.unread || '';

}

// ===============================
// ACTIVE NAVIGATION
// ===============================

const currentPage =
  window.location.pathname.split("/").pop();

document.querySelectorAll(".bottom-nav a")
.forEach(link => {

  const href = link.getAttribute("href");

  if (href === currentPage) {

    link.classList.add("active-nav");

  }

});

// ===============================
// GO HOME
// ===============================

function goHome() {

  window.location.href = "index.html";

}
