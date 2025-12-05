function showReviewForm() {
  document.getElementById("add-review-btn").style.display = "none";
  document.getElementById("review-form").style.display = "flex";
  document.getElementById("review-input").focus();
}

function cancelReview() {
  document.getElementById("review-input").value = "";
  document.getElementById("review-form").style.display = "none";
  document.getElementById("add-review-btn").style.display = "inline-block";
}

function submitReview() {
  const reviewText = document.getElementById("review-input").value;
  if (reviewText && reviewText.trim() !== "") {
    const activityList = document.getElementById("activity-list");

    const newActivity = document.createElement("div");
    newActivity.className = "activity";
    newActivity.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
              <div class="avatar" style="background: #10b981">YOU</div>
              <div>
                <div style="font-weight: 700">You</div>
                <div style="font-size: 12px; color: var(--muted-2)">Just now</div>
              </div>
            </div>
            <div style="color: var(--muted); margin-bottom: 10px;">"${reviewText}"</div>
            <div>
              <button class="btn btn-outline" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);" onclick="deleteReview(this)">Delete</button>
            </div>
          `;

    activityList.appendChild(newActivity);
    cancelReview();
  } else {
    alert("Please enter a review before posting.");
  }
}

function deleteReview(btnElement) {
  if (confirm("Are you sure you want to delete this review?")) {
    const activityDiv = btnElement.closest(".activity");
    activityDiv.remove();
  }
}

function promptLogin(e) {
  e.preventDefault();
  if (
    confirm(
      "Please Login or Sign Up to book a porter.\n\nClick OK to proceed to the Login page."
    )
  ) {
    window.location.href = "login.html";
  }
}

// Intersection observer to animate cards (desktop-only)
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((ent) => {
      if (ent.isIntersecting) {
        ent.target.style.opacity = "1";
        ent.target.style.transform = "translateY(0)";
        ent.target.style.animation = "fadeInUp .6s ease forwards";
        obs.unobserve(ent.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);

document.querySelectorAll(".will-animate").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(18px)";
  obs.observe(el);
});

// Smooth scrolling for sidebar links
document.querySelectorAll(".nav-link").forEach((a) => {
  a.addEventListener("click", function (evt) {
    evt.preventDefault();
    const href = this.getAttribute("href");
    const target = document.querySelector(href);
    if (target) {
      window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
      // active link UI
      document
        .querySelectorAll(".nav-link")
        .forEach((n) => n.classList.remove("active"));
      this.classList.add("active");
    }
  });
});
