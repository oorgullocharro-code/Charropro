import { logCharroProVersion } from "./version.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

logCharroProVersion("runtime");

const activeToastMessages = new Map();

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

  const normalizedMessage = String(message || "");
  const active = activeToastMessages.get(normalizedMessage);
  if (active && active.isConnected !== false) return active;

  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = normalizedMessage;
  root.appendChild(node);
  activeToastMessages.set(normalizedMessage, node);

  window.setTimeout(() => {
    node.style.opacity = "0";
    node.style.transform = "translateY(-6px)";
    node.style.transition = "opacity .2s, transform .2s";
    window.setTimeout(() => {
      node.remove();
      if (activeToastMessages.get(normalizedMessage) === node) activeToastMessages.delete(normalizedMessage);
    }, 220);
  }, 2300);
  return node;
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
