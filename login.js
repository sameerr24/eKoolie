var isPorterLogin = false;

function togglePorterLogin() {
  isPorterLogin = !isPorterLogin;
  const title = document.querySelector("#loginForm .form-title");
  const toggleText = document.getElementById("porterToggleText");
  const registerLink = document.querySelector(
    "#loginForm .switch-text:first-of-type"
  );

  if (isPorterLogin) {
    title.textContent = "Porter Login";
    toggleText.textContent = "Login as User";
    registerLink.style.display = "none";
  } else {
    title.textContent = "Login";
    toggleText.textContent = "Login as Porter";
    registerLink.style.display = "block";
  }
}

// Show Register Form
function showRegister() {
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");

  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  registerForm.classList.add("fade-in");

  // Clear login form
  document.getElementById("loginUsername").value = "";
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
}

// Show Login Form
function showLogin() {
  var loginForm = document.getElementById("loginForm");
  var registerForm = document.getElementById("registerForm");

  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  loginForm.classList.add("fade-in");

  // Clear register form
  document.getElementById("registerUsername").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
}

// Handle Login
function handleLogin(event) {
  event.preventDefault();

  var username = document.getElementById("loginUsername").value;
  var email = document.getElementById("loginEmail").value;
  var password = document.getElementById("loginPassword").value;

  var isValid = true;

  // Username validation
  if (!username) {
    document.getElementById("loginUsername").classList.add("error");
    document.getElementById("loginUsernameError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("loginUsername").classList.remove("error");
    document.getElementById("loginUsernameError").classList.remove("show");
  }

  // Simple validation
  if (!email || !email.includes("@")) {
    document.getElementById("loginEmail").classList.add("error");
    document.getElementById("loginEmailError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("loginEmail").classList.remove("error");
    document.getElementById("loginEmailError").classList.remove("show");
  }

  if (!password || password.length < 6) {
    document.getElementById("loginPassword").classList.add("error");
    document.getElementById("loginPasswordError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("loginPassword").classList.remove("error");
    document.getElementById("loginPasswordError").classList.remove("show");
  }

  if (isValid) {
    localStorage.setItem("username", username);

    if (isPorterLogin) {
      alert("Porter Login successful! Redirecting to dashboard...");
      window.location.href = "porter_dashboard.html";
    } else {
      alert("Login successful! Redirecting to booking...");
      window.location.href = "book.html";
    }
  }

  return false;
}

// Handle Register
function handleRegister(event) {
  event.preventDefault();

  var username = document.getElementById("registerUsername").value;
  var email = document.getElementById("registerEmail").value;
  var password = document.getElementById("registerPassword").value;

  var isValid = true;

  // Username validation
  if (!username || username.length < 3) {
    document.getElementById("registerUsername").classList.add("error");
    document.getElementById("registerUsernameError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("registerUsername").classList.remove("error");
    document.getElementById("registerUsernameError").classList.remove("show");
  }

  // Email validation
  if (!email || !email.includes("@")) {
    document.getElementById("registerEmail").classList.add("error");
    document.getElementById("registerEmailError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("registerEmail").classList.remove("error");
    document.getElementById("registerEmailError").classList.remove("show");
  }

  // Password validation
  if (!password || password.length < 6) {
    document.getElementById("registerPassword").classList.add("error");
    document.getElementById("registerPasswordError").classList.add("show");
    isValid = false;
  } else {
    document.getElementById("registerPassword").classList.remove("error");
    document.getElementById("registerPasswordError").classList.remove("show");
  }

  if (isValid) {
    alert("Registration successful! Welcome to eKoolie!");
    showLogin();
  }

  return false;
}

// Clear error on input
var inputs = document.querySelectorAll(".input");
for (var i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener("input", function () {
    this.classList.remove("error");
    var errorId = this.id + "Error";
    var errorMsg = document.getElementById(errorId);
    if (errorMsg) {
      errorMsg.classList.remove("show");
    }
  });
}
