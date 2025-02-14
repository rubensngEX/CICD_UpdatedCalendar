(function () {
  const notyf = new Notyf();

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    // Check if the input is an email
    function isEmail(input) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(input);
    }
    
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("toggle-password")) {
        const targetFieldId = e.target.getAttribute("data-target");
        const targetField = document.getElementById(targetFieldId);

        if (targetField.type === "password") {
          targetField.type = "text";
          e.target.classList.remove("fa-eye");
          e.target.classList.add("fa-eye-slash");
        } else {
          targetField.type = "password";
          e.target.classList.remove("fa-eye-slash");
          e.target.classList.add("fa-eye");
        }
      }
    });

    // Login form submit event
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const usernameOrEmail = document.getElementById("usernameOrEmail").value;
      const password = document.getElementById("password").value;

      if (!usernameOrEmail || !password) {
        notyf.error("Please fill in all fields.");
        return;
      }

      // Determine whether the input is an email or username
      const loginPayload = isEmail(usernameOrEmail)
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };

      fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      })
        .then((response) => {
          if (response.ok) {
            return response.json().then((data) => {
              localStorage.setItem("token", data.token);
              localStorage.setItem("personId", data.personId);
              // showNotification("Login successful!");
              window.location.href = "./index.html";
            });
          } else {
            return response.json().then((data) => {
              notyf.error(data.message || "Login failed!");
            });
          }
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          notyf.error("An error occurred. Please try again.");
        });
    });
  });
})();
async function handleCredentialResponse(response) {
  const idToken = response.credential;

  console.log("Google ID Token:", idToken);

  // Send token to backend
  const res = await fetch("gauth/google/callback", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
  })
  .then((response) => {
  if (response.ok) {
      return response.json().then((data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("personId", data.personId);
      // showNotification("Login successful!");
      window.location.href = "./index.html";
      });
  } else {
      return response.json().then((data) => {
      notyf.error(data.message || "Login failed!");
      });
  }
  })
  .catch((error) => {
  console.error("Fetch error:", error);
  notyf.error("An error occurred. Please try again.");
  });
  
}