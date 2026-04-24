import { useEffect } from "react";

function toRoutePath(href) {
  if (!href || href === "#") {
    return null;
  }

  if (href.startsWith("#")) {
    return href;
  }

  if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) {
    return null;
  }

  if (href.endsWith(".html")) {
    const fileName = href.split("/").pop();

    if (fileName === "index.html") {
      return "/";
    }

    if (fileName === "porter_profile.html") {
      return "/porter-profile";
    }

    if (fileName === "porter_dashboard.html") {
      return "/porter-dashboard";
    }

    return `/${fileName.replace(".html", "")}`;
  }

  return href;
}

export function useLegacyPage({ containerRef, html, navigate, setup }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = html;

    const cleanupList = [];

    const onLinkClick = (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor || !container.contains(anchor)) {
        return;
      }

      const href = anchor.getAttribute("href");
      const routePath = toRoutePath(href);

      if (!routePath) {
        return;
      }

      if (routePath.startsWith("#")) {
        const target = container.querySelector(routePath);
        if (target) {
          event.preventDefault();
          window.scrollTo({ top: target.offsetTop - 20, behavior: "smooth" });
        }
        return;
      }

      event.preventDefault();
      navigate(routePath);
    };

    container.addEventListener("click", onLinkClick);
    cleanupList.push(() => container.removeEventListener("click", onLinkClick));

    const extraCleanup = setup?.({ container, navigate, toRoutePath });

    return () => {
      if (typeof extraCleanup === "function") {
        extraCleanup();
      }

      cleanupList.forEach((fn) => fn());
      container.innerHTML = "";
    };
  }, [containerRef, html, navigate, setup]);
}
