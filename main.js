import QRCode from "qrcode";

const nombreInput = document.getElementById("nombre");
const codigoInput = document.getElementById("codigo");
const menuOptions = document.getElementById("menuOptions");
const resumenPlato = document.getElementById("resumenPlato");
const resumenPrecio = document.getElementById("resumenPrecio");
const btnSimularPago = document.getElementById("btnSimularPago");

const ticketSheet = document.getElementById("ticketSheet");
const cerrarTicketBtn = document.getElementById("cerrarTicket");
const qrCanvas = document.getElementById("qrCanvas");

const ticketNombre = document.getElementById("ticketNombre");
const ticketCodigo = document.getElementById("ticketCodigo");
const ticketPlato = document.getElementById("ticketPlato");
const ticketPrecio = document.getElementById("ticketPrecio");
const ticketId = document.getElementById("ticketId");

const toastEl = document.getElementById("toast");

let selectedOption = menuOptions.querySelector(".menu-option.selected");

// Enforce uppercase and trim spaces in código input
codigoInput.addEventListener("input", () => {
  codigoInput.value = codigoInput.value.toUpperCase().replace(/\s+/g, "");
});

// Helper: format price
function formatCOP(value) {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  });
}

// Toast
let toastTimeout = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("toast--visible");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 2200);
}

// Handle menu selection
menuOptions.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-option");
  if (!btn) return;

  if (selectedOption) selectedOption.classList.remove("selected");
  selectedOption = btn;
  selectedOption.classList.add("selected");

  const nombre = btn.dataset.nombre;
  const precio = Number(btn.dataset.precio || "0");
  resumenPlato.textContent = nombre;
  resumenPrecio.textContent = formatCOP(precio);
});

// Payment simulation and ticket generation
btnSimularPago.addEventListener("click", async () => {
  const nombre = nombreInput.value.trim();
  const codigo = codigoInput.value.trim();
  if (!nombre || !codigo) {
    showToast("Por favor completa tu nombre y código estudiantil.");
    return;
  }

  // Validate código pattern: T000XXXXX (e.g., T00059876)
  const codigoValido = /^T000\d{5}$/i.test(codigo);
  if (!codigoValido) {
    showToast('El código estudiantil debe tener el formato T000XXXXX (por ejemplo, T00059876).');
    return;
  }

  if (!selectedOption) {
    showToast("Selecciona un almuerzo.");
    return;
  }

  btnSimularPago.disabled = true;
  btnSimularPago.textContent = "Procesando pago simulado...";

  // Simulate short delay
  await new Promise((res) => setTimeout(res, 900));

  const platoNombre = selectedOption.dataset.nombre;
  const precio = Number(selectedOption.dataset.preco || selectedOption.dataset.precio || "0");
  const ticketCode = generateTicketCode(nombre, codigo, selectedOption.dataset.id);

  // Fill ticket info
  ticketNombre.textContent = nombre;
  ticketCodigo.textContent = codigo.toUpperCase();
  ticketPlato.textContent = platoNombre;
  ticketPrecio.textContent = formatCOP(precio);
  ticketId.textContent = ticketCode;

  // Create QR payload
  const payload = `Reclama tu ${platoNombre} en la cafetería`;

  try {
    await QRCode.toCanvas(qrCanvas, payload, {
      width: 180,
      margin: 1,
      color: {
        dark: "#252322",
        light: "#FFFFFF"
      }
    });
    openTicketSheet();
  } catch (err) {
    console.error(err);
    showToast("No se pudo generar el código. Intenta de nuevo.");
  } finally {
    btnSimularPago.disabled = false;
    btnSimularPago.textContent = "Pagar y generar ticket";
  }
});

function generateTicketCode(nombre, codigo, platoId) {
  const cleanName = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");

  const cleanCodigo = codigo.replace(/\D/g, "").slice(-4).padStart(4, "0");
  const platoTag = (platoId || "ALM").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  const shortTime = Date.now().toString(36).toUpperCase().slice(-4);

  return `${cleanName}-${cleanCodigo}-${platoTag}-${shortTime}`;
}

// Ticket sheet controls
function openTicketSheet() {
  ticketSheet.classList.add("bottom-sheet--visible");
}

function closeTicketSheet() {
  ticketSheet.classList.remove("bottom-sheet--visible");
}

cerrarTicketBtn.addEventListener("click", closeTicketSheet);

// Close ticket on background tap (outside content)
ticketSheet.addEventListener("click", (e) => {
  const content = ticketSheet.querySelector(".bottom-sheet__content");
  if (!content.contains(e.target)) {
    closeTicketSheet();
  }
});

// Prevent touch scroll inside sheet (keep whole app single-screen)
ticketSheet.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);