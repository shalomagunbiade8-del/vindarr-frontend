// ===============================
// AUTH SYSTEM
// ===============================

// REGISTER
async function register(){

  const username =
  document.getElementById(
    "registerUsername"
  ).value;

  const email =
  document.getElementById(
    "registerEmail"
  ).value;

  const password =
  document.getElementById(
    "registerPassword"
  ).value;

  if(!username || !email || !password){

    alert("Fill all fields");
    return;

  }

  try{

    const res = await fetch(
      `${API_BASE_URL}/auth/register`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          username,
          email,
          password
        })
      }
    );

    const data = await res.json();

    if(!res.ok){

      alert(data.message || "Registration failed");
      return;

    }

    alert("Registration successful");

    window.location.href =
    "login.html";

  }catch(err){

    console.error(err);

    alert("Network error");

  }

}

// LOGIN
async function login(){

  const email =
  document.getElementById(
    "loginEmail"
  ).value;

  const password =
  document.getElementById(
    "loginPassword"
  ).value;

  if(!email || !password){

    alert("Fill all fields");
    return;

  }

  try{

    const res = await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await res.json();

    if(!res.ok){

      alert(data.message || "Login failed");
      return;

    }

    // SAVE TOKEN
    localStorage.setItem(
      "token",
      data.access_token
    );

    // SAVE USER
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    localStorage.setItem(
  "username",
  data.user.username
);

    // REDIRECT
    window.location.href =
    "index.html";

  }catch(err){

    console.error(err);

    alert("Network error");

  }

}

// LOGOUT
function logout(){

  localStorage.clear();

  window.location.href =
  "login.html";

}

// CHECK LOGIN
function checkAuth(){

  const token =
  localStorage.getItem("token");

  if(!token){

    window.location.href =
    "login.html";

  }

}

// CURRENT USER
function getCurrentUser(){

  return JSON.parse(
    localStorage.getItem("user")
  );

}

// TOGGLE PASSWORD VISIBILITY
function togglePassword(
  inputId,
  iconId
){

  const input =
  document.getElementById(inputId);

  const icon =
  document.getElementById(iconId);

  if(input.type === "password"){

    input.type = "text";

    icon.classList.remove(
      "bi-eye-slash"
    );

    icon.classList.add(
      "bi-eye"
    );

  }else{

    input.type = "password";

    icon.classList.remove(
      "bi-eye"
    );

    icon.classList.add(
      "bi-eye-slash"
    );

  }

}