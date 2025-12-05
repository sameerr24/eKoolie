document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem("username");
  if (username) {
    const greetingElement = document.getElementById("userGreeting");
    if (greetingElement) {
      greetingElement.textContent = `Hello ${username}`;
    }
  }
});

function handleSearch(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.innerText;

  btn.innerText = "Searching...";
  btn.style.opacity = "0.7";

  setTimeout(() => {
    btn.innerText = originalText;
    btn.style.opacity = "1";
    document.getElementById("resultSection").classList.remove("hidden");
    // Scroll to result
    document
      .getElementById("resultSection")
      .scrollIntoView({ behavior: "smooth" });
  }, 1500);
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("username");
    window.location.href = "home.html";
  }
}
