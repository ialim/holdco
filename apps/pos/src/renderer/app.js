const apiStatusEl = document.getElementById("apiStatus");
const checkHealthButton = document.getElementById("checkHealth");
const flushQueueButton = document.getElementById("flushQueue");
const reloadConfigButton = document.getElementById("reloadConfig");
const reloadLocationsButton = document.getElementById("reloadLocations");
const locationSelect = document.getElementById("locationSelect");
const refreshDeviceButton = document.getElementById("refreshDevice");
const refreshShiftButton = document.getElementById("refreshShift");
const refreshQueueButton = document.getElementById("refreshQueue");
const queueOutput = document.getElementById("queueOutput");
const queueSummary = document.getElementById("queueSummary");
const toastEl = document.getElementById("toast");
const configStatusEl = document.getElementById("configStatus");
const configRawEl = document.getElementById("configRaw");
const cashierStatusEl = document.getElementById("cashierStatus");
const cashierLoginForm = document.getElementById("cashierLoginForm");
const cashierEmployeeNoInput = document.getElementById("cashierEmployeeNo");
const cashierPinInput = document.getElementById("cashierPin");
const cashierInfo = document.getElementById("cashierInfo");
const cashierLogoutButton = document.getElementById("cashierLogout");
const wizardConfigStatus = document.getElementById("wizardConfigStatus");
const wizardDeviceStatus = document.getElementById("wizardDeviceStatus");
const wizardCashierStatus = document.getElementById("wizardCashierStatus");
const wizardShiftStatus = document.getElementById("wizardShiftStatus");
const wizardRefreshButton = document.getElementById("wizardRefresh");
const wizardOpenShiftButton = document.getElementById("wizardOpenShift");

const configFields = {
  api: document.getElementById("configApi"),
  group: document.getElementById("configGroup"),
  subsidiary: document.getElementById("configSubsidiary"),
  location: document.getElementById("configLocation"),
  channel: document.getElementById("configChannel"),
  device: document.getElementById("configDevice")
};

const deviceInfo = document.getElementById("deviceInfo");

const openShiftForm = document.getElementById("openShiftForm");
const openingFloatInput = document.getElementById("openingFloat");
const openNotesInput = document.getElementById("openNotes");
const closeShiftForm = document.getElementById("closeShiftForm");
const closingFloatInput = document.getElementById("closingFloat");
const closeNotesInput = document.getElementById("closeNotes");
const shiftInfo = document.getElementById("shiftInfo");

const searchProductsButton = document.getElementById("searchProducts");
const productSearchInput = document.getElementById("productSearch");
const productResults = document.getElementById("productResults");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const orderCurrencyInput = document.getElementById("orderCurrency");
const orderNotesInput = document.getElementById("orderNotes");
const submitOrderButton = document.getElementById("submitOrder");
const clearCartButton = document.getElementById("clearCart");
const orderStatus = document.getElementById("orderStatus");

const state = {
  config: null,
  locations: [],
  selectedLocationId: null,
  openShift: null,
  cashierToken: null,
  cashier: null,
  online: false,
  catalogResults: [],
  cart: []
};

function showToast(message, tone = "neutral") {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  toastEl.style.background = tone === "error" ? "#b3412f" : "#1c1b18";
  setTimeout(() => toastEl.classList.remove("show"), 2400);
}

function safeText(value) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function maskConfig(config) {
  const masked = { ...config };
  if (masked.jwt) masked.jwt = "***";
  if (masked.cashierToken) masked.cashierToken = "***";
  if (masked.managerToken) masked.managerToken = "***";
  return masked;
}

function buildQuery(params) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return "";
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `?${query}`;
}

function setApiStatus(online) {
  state.online = online;
  apiStatusEl.textContent = online ? "Online" : "Offline";
  apiStatusEl.classList.toggle("online", online);
}

function renderCashier() {
  if (!cashierStatusEl || !cashierInfo) return;
  if (state.cashierToken) {
    cashierStatusEl.textContent = "Signed in";
    cashierStatusEl.classList.add("online");
    if (state.cashier) {
      cashierInfo.textContent = `${state.cashier.name || state.cashier.email} (${state.cashier.email})`;
    } else {
      cashierInfo.textContent = "Cashier token loaded.";
    }
  } else {
    cashierStatusEl.textContent = "Signed out";
    cashierStatusEl.classList.remove("online");
    cashierInfo.textContent = "No cashier signed in.";
  }
}

function updateStatusPill(el, ready, labelReady, labelPending) {
  if (!el) return;
  el.textContent = ready ? labelReady : labelPending;
  el.classList.toggle("ready", ready);
}

function updateWizard() {
  const configReady = Boolean(
    state.config?.apiBaseUrl &&
      state.config?.jwt &&
      state.config?.groupId &&
      state.config?.subsidiaryId &&
      state.config?.locationId &&
      state.config?.deviceId
  );
  const deviceReady = Boolean(state.config?.deviceId && state.config?.locationId);
  updateStatusPill(wizardConfigStatus, configReady, "Ready", "Pending");
  updateStatusPill(wizardDeviceStatus, deviceReady, "Configured", "Pending");
  updateStatusPill(wizardCashierStatus, Boolean(state.cashierToken), "Signed in", "Pending");
  updateStatusPill(wizardShiftStatus, Boolean(state.openShift), "Open", "Pending");
}

function setCashierSession(token, user) {
  state.cashierToken = token;
  state.cashier = user;
  if (state.config && window.pos?.saveConfig) {
    state.config = window.pos.saveConfig({ cashierToken: token, cashierUser: user });
    configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
  }
  renderCashier();
  updateWizard();
}

function clearCashierSession() {
  state.cashierToken = null;
  state.cashier = null;
  if (state.config && window.pos?.saveConfig) {
    state.config = window.pos.saveConfig({ cashierToken: null, cashierUser: null });
    configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
  }
  renderCashier();
  updateWizard();
}

async function checkHealth() {
  try {
    const response = await window.pos.request({ method: "GET", path: "/health" });
    setApiStatus(response.ok);
  } catch (error) {
    setApiStatus(false);
  }
}

function loadConfig() {
  try {
    if (!window.pos) {
      throw new Error("POS bridge not available. Restart the app.");
    }
    if (window.pos.error) {
      throw new Error(`Preload error: ${window.pos.error}`);
    }
    if (typeof window.pos.getConfig !== "function") {
      throw new Error("POS bridge missing getConfig(). Restart the app.");
    }
    state.config = window.pos.getConfig();
  } catch (error) {
    state.config = null;
    configStatusEl.textContent = `Config load failed: ${error.message || error}`;
    configStatusEl.classList.add("error");
    configRawEl.textContent = "";
    configFields.api.textContent = "Config load failed";
    configFields.group.textContent = "-";
    configFields.subsidiary.textContent = "-";
    configFields.location.textContent = "-";
    configFields.channel.textContent = "-";
    configFields.device.textContent = "-";
    showToast(`Config error: ${error.message || error}`, "error");
    return;
  }

  configStatusEl.textContent = "Config loaded.";
  configStatusEl.classList.remove("error");
  configFields.api.textContent = safeText(state.config.apiBaseUrl);
  configFields.group.textContent = safeText(state.config.groupId);
  configFields.subsidiary.textContent = safeText(state.config.subsidiaryId);
  configFields.location.textContent = safeText(state.config.locationId);
  configFields.channel.textContent = safeText(state.config.channel);
  configFields.device.textContent = safeText(state.config.deviceId);
  state.cashierToken = state.config.cashierToken || null;
  state.cashier = state.config.cashierUser || null;
  renderCashier();
  updateWizard();
  configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
}

function renderLocations() {
  locationSelect.innerHTML = "";
  const fallback = document.createElement("option");
  fallback.value = "";
  fallback.textContent = state.locations.length ? "Select location" : "No locations";
  locationSelect.appendChild(fallback);

  for (const location of state.locations) {
    const option = document.createElement("option");
    option.value = location.id;
    option.textContent = location.name;
    locationSelect.appendChild(option);
  }

  const defaultLocation = state.config?.locationId || state.selectedLocationId;
  if (defaultLocation) {
    locationSelect.value = defaultLocation;
    state.selectedLocationId = defaultLocation;
  } else if (state.locations.length) {
    locationSelect.value = state.locations[0].id;
    state.selectedLocationId = state.locations[0].id;
  }
  updateWizard();
}

async function loadLocations() {
  if (!state.config) {
    showToast("Config not loaded. Reload the app.", "error");
    return;
  }

  const query = buildQuery({ subsidiary_id: state.config.subsidiaryId, limit: 50 });
  const response = await window.pos.request({
    method: "GET",
    path: `/locations${query}`,
    extraHeaders: getRequestHeaders()
  });

  if (!response.ok) {
    const message = response.data?.message || `Failed to load locations (${response.status})`;
    showToast(message, "error");
    return;
  }

  state.locations = response.data?.data || [];
  renderLocations();
}

function renderQueue() {
  const queue = window.pos.readQueue();
  queueSummary.textContent = `${queue.length} queued operation${queue.length === 1 ? "" : "s"}.`;
  queueOutput.textContent = JSON.stringify(queue, null, 2);
}

async function refreshDevice() {
  const deviceId = state.config?.deviceId;
  if (!deviceId) {
    deviceInfo.textContent = "Device ID missing. Set it in config.";
    updateWizard();
    return;
  }

  const locationId = state.selectedLocationId || state.config?.locationId;
  const lines = [
    `Device ID: ${deviceId}`,
    `Location: ${locationId ?? "-"}`,
    "Provisioned in Admin-Ops."
  ];
  deviceInfo.textContent = lines.join("\n");
  updateWizard();
}

async function refreshOpenShift() {
  const deviceId = state.config?.deviceId;
  if (!deviceId || !state.selectedLocationId) {
    shiftInfo.textContent = "Select a location and ensure device ID is set.";
    updateWizard();
    return;
  }

  const query = buildQuery({
    subsidiary_id: state.config?.subsidiaryId,
    location_id: state.selectedLocationId,
    device_id: deviceId,
    status: "open",
    limit: 1
  });
  const response = await window.pos.request({ method: "GET", path: `/pos/shifts${query}`, extraHeaders: getRequestHeaders() });

  if (!response.ok) {
    shiftInfo.textContent = "Unable to load shifts.";
    return;
  }

  const shift = response.data?.data?.[0];
  state.openShift = shift || null;
  if (!shift) {
    shiftInfo.textContent = "No open shift.";
    return;
  }

  const lines = [
    `Shift: ${shift.id}`,
    `Opened: ${shift.opened_at}`,
    `Opening float: ${shift.opening_float ?? 0}`
  ];
  shiftInfo.textContent = lines.join("\n");
  updateWizard();
}

function renderProducts() {
  productResults.innerHTML = "";
  if (!state.catalogResults.length) {
    productResults.textContent = "No products found.";
    return;
  }

  for (const product of state.catalogResults) {
    const row = document.createElement("div");
    row.className = "product-row";

    const info = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = product.name;
    const meta = document.createElement("div");
    meta.className = "mono";
    meta.textContent = `SKU: ${product.sku}`;
    info.appendChild(name);
    info.appendChild(meta);

    const action = document.createElement("button");
    action.className = "ghost";
    action.textContent = "Add";
    action.addEventListener("click", () => addToCart(product));

    row.appendChild(info);
    row.appendChild(action);
    productResults.appendChild(row);
  }
}

function updateCartSummary() {
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  cartCount.textContent = `${itemCount}`;
  cartTotal.textContent = total.toFixed(2);
}

function renderCart() {
  cartItems.innerHTML = "";
  if (!state.cart.length) {
    cartItems.textContent = "Cart is empty.";
    updateCartSummary();
    return;
  }

  state.cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    const name = document.createElement("div");
    name.textContent = item.name;

    const qty = document.createElement("input");
    qty.type = "number";
    qty.min = "1";
    qty.value = String(item.quantity);
    qty.addEventListener("change", () => {
      const next = Number(qty.value);
      item.quantity = Number.isFinite(next) && next > 0 ? next : 1;
      qty.value = String(item.quantity);
      renderCart();
    });

    const price = document.createElement("input");
    price.type = "number";
    price.min = "0";
    price.step = "0.01";
    price.value = String(item.unitPrice);
    price.addEventListener("change", () => {
      const next = Number(price.value);
      item.unitPrice = Number.isFinite(next) && next >= 0 ? next : 0;
      price.value = String(item.unitPrice);
      renderCart();
    });

    const total = document.createElement("div");
    total.className = "mono";
    total.textContent = (item.unitPrice * item.quantity).toFixed(2);

    const remove = document.createElement("button");
    remove.className = "ghost";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.cart.splice(index, 1);
      renderCart();
    });

    row.appendChild(name);
    row.appendChild(qty);
    row.appendChild(price);
    row.appendChild(total);
    row.appendChild(remove);
    cartItems.appendChild(row);
  });

  updateCartSummary();
}

function addToCart(product) {
  const existing = state.cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: 0
    });
  }
  renderCart();
}

async function loadProducts() {
  if (!state.config?.subsidiaryId) {
    showToast("Missing subsidiaryId in config.", "error");
    return;
  }

  const query = buildQuery({ q: productSearchInput.value.trim(), limit: 20 });
  const response = await window.pos.request({ method: "GET", path: `/products${query}`, extraHeaders: getRequestHeaders() });
  if (!response.ok) {
    const message = response.data?.message || `Failed to load products (${response.status})`;
    showToast(message, "error");
    return;
  }

  state.catalogResults = response.data?.data || [];
  renderProducts();
}

async function submitOrder() {
  if (!state.cart.length) {
    showToast("Cart is empty.", "error");
    return;
  }

  const currency = orderCurrencyInput.value.trim().toUpperCase() || "NGN";
  const items = state.cart.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice
  }));
  const payload = {
    order: {
      currency,
      items,
      notes: orderNotesInput.value.trim() || undefined
    },
    reserve_stock: true
  };

  orderStatus.textContent = "Submitting order...";
  const result = await safeWrite({
    method: "POST",
    path: "/adapters/retail/checkout",
    body: payload,
    scope: `orders.create:${Date.now()}`
  });

  if (result.queued) {
    orderStatus.textContent = "Order queued (offline).";
    return;
  }

  const order = result.response?.data?.order ?? result.response?.data;
  if (order) {
    orderStatus.textContent = `Order created: ${order.order_no} (${order.total_amount} ${order.currency})`;
  } else {
    orderStatus.textContent = "Order created.";
  }
  state.cart = [];
  renderCart();
}

function getRequestHeaders(options = {}) {
  const headers = {};
  const includeCashier = options.includeCashier !== false;
  const authToken = options.authToken;
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  if (state.selectedLocationId) {
    headers["X-Location-Id"] = state.selectedLocationId;
  }
  if (includeCashier && state.cashierToken) {
    headers["X-Cashier-Token"] = `Bearer ${state.cashierToken}`;
  }
  return headers;
}

async function safeWrite({ method, path, body, scope, authToken, includeCashier }) {
  const idempotencyKey = window.pos.buildIdempotencyKey(scope, body || {});
  const extraHeaders = getRequestHeaders({ authToken, includeCashier });
  if (!state.online) {
    window.pos.enqueueOperation({ method, path, body, idempotencyKey, extraHeaders });
    renderQueue();
    showToast("Offline: queued operation.");
    return { queued: true };
  }

  try {
    const response = await window.pos.request({
      method,
      path,
      body,
      idempotencyKey,
      extraHeaders
    });

    if (response.ok || response.status === 409) {
      return { queued: false, response };
    }

    showToast(`Request failed (${response.status}).`, "error");
    return { queued: false, response };
  } catch (error) {
    window.pos.enqueueOperation({ method, path, body, idempotencyKey, extraHeaders });
    renderQueue();
    showToast("Network error: queued operation.");
    return { queued: true };
  }
}

if (cashierLoginForm) {
  cashierLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.config) {
      showToast("Config not loaded. Reload the app.", "error");
      return;
    }

    const employeeNo = cashierEmployeeNoInput.value.trim();
    const pin = cashierPinInput.value.trim();
    if (!employeeNo || !pin) {
      showToast("Employee number and PIN are required.", "error");
      return;
    }

    const response = await window.pos.request({
      method: "POST",
      path: "/pos/cashiers/login",
      body: { employee_no: employeeNo, pin },
      extraHeaders: getRequestHeaders({ includeCashier: false })
    });

    if (!response.ok) {
      const message = response.data?.message || "Cashier login failed.";
      showToast(message, "error");
      return;
    }

    setCashierSession(response.data?.access_token, response.data?.user);
    cashierPinInput.value = "";
    showToast("Cashier signed in.");
  });
}

if (cashierLogoutButton) {
  cashierLogoutButton.addEventListener("click", () => {
    clearCashierSession();
    showToast("Cashier signed out.");
  });
}

openShiftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedLocationId) {
    showToast("Select a location first.", "error");
    return;
  }
  if (!state.config?.deviceId) {
    showToast("Device ID missing in config.", "error");
    return;
  }

  const payload = {
    device_id: state.config.deviceId,
    opening_float: openingFloatInput.value ? Number(openingFloatInput.value) : undefined,
    notes: openNotesInput.value.trim() || undefined
  };

  const result = await safeWrite({ method: "POST", path: "/pos/shifts", body: payload, scope: "pos.shift.open" });
  if (!result.queued) {
    showToast("Shift opened.");
    await refreshOpenShift();
  }
});

closeShiftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.openShift) {
    showToast("No open shift to close.", "error");
    return;
  }

  const payload = {
    closing_float: closingFloatInput.value ? Number(closingFloatInput.value) : undefined,
    notes: closeNotesInput.value.trim() || undefined
  };

  const result = await safeWrite({
    method: "POST",
    path: `/pos/shifts/${state.openShift.id}/close`,
    body: payload,
    scope: `pos.shift.close:${state.openShift.id}`
  });
  if (!result.queued) {
    showToast("Shift closed.");
    await refreshOpenShift();
  }
});

locationSelect.addEventListener("change", async () => {
  state.selectedLocationId = locationSelect.value || null;
  const selected = state.locations.find((location) => location.id === state.selectedLocationId);
  if (selected && state.config) {
    state.config = window.pos.saveConfig({
      subsidiaryId: selected.subsidiary_id,
      locationId: selected.id
    });
    configFields.subsidiary.textContent = safeText(state.config.subsidiaryId);
    configFields.location.textContent = safeText(state.config.locationId);
  }
  updateWizard();
  await refreshDevice();
  await refreshOpenShift();
});

searchProductsButton.addEventListener("click", loadProducts);
productSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loadProducts();
  }
});

submitOrderButton.addEventListener("click", submitOrder);
clearCartButton.addEventListener("click", () => {
  state.cart = [];
  orderStatus.textContent = "Cart cleared.";
  renderCart();
});

refreshDeviceButton.addEventListener("click", refreshDevice);
refreshShiftButton.addEventListener("click", refreshOpenShift);
refreshQueueButton.addEventListener("click", renderQueue);
reloadConfigButton.addEventListener("click", () => {
  loadConfig();
  renderLocations();
});
reloadLocationsButton.addEventListener("click", loadLocations);
checkHealthButton.addEventListener("click", checkHealth);
if (wizardRefreshButton) {
  wizardRefreshButton.addEventListener("click", async () => {
    loadConfig();
    await loadLocations();
    await refreshDevice();
    await refreshOpenShift();
    updateWizard();
  });
}

if (wizardOpenShiftButton) {
  wizardOpenShiftButton.addEventListener("click", () => {
    if (!openShiftForm) return;
    if (typeof openShiftForm.requestSubmit === "function") {
      openShiftForm.requestSubmit();
    } else {
      openShiftForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
}

flushQueueButton.addEventListener("click", async () => {
  flushQueueButton.disabled = true;
  flushQueueButton.textContent = "Flushing...";
  try {
    await window.pos.flushQueue();
    renderQueue();
    showToast("Queue flushed.");
  } finally {
    flushQueueButton.disabled = false;
    flushQueueButton.textContent = "Flush Queue";
  }
});

async function bootstrap() {
  loadConfig();
  renderCashier();
  updateWizard();
  await checkHealth();
  await loadLocations();
  await refreshDevice();
  await refreshOpenShift();
  renderQueue();
  renderCart();
  renderProducts();
}

bootstrap();
