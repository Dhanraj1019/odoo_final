/**
 * Currency Formatter
 */
export const formatCurrency = (amount, currency = "USD") => {
  const num = typeof amount === "number" ? amount : Number(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Date Formatter (YYYY-MM-DD or readable)
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  if (options.iso) {
    return date.toISOString().slice(0, 10);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: options.shortMonth ? "short" : "long",
    day: "numeric",
    ...options,
  });
};

/**
 * Date Time Formatter
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Hours / Duration Formatter
 */
export const formatHours = (hours) => {
  const num = typeof hours === "number" ? hours : Number(hours) || 0;
  return `${num.toFixed(1)} hrs`;
};
