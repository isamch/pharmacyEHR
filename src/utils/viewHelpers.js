// Format a JS Date object to a readable string in Arabic
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("ar-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Truncate long text to a specific length with "..."
export const truncate = (text, length = 50) => {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

// Remove all HTML tags from a string
export const stripTags = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");

// Generate asset URL with cache-busting version
export const asset = (path) => `/assets/${path}?v=${Date.now()}`;

// Add "active" class if the current path matches link path
export const isActive = (currentPath, linkPath) => currentPath === linkPath ? "active" : "";

// Generate simple pagination links HTML
export const paginate = (currentPage, totalPages) => {
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<a href="?page=${i}" class="${i === currentPage ? "active" : ""}">${i}</a> `;
  }
  return html;
};

// Convert file size in bytes to human-readable string (B, KB, MB, GB)
export const humanFileSize = (size) => {
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return (size / Math.pow(1024, i)).toFixed(2) * 1 + " " + ["B", "KB", "MB", "GB"][i];
};

// Generate breadcrumb HTML from array of {url, label} objects
export const breadcrumb = (paths) => paths.map(p => `<a href="${p.url}">${p.label}</a>`).join(" > ");
