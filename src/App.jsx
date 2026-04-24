import { useLayoutEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { BookPage } from "./pages/BookPage";
import { PaymentPage } from "./pages/PaymentPage";
import { PorterProfilePage } from "./pages/PorterProfilePage";
import { PorterDashboardPage } from "./pages/PorterDashboardPage";

function ScrollToTop() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/home.html" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/book.html" element={<Navigate to="/book" replace />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route
          path="/payment.html"
          element={<Navigate to="/payment" replace />}
        />
        <Route path="/porter-profile" element={<PorterProfilePage />} />
        <Route
          path="/porter_profile.html"
          element={<Navigate to="/porter-profile" replace />}
        />
        <Route path="/porter-dashboard" element={<PorterDashboardPage />} />
        <Route
          path="/porter_dashboard.html"
          element={<Navigate to="/porter-dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}
