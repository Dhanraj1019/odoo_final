/**
 * Centralized API Fetch Wrapper with Session Credential Preservation
 * Specification: 20-FRONTEND-ARCHITECTURE.md §7
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get("content-type");
  let body = null;

  if (contentType && contentType.includes("application/json")) {
    body = await response.json().catch(() => null);
  } else if (contentType && contentType.includes("application/pdf")) {
    body = await response.blob().catch(() => null);
  } else {
    body = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg =
      (body && body.message) ||
      (body && body.error) ||
      `HTTP Error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = body;
    throw error;
  }

  return body;
}

export default apiFetch;
