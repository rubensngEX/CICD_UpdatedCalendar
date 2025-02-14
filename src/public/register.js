(function () {
    const notyf = new Notyf();
  
    document.addEventListener("DOMContentLoaded", () => {
      const signupForm = document.getElementById("signup-form");
  
      signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
  
        const name = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
  
        // Validate input fields
        if (!name || !email || !password || !confirmPassword) {
          notyf.error("Please fill in all fields.");
          return;
        }
  
        // Check if passwords match
        if (password !== confirmPassword) {
          notyf.error("Passwords do not match.");
          return;
        }
  
        // Payload for registration
        const registerPayload = { name, email, password };
  
        fetch("/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerPayload),
        })
          .then((response) => {
            if (response.ok) {
              return response.json().then((data) => {
                notyf.success("Registration successful! Please log in.");
                window.showLogin(); // Switch to the login form after successful registration
              });
            } else {
              return response.json().then((data) => {
                notyf.error(data.message || "Registration failed!");
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
  