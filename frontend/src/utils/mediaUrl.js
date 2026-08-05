const API_BASE =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "/api"
    : "https://mock-test-platform-2scg.onrender.com/api");

/** Origin for media files (strip /api suffix) */
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
};
