import { logCharroProVersion } from "./version.js?v=20260713-broadcast-state-001-state-v1";

logCharroProVersion("runtime");

export function html(strings, ...values) {
  return strings.reduce((result, part, index) => result + part + (values[index] ?? ""), "");
}

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return map[char];
  });
}

export function moneylessNumber(value) {
  return Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 1 });
}

export function showToast(message) {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  root.appendChild(node);

  window.setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(-6px)";
    node.style.transition = "opacity .2s, transform .2s";
    window.setTimeout(() => node.remove(), 220);
  }, 2300);
}

export function closeModal() {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.classList.add("hidden");
  root.innerHTML = "";
}

export function showModal({ title, body, actions = "" }) {
  const root = document.getElementById("modal-root");
  if (!root) return;

  root.innerHTML = html`
    <section class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>${escapeHTML(title)}</h2>
        <button class="button ghost small" data-action="close-modal">Cerrar</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actions}</div>
    </section>
  `;
  root.classList.remove("hidden");
}
