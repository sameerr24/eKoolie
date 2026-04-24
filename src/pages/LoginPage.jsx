import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLegacyPage } from "../legacy/useLegacyPage";

const LOGIN_HTML = `
<div class="container">
  <div class="logo">
    <div class="logo-box">
      <div class="logo-icon">🚂</div>
      <span class="logo-text racing">eKoolie</span>
    </div>
  </div>

  <div id="loginForm" class="form-box fade-in">
    <h1 class="form-title">Login</h1>

    <form onsubmit="return handleLogin(event);">
      <div class="input-group">
        <label class="label">Username:</label>
        <input type="text" class="input" id="loginUsername" placeholder="Enter your username" required />
        <span class="error-msg" id="loginUsernameError">Username is required</span>
      </div>

      <div class="input-group">
        <label class="label">Email:</label>
        <input type="email" class="input" id="loginEmail" placeholder="sameer@domain.com" required />
        <span class="error-msg" id="loginEmailError">Please enter a valid email</span>
      </div>

      <div class="input-group">
        <label class="label">Password:</label>
        <input type="password" class="input" id="loginPassword" placeholder="••••••••" required />
        <span class="error-msg" id="loginPasswordError">Password is required</span>
      </div>
      <button id="loginBtn" type="submit" class="btn">Login</button>
    </form>

    <div class="switch-text">
      New user?
      <span id="registerLink" class="switch-link" onclick="showRegister()">Register here</span>
    </div>
    <div class="switch-text" style="margin-top: 10px">
      Are you a Porter?
      <span class="switch-link" onclick="togglePorterLogin()" id="porterToggleText">Login as Porter</span>
    </div>
  </div>

  <div id="registerForm" class="form-box hidden">
    <h1 class="form-title">Register</h1>

    <form onsubmit="return handleRegister(event);">
      <div class="input-group">
        <label class="label">Username:</label>
        <input type="text" class="input" id="registerUsername" placeholder="isht@example.com" required />
        <span class="error-msg" id="registerUsernameError">Username is required</span>
      </div>

      <div class="input-group">
        <label class="label">Email:</label>
        <input type="email" class="input" id="registerEmail" placeholder="your@email.com" required />
        <span class="error-msg" id="registerEmailError">Please enter a valid email</span>
      </div>

      <div class="input-group">
        <label class="label">Password:</label>
        <input type="password" class="input" id="registerPassword" placeholder="••••••••" required />
        <span class="error-msg" id="registerPasswordError">Password must be at least 6 characters</span>
      </div>

      <button id="registerButton" type="submit" class="btn">Register</button>
    </form>

    <div class="switch-text">
      Already have an account?
      <span class="switch-link" onclick="showLogin()">Login here</span>
    </div>
  </div>
</div>
`;

export function LoginPage() {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const setup = useCallback(
    ({ container }) => {
      const body = document.body;
      const previousBodyStyles = {
        display: body.style.display,
        alignItems: body.style.alignItems,
        justifyContent: body.style.justifyContent,
        padding: body.style.padding,
        paddingLeft: body.style.paddingLeft,
        backgroundImage: body.style.backgroundImage,
        backgroundSize: body.style.backgroundSize,
        backgroundPosition: body.style.backgroundPosition,
        backgroundAttachment: body.style.backgroundAttachment,
        backgroundRepeat: body.style.backgroundRepeat,
      };

      body.style.display = "flex";
      body.style.alignItems = "center";
      body.style.justifyContent = "flex-start";
      body.style.padding = "20px";
      body.style.paddingLeft = "80px";
      body.style.backgroundImage =
        'url("https://lp-cms-production.imgix.net/2024-08/GettyRF938095766.jpg?auto=format,compress&q=72&fit=crop")';
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";
      body.style.backgroundAttachment = "fixed";
      body.style.backgroundRepeat = "no-repeat";

      let isPorterLogin = false;

      const previousFns = {
        togglePorterLogin: window.togglePorterLogin,
        showRegister: window.showRegister,
        showLogin: window.showLogin,
        handleLogin: window.handleLogin,
        handleRegister: window.handleRegister,
      };

      const toggleError = (id, isVisible) => {
        const input = container.querySelector(`#${id}`);
        const error = container.querySelector(`#${id}Error`);

        input?.classList.toggle("error", isVisible);
        error?.classList.toggle("show", isVisible);
      };

      window.togglePorterLogin = () => {
        isPorterLogin = !isPorterLogin;
        const title = container.querySelector("#loginForm .form-title");
        const toggleText = container.querySelector("#porterToggleText");
        const registerLink = container.querySelector(
          "#loginForm .switch-text:first-of-type",
        );

        if (!title || !toggleText || !registerLink) {
          return;
        }

        if (isPorterLogin) {
          title.textContent = "Porter Login";
          toggleText.textContent = "Login as User";
          registerLink.style.display = "none";
        } else {
          title.textContent = "Login";
          toggleText.textContent = "Login as Porter";
          registerLink.style.display = "block";
        }
      };

      window.showRegister = () => {
        const loginForm = container.querySelector("#loginForm");
        const registerForm = container.querySelector("#registerForm");

        loginForm?.classList.add("hidden");
        registerForm?.classList.remove("hidden");
        registerForm?.classList.add("fade-in");

        ["#loginUsername", "#loginEmail", "#loginPassword"].forEach((sel) => {
          const input = container.querySelector(sel);
          if (input) {
            input.value = "";
          }
        });
      };

      window.showLogin = () => {
        const loginForm = container.querySelector("#loginForm");
        const registerForm = container.querySelector("#registerForm");

        registerForm?.classList.add("hidden");
        loginForm?.classList.remove("hidden");
        loginForm?.classList.add("fade-in");

        ["#registerUsername", "#registerEmail", "#registerPassword"].forEach(
          (sel) => {
            const input = container.querySelector(sel);
            if (input) {
              input.value = "";
            }
          },
        );
      };

      window.handleLogin = (event) => {
        event.preventDefault();

        const username = container.querySelector("#loginUsername")?.value || "";
        const email = container.querySelector("#loginEmail")?.value || "";
        const password = container.querySelector("#loginPassword")?.value || "";

        let isValid = true;

        if (!username) {
          toggleError("loginUsername", true);
          isValid = false;
        } else {
          toggleError("loginUsername", false);
        }

        if (!email || !email.includes("@")) {
          toggleError("loginEmail", true);
          isValid = false;
        } else {
          toggleError("loginEmail", false);
        }

        if (!password || password.length < 6) {
          toggleError("loginPassword", true);
          isValid = false;
        } else {
          toggleError("loginPassword", false);
        }

        if (isValid) {
          localStorage.setItem("username", username);
          navigate(isPorterLogin ? "/porter-dashboard" : "/book");
        }

        return false;
      };

      window.handleRegister = (event) => {
        event.preventDefault();

        const username =
          container.querySelector("#registerUsername")?.value || "";
        const email = container.querySelector("#registerEmail")?.value || "";
        const password =
          container.querySelector("#registerPassword")?.value || "";

        let isValid = true;

        if (!username || username.length < 3) {
          toggleError("registerUsername", true);
          isValid = false;
        } else {
          toggleError("registerUsername", false);
        }

        if (!email || !email.includes("@")) {
          toggleError("registerEmail", true);
          isValid = false;
        } else {
          toggleError("registerEmail", false);
        }

        if (!password || password.length < 6) {
          toggleError("registerPassword", true);
          isValid = false;
        } else {
          toggleError("registerPassword", false);
        }

        if (isValid) {
          localStorage.setItem("username", username);
          navigate("/book");
        }

        return false;
      };

      const inputs = [...container.querySelectorAll(".input")];
      const onInput = (event) => {
        event.currentTarget.classList.remove("error");
        const errorId = `${event.currentTarget.id}Error`;
        container.querySelector(`#${errorId}`)?.classList.remove("show");
      };

      inputs.forEach((input) => input.addEventListener("input", onInput));

      return () => {
        inputs.forEach((input) => input.removeEventListener("input", onInput));
        body.style.display = previousBodyStyles.display;
        body.style.alignItems = previousBodyStyles.alignItems;
        body.style.justifyContent = previousBodyStyles.justifyContent;
        body.style.padding = previousBodyStyles.padding;
        body.style.paddingLeft = previousBodyStyles.paddingLeft;
        body.style.backgroundImage = previousBodyStyles.backgroundImage;
        body.style.backgroundSize = previousBodyStyles.backgroundSize;
        body.style.backgroundPosition = previousBodyStyles.backgroundPosition;
        body.style.backgroundAttachment =
          previousBodyStyles.backgroundAttachment;
        body.style.backgroundRepeat = previousBodyStyles.backgroundRepeat;
        window.togglePorterLogin = previousFns.togglePorterLogin;
        window.showRegister = previousFns.showRegister;
        window.showLogin = previousFns.showLogin;
        window.handleLogin = previousFns.handleLogin;
        window.handleRegister = previousFns.handleRegister;
      };
    },
    [navigate],
  );

  useLegacyPage({ containerRef, html: LOGIN_HTML, navigate, setup });

  return <div ref={containerRef} />;
}
