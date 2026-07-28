// ===============================
// FORMAT PRICE
// ===============================

function formatPrice(price) {

  return `₦${Number(price).toLocaleString()}`;

}

// ===============================
// FORMAT TIME
// ===============================

function formatTime(seconds) {

  const m = Math.floor(seconds / 60);

  const s = Math.floor(seconds % 60);

  return `${m}:${s < 10 ? "0" + s : s}`;

}

// ===============================
// SHOW LOADER
// ===============================

function showLoading() {

    const loader = document.getElementById("storyLoading");

    if(loader){

        loader.style.display = "flex";

    }

}

// ===============================
// HIDE LOADER
// ===============================

function hideLoading() {

    const loader = document.getElementById("storyLoading");

    if(loader){

        loader.style.display = "none";

    }

}

// ===============================
// FORMAT DATE
// ===============================

function formatDate(date){

    return new Date(date).toLocaleDateString("en-NG",{

        day:"numeric",

        month:"short",

        year:"numeric"

    });

}