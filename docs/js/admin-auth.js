(function (root) {
  "use strict";

  async function fetchAdminSession() {
    const response = await fetch("/api/admin/auth", {
      credentials: "include",
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Could not check admin session.");
    }
    return {
      configured: result.configured !== false,
      loginRequired: Boolean(result.loginRequired),
      authenticated: Boolean(result.authenticated),
    };
  }

  async function loginAdmin(username, password) {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Login failed.");
    }
    return result;
  }

  async function logoutAdmin() {
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Logout failed.");
    }
    return result;
  }

  root.BrushAdminAuth = {
    fetchAdminSession,
    loginAdmin,
    logoutAdmin,
  };
})(typeof window !== "undefined" ? window : globalThis);
