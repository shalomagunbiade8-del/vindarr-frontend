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

function toggleNotifications() {

  const dropdown =
    document.getElementById("notifDropdown");

  if (!dropdown) return;

  dropdown.classList.toggle("show-notifications");

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