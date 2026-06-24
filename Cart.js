// ---------- CONFIG ----------
// Replace this with your real WhatsApp number (with country code, no + or spaces)
// e.g. "919876543210" for an Indian number
const WHATSAPP_NUMBER = "91XXXXXXXXXX";

const STORE = {
  product: "A Changed Woman™",
  price: 0,
  oldPrice: "Emotionally Unavailable",
};

// ---------- CART STATE (localStorage) ----------
function getCart() {
  const raw = localStorage.getItem("cw_cart");
  return raw ? JSON.parse(raw) : { items: 0 };
}
function setCart(cart) {
  localStorage.setItem("cw_cart", JSON.stringify(cart));
  updateCartBadge();
}
function addToCart() {
  const cart = getCart();
  cart.items = 1; // single product, single unit — no need for quantity creep
  setCart(cart);
  showToast("Added to cart — she's in your bag now.");
}
function updateCartBadge() {
  const cart = getCart();
  document.querySelectorAll(".cart-badge").forEach((el) => {
    el.textContent = cart.items || 0;
  });
}

// ---------- TOAST ----------
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

// ---------- ADDRESS SELECTION (checkout page) ----------
function selectAddress(value) {
  document.querySelectorAll(".addr-option").forEach((el) => {
    el.classList.toggle("selected", el.dataset.value === value);
  });
  const input = document.querySelector(`input[name="address"][value="${value}"]`);
  if (input) input.checked = true;
}

// ---------- ORDER ID ----------
function generateOrderId() {
  const existing = sessionStorage.getItem("cw_order_id");
  if (existing) return existing;
  const id = "CW-" + Math.floor(100000 + Math.random() * 900000);
  sessionStorage.setItem("cw_order_id", id);
  return id;
}

// ---------- PLACE ORDER (checkout page submit) ----------
function placeOrder(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    address: form.querySelector('input[name="address"]:checked')?.value || "",
    date: form.date.value,
    time: form.time.value,
    notes: form.notes.value.trim(),
  };

  if (!data.phone || !data.address || !data.date || !data.time) {
    showToast("Fill in every field — she doesn't do half-measures.");
    return;
  }

  localStorage.setItem("cw_order", JSON.stringify(data));
  window.location.href = "receipt.html";
}

// ---------- RENDER RECEIPT ----------
function renderReceipt() {
  const data = JSON.parse(localStorage.getItem("cw_order") || "{}");
  const orderId = generateOrderId();
  const now = new Date();

  const fields = {
    "r-order-id": orderId,
    "r-name": data.name || "—",
    "r-phone": data.phone || "—",
    "r-address": data.address === "your-place" ? "Your place" : data.address === "my-place" ? "My place" : "—",
    "r-date": data.date ? formatDate(data.date) : "—",
    "r-time": data.time ? formatTime(data.time) : "—",
    "r-notes": data.notes || "Handle with care. No returns.",
    "r-timestamp": now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  // Build WhatsApp link with prefilled message
  const msg =
    `Hey! I just placed an order for ${STORE.product}.\n` +
    `Order ID: ${orderId}\n` +
    `Delivering to: ${fields["r-address"]}\n` +
    `Date & time: ${fields["r-date"]}, ${fields["r-time"]}\n` +
    `— ${data.name || "your customer"}`;

  const link = document.getElementById("whatsapp-link");
  if (link) {
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();

  document.querySelectorAll(".addr-option").forEach((el) => {
    el.addEventListener("click", () => selectAddress(el.dataset.value));
  });

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) checkoutForm.addEventListener("submit", placeOrder);

  if (document.getElementById("r-order-id")) renderReceipt();

  // Prevent checkout access with an empty cart
  if (document.body.dataset.requireCart === "true") {
    const cart = getCart();
    if (!cart.items) {
      window.location.href = "product.html";
    }
  }
});
