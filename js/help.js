// =====================================
// VINDARR HELP DESK
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const year =
      document.getElementById(
        "currentYear"
      );

    if (year) {

      year.textContent =
        new Date().getFullYear();

    }


    // =====================================
    // REVEAL ANIMATION
    // =====================================

    const revealElements =
      document.querySelectorAll(
        ".about-card, " +
        ".about-main-card, " +
        ".stat-card, " +
        ".flow-item, " +
        ".commission-card, " +
        ".support-card, " +
        ".insight-card"
      );


    if (
      "IntersectionObserver"
      in window
    ) {

      const observer =
        new IntersectionObserver(
          (entries) => {

            entries.forEach(
              (entry) => {

                if (
                  entry.isIntersecting
                ) {

                  entry.target.classList.add(
                    "help-visible"
                  );

                  observer.unobserve(
                    entry.target
                  );

                }

              }
            );

          },
          {
            threshold: 0.12
          }
        );


      revealElements.forEach(
        (element) => {

          element.classList.add(
            "help-reveal"
          );

          observer.observe(
            element
          );

        }
      );

    }

  }
);