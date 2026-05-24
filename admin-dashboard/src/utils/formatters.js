export const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

export const cn = (...c) => c.filter(Boolean).join(" ");

export const escapeHtml = (str) => {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

export function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}
