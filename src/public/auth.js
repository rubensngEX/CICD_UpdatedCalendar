// Function to handle logout
function logout() {
  // Clear the authentication token and other stored data
  localStorage.clear();

  // Redirect the user to the login page
  window.location.href = "/index.html";
}

// Function to check if the token is expired
function isTokenExpired(token) {
  try {
    // Decode token (assuming it's a JWT)
    const payloadBase64 = token.split(".")[1]; // JWT format: header.payload.signature
    const payload = JSON.parse(atob(payloadBase64)); // Decode base64 payload

    // Check current time against token's expiry time
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return payload.exp && payload.exp < currentTime; // If 'exp' is present and expired
  } catch (error) {
    console.error("Invalid token:", error);
    return true; // Treat invalid tokens as expired
  }
}

// Main authentication check
function checkAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    logout(); // Redirect to login
  } else if (isTokenExpired(token)) {
    logout(); // Logout and redirect to login
  } else {
  }
}

// Execute the authentication check
checkAuth();
