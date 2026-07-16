import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginPorter } from "../api/porters";
import { loginTraveller, registerTraveller } from "../api/travellers";
import "./LoginPage.css";

const initialLoginForm = { username: "", email: "", password: "" };
const initialRegisterForm = { name: "", username: "", email: "", password: "" };

export function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [isPorterLogin, setIsPorterLogin] = useState(false);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showRegister = () => {
    setMode("register");
    setLoginForm(initialLoginForm);
    setLoginErrors({});
  };

  const showLogin = () => {
    setMode("login");
    setRegisterForm(initialRegisterForm);
    setRegisterErrors({});
  };

  const togglePorterLogin = () => {
    setIsPorterLogin((current) => !current);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!loginForm.username.trim()) errors.username = true;
    if (!isPorterLogin && (!loginForm.email.trim() || !loginForm.email.includes("@"))) {
      errors.email = true;
    }
    if (!loginForm.password || loginForm.password.length < 6) errors.password = true;

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isPorterLogin) {
        const payload = await loginPorter(loginForm.username, loginForm.password);
        const porter = payload.data;
        localStorage.setItem("porterId", porter.id);
        localStorage.setItem("porterName", porter.name || loginForm.username);
        localStorage.setItem("porterUsername", porter.username || loginForm.username);
        navigate("/porter-dashboard");
      } else {
        const payload = await loginTraveller(loginForm.username, loginForm.password);
        localStorage.setItem("username", payload.data.username);
        navigate("/book");
      }
    } catch (error) {
      window.alert(error.message || "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!registerForm.name.trim()) errors.name = true;
    if (!registerForm.username.trim() || registerForm.username.trim().length < 3) errors.username = true;
    if (!registerForm.email.trim() || !registerForm.email.includes("@")) errors.email = true;
    if (!registerForm.password || registerForm.password.length < 6) errors.password = true;

    setRegisterErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = await registerTraveller(registerForm);
      localStorage.setItem("username", payload.data.username);
      navigate("/book");
    } catch (error) {
      window.alert(error.message || "Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-card card reveal is-visible">
        <div className="login-header">
          <span className="login-mark">🚆</span>
          <h1 className="login-title">
            {isPorterLogin ? "Porter Login" : mode === "login" ? "Login" : "Register"}
          </h1>
          <p className="login-subtitle">
            {isPorterLogin
              ? "Sign in to manage your booking requests."
              : "Book a verified Koolie in minutes."}
          </p>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="field">
              <label className="field-label">Username</label>
              <input
                className={`input${loginErrors.username ? " has-error" : ""}`}
                placeholder="Enter your username"
                value={loginForm.username}
                onChange={(event) => {
                  setLoginForm({ ...loginForm, username: event.target.value });
                  setLoginErrors({ ...loginErrors, username: false });
                }}
              />
              {loginErrors.username && <div className="field-error is-visible">Username is required</div>}
            </div>

            {!isPorterLogin && (
              <div className="field">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className={`input${loginErrors.email ? " has-error" : ""}`}
                  placeholder="sameer@domain.com"
                  value={loginForm.email}
                  onChange={(event) => {
                    setLoginForm({ ...loginForm, email: event.target.value });
                    setLoginErrors({ ...loginErrors, email: false });
                  }}
                />
                {loginErrors.email && <div className="field-error is-visible">Please enter a valid email</div>}
              </div>
            )}

            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                className={`input${loginErrors.password ? " has-error" : ""}`}
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(event) => {
                  setLoginForm({ ...loginForm, password: event.target.value });
                  setLoginErrors({ ...loginErrors, password: false });
                }}
              />
              {loginErrors.password && (
                <div className="field-error is-visible">Password must be at least 6 characters</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </button>

            <div className="login-switch">
              {!isPorterLogin && (
                <span className="switch-text">
                  Don&apos;t have an account?{" "}
                  <span className="switch-link" onClick={showRegister}>
                    Register here
                  </span>
                </span>
              )}
              <span className="switch-text">
                <span className="switch-link" onClick={togglePorterLogin}>
                  {isPorterLogin ? "Login as User" : "Login as Porter"}
                </span>
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="field">
              <label className="field-label">Full Name</label>
              <input
                className={`input${registerErrors.name ? " has-error" : ""}`}
                placeholder="Sameer Khan"
                value={registerForm.name}
                onChange={(event) => {
                  setRegisterForm({ ...registerForm, name: event.target.value });
                  setRegisterErrors({ ...registerErrors, name: false });
                }}
              />
              {registerErrors.name && <div className="field-error is-visible">Name is required</div>}
            </div>

            <div className="field">
              <label className="field-label">Username</label>
              <input
                className={`input${registerErrors.username ? " has-error" : ""}`}
                placeholder="isht@example.com"
                value={registerForm.username}
                onChange={(event) => {
                  setRegisterForm({ ...registerForm, username: event.target.value });
                  setRegisterErrors({ ...registerErrors, username: false });
                }}
              />
              {registerErrors.username && (
                <div className="field-error is-visible">Username must be at least 3 characters</div>
              )}
            </div>

            <div className="field">
              <label className="field-label">Email</label>
              <input
                type="email"
                className={`input${registerErrors.email ? " has-error" : ""}`}
                placeholder="your@email.com"
                value={registerForm.email}
                onChange={(event) => {
                  setRegisterForm({ ...registerForm, email: event.target.value });
                  setRegisterErrors({ ...registerErrors, email: false });
                }}
              />
              {registerErrors.email && <div className="field-error is-visible">Please enter a valid email</div>}
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                className={`input${registerErrors.password ? " has-error" : ""}`}
                placeholder="••••••••"
                value={registerForm.password}
                onChange={(event) => {
                  setRegisterForm({ ...registerForm, password: event.target.value });
                  setRegisterErrors({ ...registerErrors, password: false });
                }}
              />
              {registerErrors.password && (
                <div className="field-error is-visible">Password must be at least 6 characters</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Register"}
            </button>

            <div className="login-switch">
              <span className="switch-text">
                Already have an account?{" "}
                <span className="switch-link" onClick={showLogin}>
                  Login here
                </span>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
