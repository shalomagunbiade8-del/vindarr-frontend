// =========================================================
// VINDARR GOOGLE AUTH CALLBACK
// =========================================================

(function handleGoogleCallback(){

  const spinner =
    document.getElementById(
      "callbackSpinner"
    );

  const icon =
    document.getElementById(
      "callbackIcon"
    );

  const title =
    document.getElementById(
      "callbackTitle"
    );

  const message =
    document.getElementById(
      "callbackMessage"
    );

  const errorBox =
    document.getElementById(
      "callbackError"
    );


  // =======================================================
  // ERROR UI
  // =======================================================

  function showError(errorMessage){

    if(spinner){

      spinner.style.display =
        "none";

    }


    if(icon){

      icon.textContent =
        "!";

      icon.style.color =
        "#d10000";

    }


    if(title){

      title.textContent =
        "Google sign-in failed";

    }


    if(message){

      message.textContent =
        "We could not complete your Vindarr sign-in.";

    }


    if(errorBox){

      errorBox.textContent =
        errorMessage ||
        "Please try again.";

      errorBox.style.display =
        "block";

    }

  }


  // =======================================================
  // MAIN CALLBACK
  // =======================================================

  async function processCallback(){

    try{

      /*
       * Backend redirects to:
       *
       * google-callback.html#token=JWT
       *
       * The fragment is intentionally used instead
       * of a query parameter.
       */

      const hash =
        window.location.hash || "";


      if(!hash){

        throw new Error(
          "No Google authentication token was received."
        );

      }


      const params =
        new URLSearchParams(
          hash.substring(1)
        );


      const token =
        params.get("token");


      if(!token){

        throw new Error(
          "No Google authentication token was received."
        );

      }


      // ===================================================
      // SAVE JWT
      // ===================================================

      localStorage.setItem(
        "token",
        token
      );


      // ===================================================
      // VERIFY JWT / GET USER
      // ===================================================

      const response =
        await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            method:"GET",

            headers:{
              Authorization:
                `Bearer ${token}`
            }
          }
        );


      if(!response.ok){

        throw new Error(
          "Your Google session could not be verified."
        );

      }


      const user =
        await response.json();


      // ===================================================
      // SAVE USER
      // ===================================================

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      if(user.username){

        localStorage.setItem(
          "username",
          user.username
        );

      }


      // ===================================================
      // REMOVE TOKEN FROM URL
      // ===================================================

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );


      // ===================================================
      // SUCCESS UI
      // ===================================================

      if(spinner){

        spinner.style.display =
          "none";

      }


      if(title){

        title.textContent =
          "Welcome to Vindarr.";

      }


      if(message){

        message.textContent =
          "You're signed in. Redirecting...";

      }


      // ===================================================
      // REDIRECT
      // ===================================================

      setTimeout(
        function(){

          window.location.replace(
            "index.html"
          );

        },
        350
      );

    }catch(error){

      console.error(
        "Google authentication callback error:",
        error
      );


      // ===================================================
      // REMOVE INVALID SESSION
      // ===================================================

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "username"
      );


      const errorMessage =
        error?.message ||
        "Google authentication failed.";


      showError(
        errorMessage
      );


      // ===================================================
      // RETURN TO LOGIN
      // ===================================================

      setTimeout(
        function(){

          window.location.replace(
            "login.html?googleError=" +
            encodeURIComponent(
              errorMessage
            )
          );

        },
        1500
      );

    }

  }


  processCallback();

})();