(function () {
    function showSignup() {
      document.getElementById("signinBtn").classList.remove("active");
      document.getElementById("signupBtn").classList.add("active");
  
      const loginForm = document.getElementById("login-form");
      const signupForm = document.getElementById("signup-form");
  
      loginForm.classList.remove("active-form");
      loginForm.classList.add("hidden-form");
  
      signupForm.classList.remove("hidden-form");
      signupForm.classList.add("active-form");
  
      document.getElementById("form-title").textContent = "Create Account";
    }
  
    function showLogin() {
      document.getElementById("signupBtn").classList.remove("active");
      document.getElementById("signinBtn").classList.add("active");
  
      const loginForm = document.getElementById("login-form");
      const signupForm = document.getElementById("signup-form");
  
      signupForm.classList.remove("active-form");
      signupForm.classList.add("hidden-form");
  
      loginForm.classList.remove("hidden-form");
      loginForm.classList.add("active-form");
  
      document.getElementById("form-title").textContent = "Welcome!";
    }
  
    // Expose functions globally
    window.showSignup = showSignup;
    window.showLogin = showLogin;
  })();
  