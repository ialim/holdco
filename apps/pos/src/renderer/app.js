const apiStatusEl = document.getElementById("apiStatus");
const checkHealthButton = document.getElementById("checkHealth");
const flushQueueButton = document.getElementById("flushQueue");
const reloadConfigButton = document.getElementById("reloadConfig");
const reloadConfigMissingButton = document.getElementById("reloadConfigMissing");
const refreshDeviceButton = document.getElementById("refreshDevice");
const refreshShiftButton = document.getElementById("refreshShift");
const refreshQueueButton = document.getElementById("refreshQueue");
const queueOutput = document.getElementById("queueOutput");
const queueSummary = document.getElementById("queueSummary");
const queueCount = document.getElementById("queueCount");
const toastEl = document.getElementById("toast");
const configStatusEl = document.getElementById("configStatus");
const configMissingMessage = document.getElementById("configMissingMessage");
const configRawEl = document.getElementById("configRaw");
const cashierStatusEl = document.getElementById("cashierStatus");
const cashierLoginForm = document.getElementById("cashierLoginForm");
const cashierEmployeeNoInput = document.getElementById("cashierEmployeeNo");
const cashierPinInput = document.getElementById("cashierPin");
const cashierInfo = document.getElementById("cashierInfo");
const cashierLogoutButton = document.getElementById("cashierLogout");
const managerActivateForm = document.getElementById("managerActivateForm");
const managerEmployeeNoInput = document.getElementById("managerEmployeeNo");
const managerPinInput = document.getElementById("managerPin");
const managerInfo = document.getElementById("managerInfo");
const offlineBanner = document.getElementById("offlineBanner");
const deviceTokenStatus = document.getElementById("deviceTokenStatus");
const deviceTokenExpiry = document.getElementById("deviceTokenExpiry");
const shiftBannerStatus = document.getElementById("shiftBannerStatus");
const shiftBannerDetail = document.getElementById("shiftBannerDetail");
const viewLoading = document.getElementById("viewLoading");
const viewConfigMissing = document.getElementById("viewConfigMissing");
const viewActivation = document.getElementById("viewActivation");
const viewCashier = document.getElementById("viewCashier");
const viewShift = document.getElementById("viewShift");
const viewCheckout = document.getElementById("viewCheckout");
const navShiftButton = document.getElementById("navShift");
const navCheckoutButton = document.getElementById("navCheckout");
const navSignOutButton = document.getElementById("navSignOut");
const proceedCheckoutButton = document.getElementById("proceedCheckout");

const configFields = {
  api: document.getElementById("configApi"),
  group: document.getElementById("configGroup"),
  subsidiary: document.getElementById("configSubsidiary"),
  location: document.getElementById("configLocation"),
  channel: document.getElementById("configChannel"),
  categoryFacet: document.getElementById("configCategoryFacet"),
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
const checkoutDate = document.getElementById("checkoutDate");
const checkoutLocation = document.getElementById("checkoutLocation");
const checkoutBiller = document.getElementById("checkoutBiller");
const checkoutCustomer = document.getElementById("checkoutCustomer");
const addCustomerButton = document.getElementById("addCustomer");
const customerModal = document.getElementById("customerModal");
const customerSearchInput = document.getElementById("customerSearch");
const customerSearchButton = document.getElementById("customerSearchBtn");
const customerResults = document.getElementById("customerResults");
const closeCustomerModalButton = document.getElementById("closeCustomerModal");
const setWalkInButton = document.getElementById("setWalkIn");
const categoryTabs = document.getElementById("categoryTabs");
const brandTabs = document.getElementById("brandTabs");
const featuredHint = document.getElementById("featuredHint");
const filterCategoryButton = document.getElementById("filterCategory");
const filterBrandButton = document.getElementById("filterBrand");
const filterFeaturedButton = document.getElementById("filterFeatured");
const productCount = document.getElementById("productCount");
const cartDiscount = document.getElementById("cartDiscount");
const cartTax = document.getElementById("cartTax");
const cartShipping = document.getElementById("cartShipping");
const cartGrandTotal = document.getElementById("cartGrandTotal");
const discountInput = document.getElementById("discountInput");
const taxRateInput = document.getElementById("taxRateInput");
const shippingInput = document.getElementById("shippingInput");
const couponCodeInput = document.getElementById("couponCode");
const applyCouponButton = document.getElementById("applyCoupon");
const couponStatus = document.getElementById("couponStatus");
const filterDrawer = document.getElementById("filterDrawer");
const filterDrawerTitle = document.getElementById("filterDrawerTitle");
const closeFilterDrawerButton = document.getElementById("closeFilterDrawer");
const payCardButton = document.getElementById("payCard");
const payCashButton = document.getElementById("payCash");
const payTransferButton = document.getElementById("payTransfer");
const paySplitButton = document.getElementById("paySplit");
const payInstallmentButton = document.getElementById("payInstallment");
const payDepositButton = document.getElementById("payDeposit");
const payPointsButton = document.getElementById("payPoints");
const payDraftButton = document.getElementById("payDraft");
const payCancelButton = document.getElementById("payCancel");
const payRecentButton = document.getElementById("payRecent");
const paymentModal = document.getElementById("paymentModal");
const paymentForm = document.getElementById("paymentForm");
const paymentTotal = document.getElementById("paymentTotal");
const paymentMethod = document.getElementById("paymentMethod");
const paymentProvider = document.getElementById("paymentProvider");
const paymentAmount = document.getElementById("paymentAmount");
const paymentCurrency = document.getElementById("paymentCurrency");
const paymentEmail = document.getElementById("paymentEmail");
const paymentCapture = document.getElementById("paymentCapture");
const paymentHint = document.getElementById("paymentHint");
const closePaymentModalButton = document.getElementById("closePaymentModal");
const cancelPaymentButton = document.getElementById("cancelPayment");
const refundModal = document.getElementById("refundModal");
const refundForm = document.getElementById("refundForm");
const refundPaymentId = document.getElementById("refundPaymentId");
const refundAmount = document.getElementById("refundAmount");
const refundReason = document.getElementById("refundReason");
const refundHint = document.getElementById("refundHint");
const closeRefundModalButton = document.getElementById("closeRefundModal");
const cancelRefundButton = document.getElementById("cancelRefund");
const recentModal = document.getElementById("recentModal");
const closeRecentModalButton = document.getElementById("closeRecentModal");
const refreshRecentButton = document.getElementById("refreshRecent");
const recentOrders = document.getElementById("recentOrders");

const state = {
  config: null,
  selectedLocationId: null,
  openShift: null,
  cashierToken: null,
  cashier: null,
  online: false,
  view: "loading",
  deviceTokenValid: false,
  tokenExpiry: null,
  catalogResults: [],
  cart: [],
  priceListId: null,
  priceRulesLoaded: false,
  priceRulesByProduct: new Map(),
  priceRulesByVariant: new Map(),
  filterMode: "category",
  selectedCategory: null,
  selectedBrand: null,
  featuredOnly: false,
  categories: [],
  categorySource: "saved",
  brands: [],
  filtersLoaded: false,
  customer: null,
  categoryFacetKey: "category",
  orderTotals: {
    itemCount: 0,
    total: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    grandTotal: 0
  },
  lastOrder: null,
  lastPaymentIntent: null,
  stockLoaded: false,
  stockByProduct: new Map(),
  stockByVariant: new Map(),
  drawerOpen: false,
  promotionsLoaded: false,
  promotionsByCode: new Map(),
  appliedPromotion: null,
  manualDiscount: 0,
  taxRate: 0,
  shippingAmount: 0
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

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
  } catch (error) {
    return value.toISOString().slice(0, 10);
  }
}

function updateCheckoutHeader() {
  if (checkoutDate) {
    checkoutDate.textContent = formatDate(new Date());
  }
  if (checkoutLocation) {
    const locationLabel = state.config?.locationName || state.selectedLocationId || state.config?.locationId || "-";
    checkoutLocation.textContent = safeText(locationLabel);
  }
  if (checkoutBiller) {
    const cashier = state.cashier;
    checkoutBiller.textContent = cashier ? safeText(cashier.name || cashier.email || cashier.employee_no) : "Not signed in";
  }
  if (checkoutCustomer) {
    checkoutCustomer.textContent = state.customer ? safeText(state.customer.name) : "Walk in customer";
  }
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
  const wasOnline = state.online;
  state.online = online;
  apiStatusEl.textContent = online ? "Online" : "Offline";
  apiStatusEl.classList.toggle("online", online);
  if (online && !wasOnline) {
    refreshCaches();
    syncQueue();
  }
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
  updateCheckoutHeader();
}

function setCashierSession(token, user) {
  state.cashierToken = token;
  state.cashier = user;
  if (state.config && window.pos?.saveConfig) {
    state.config = window.pos.saveConfig({ cashierToken: token, cashierUser: user });
    configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
  }
  renderCashier();
  updateNav();
  startIdleTimer();
  evaluateAppState();
}

function clearCashierSession() {
  state.cashierToken = null;
  state.cashier = null;
  if (state.config && window.pos?.saveConfig) {
    state.config = window.pos.saveConfig({ cashierToken: null, cashierUser: null });
    configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
  }
  renderCashier();
  updateNav();
  evaluateAppState();
}

async function checkHealth() {
  try {
    const response = await window.pos.request({ method: "GET", path: "/health", skipAuth: true });
    setApiStatus(response.ok);
    setOfflineBanner(response.ok);
  } catch (error) {
    setApiStatus(false);
    setOfflineBanner(false);
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
    if (configStatusEl) {
      configStatusEl.textContent = `Config load failed: ${error.message || error}`;
      configStatusEl.classList.add("error");
    }
    configRawEl.textContent = "";
    configFields.api.textContent = "Config load failed";
    configFields.group.textContent = "-";
    configFields.subsidiary.textContent = "-";
    configFields.location.textContent = "-";
    configFields.channel.textContent = "-";
    if (configFields.categoryFacet) {
      configFields.categoryFacet.textContent = "-";
    }
    configFields.device.textContent = "-";
    if (configMissingMessage) {
      configMissingMessage.textContent = String(error.message || error);
    }
    showToast(`Config error: ${error.message || error}`, "error");
    return;
  }

  if (configStatusEl) {
    const warning = window.pos?.warning;
    if (warning) {
      configStatusEl.textContent = `Config loaded with warnings: ${warning}`;
      configStatusEl.classList.add("error");
      showToast(`POS warning: ${warning}`, "error");
    } else {
      configStatusEl.textContent = "Config loaded.";
      configStatusEl.classList.remove("error");
    }
  }
  if (configMissingMessage) {
    configMissingMessage.textContent = "";
  }
  configFields.api.textContent = safeText(state.config.apiBaseUrl);
  configFields.group.textContent = safeText(state.config.groupId);
  configFields.subsidiary.textContent = safeText(state.config.subsidiaryId);
  configFields.location.textContent = safeText(state.config.locationId);
  configFields.channel.textContent = safeText(state.config.channel);
  state.categoryFacetKey = state.config.categoryFacetKey || "category";
  if (configFields.categoryFacet) {
    configFields.categoryFacet.textContent = safeText(state.categoryFacetKey);
  }
  configFields.device.textContent = safeText(state.config.deviceId);
  state.selectedLocationId = state.config.locationId || null;
  state.cashierToken = state.config.cashierToken || null;
  state.cashier = state.config.cashierUser || null;
  state.priceListId = state.config.priceListId || null;
  state.priceRulesLoaded = false;
  state.priceRulesByProduct = new Map();
  state.priceRulesByVariant = new Map();
  state.stockLoaded = false;
  state.stockByProduct = new Map();
  state.stockByVariant = new Map();
  state.promotionsLoaded = false;
  state.promotionsByCode = new Map();
  state.appliedPromotion = null;
  state.manualDiscount = 0;
  state.taxRate = Number(state.config.taxRate ?? 0) || 0;
  state.shippingAmount = Number(state.config.shippingAmount ?? 0) || 0;
  state.filtersLoaded = false;
  state.categories = [];
  state.brands = [];
  state.selectedCategory = null;
  state.selectedBrand = null;
  state.filterMode = "category";
  state.featuredOnly = false;
  state.customer = null;
  hydrateFiltersFromCache();
  hydrateStockFromCache();
  renderCashier();
  if (discountInput) {
    discountInput.value = state.manualDiscount.toFixed(2);
    discountInput.disabled = false;
  }
  if (taxRateInput) {
    taxRateInput.value = state.taxRate.toFixed(2);
  }
  if (shippingInput) {
    shippingInput.value = state.shippingAmount.toFixed(2);
  }
  if (couponCodeInput) {
    couponCodeInput.value = "";
  }
  if (couponStatus) {
    couponStatus.textContent = "";
  }
  configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
  updateTokenStatus();
  updateNav();
  updateCheckoutHeader();
  updateCartSummary();
}

function getDefaultPaymentProvider() {
  return state.config?.paymentProvider || "paystack";
}

function hydrateFiltersFromCache() {
  const cachedCategories = readCache("filters:categories:saved", null);
  const cachedFacetCategories = readCache("filters:categories:facet", null);
  const cachedBrands = readCache("filters:brands", null);

  if (cachedCategories?.length) {
    state.categorySource = "saved";
    state.categories = cachedCategories;
  } else if (cachedFacetCategories?.length) {
    state.categorySource = "facet";
    state.categories = cachedFacetCategories;
  }

  if (cachedBrands?.length) {
    state.brands = cachedBrands;
  }

  if (state.categories.length || state.brands.length) {
    state.filtersLoaded = true;
  }
}

function hydrateStockFromCache() {
  const locationId = state.selectedLocationId || state.config?.locationId;
  if (!locationId) return;
  const cached = readCache(`stock-levels:${locationId}`, STOCK_CACHE_TTL_MS);
  if (!cached) return;
  setStockMaps(cached);
  state.stockLoaded = true;
  if (state.catalogResults.length) {
    renderProducts();
  }
}

const VIEWS = {
  loading: viewLoading,
  configMissing: viewConfigMissing,
  activation: viewActivation,
  cashier: viewCashier,
  shift: viewShift,
  checkout: viewCheckout
};

const TOKEN_EXPIRY_GRACE_MS = 60 * 1000;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const PRODUCT_CACHE_TTL_MS = 60 * 60 * 1000;
const STOCK_CACHE_TTL_MS = 5 * 60 * 1000;
const PROMOTION_CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_REFRESH_MS = 10 * 60 * 1000;
const QUEUE_SYNC_MS = 60 * 1000;

function readCache(key, maxAgeMs = CACHE_TTL_MS) {
  if (!window.pos?.cacheGet) return null;
  const cached = window.pos.cacheGet(key);
  if (!cached) return null;
  if (!cached.updated_at) return cached.payload ?? null;
  if (maxAgeMs === null) return cached.payload ?? null;
  const age = Date.now() - Date.parse(cached.updated_at);
  if (Number.isFinite(age) && age > maxAgeMs) return null;
  return cached.payload ?? null;
}

function writeCache(key, payload) {
  if (!window.pos?.cacheSet) return null;
  return window.pos.cacheSet(key, payload);
}

function isConfigComplete(config) {
  return Boolean(
    config?.apiBaseUrl &&
      config?.groupId &&
      config?.subsidiaryId &&
      config?.locationId &&
      config?.deviceId
  );
}

function setView(next) {
  state.view = next;
  Object.entries(VIEWS).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("active", key === next);
  });
  updateNav();
  if (next === "checkout") {
    updateCheckoutHeader();
    if (!state.catalogResults.length) {
      loadProducts();
    }
  }
}

function updateNav() {
  const hasCashier = Boolean(state.cashierToken);
  const canManageShift = state.deviceTokenValid && hasCashier;
  if (navSignOutButton) navSignOutButton.style.display = hasCashier ? "inline-flex" : "none";
  if (navShiftButton) navShiftButton.style.display = canManageShift ? "inline-flex" : "none";
  if (navCheckoutButton) navCheckoutButton.style.display = state.openShift ? "inline-flex" : "none";
  if (navCheckoutButton) navCheckoutButton.disabled = !state.openShift;
  if (proceedCheckoutButton) proceedCheckoutButton.disabled = !state.openShift;
}

function setOfflineBanner(online) {
  if (!offlineBanner) return;
  offlineBanner.classList.toggle("hidden", online);
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function formatDuration(ms) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function updateTokenStatus() {
  const token = state.config?.jwt;
  let label = "Missing";
  let detail = "No device token.";
  let ready = false;
  state.tokenExpiry = null;
  state.deviceTokenValid = false;

  if (token) {
    const payload = decodeJwtPayload(token);
    const exp = payload?.exp ? payload.exp * 1000 : null;
    state.tokenExpiry = exp;
    if (!exp) {
      label = "Invalid";
      detail = "Token missing expiry.";
    } else if (Date.now() >= exp) {
      label = "Expired";
      detail = "Token expired.";
    } else {
      ready = true;
      state.deviceTokenValid = exp - Date.now() > TOKEN_EXPIRY_GRACE_MS;
      label = state.deviceTokenValid ? "Active" : "Expiring";
      detail = `Expires in ${formatDuration(exp - Date.now())}`;
    }
  }

  if (deviceTokenStatus) {
    deviceTokenStatus.textContent = label;
    deviceTokenStatus.classList.toggle("ready", ready);
  }
  if (deviceTokenExpiry) {
    deviceTokenExpiry.textContent = detail;
  }
}

async function validateDeviceToken() {
  if (!state.config?.jwt || !state.config?.deviceId) {
    return { valid: false, reason: "missing" };
  }
  if (!state.online) {
    return { valid: true, reason: "offline" };
  }

  const query = buildQuery({ device_id: state.config.deviceId, limit: 1 });
  const response = await window.pos.request({ method: "GET", path: `/pos/devices${query}` });
  if (response.status === 401) {
    return { valid: false, reason: "unauthorized" };
  }
  if (!response.ok) {
    return { valid: false, reason: "error" };
  }

  const devices = response.data?.data || [];
  if (!devices.length) {
    return { valid: false, reason: "not_provisioned" };
  }
  return { valid: true, reason: "ok" };
}

function updateShiftSummary() {
  if (shiftBannerStatus) {
    shiftBannerStatus.textContent = state.openShift ? "Open" : "Closed";
    shiftBannerStatus.classList.toggle("ready", Boolean(state.openShift));
  }
  if (shiftBannerDetail) {
    if (!state.openShift) {
      shiftBannerDetail.textContent = "No open shift";
    } else {
      const openedAt = state.openShift.opened_at ?? "";
      const openingFloat = state.openShift.opening_float ?? 0;
      shiftBannerDetail.textContent = `Opened ${openedAt} · Float ${openingFloat}`;
    }
  }
}

function setConfigMissing(message) {
  if (configMissingMessage) {
    configMissingMessage.textContent = message;
  }
  setView("configMissing");
}

async function evaluateAppState() {
  if (!state.config) {
    setConfigMissing("Config not loaded. Ensure config.json is present.");
    return;
  }
  if (!isConfigComplete(state.config)) {
    setConfigMissing("Missing required config. Provision device in Admin-Ops.");
    return;
  }

  if (!state.selectedLocationId && state.config.locationId) {
    state.selectedLocationId = state.config.locationId;
  }

  await refreshDevice();
  await checkHealth();
  updateTokenStatus();
  setOfflineBanner(state.online);

  const tokenCheck = await validateDeviceToken();
  if (!state.deviceTokenValid || !tokenCheck.valid) {
    state.openShift = null;
    updateShiftSummary();
    updateNav();
    if (tokenCheck.reason === "not_provisioned") {
      if (managerInfo) {
        managerInfo.textContent = "Device not provisioned. Provision in Admin-Ops first.";
      }
    }
    setView("activation");
    return;
  }

  await refreshDevice();
  if (state.online) {
    await refreshOpenShift();
  }

  if (!state.cashierToken) {
    setView("cashier");
    return;
  }

  if (!state.openShift) {
    setView("shift");
    return;
  }

  setView("checkout");
}

function startIdleTimer() {
  if (startIdleTimer.initialized) {
    startIdleTimer.reset?.();
    return;
  }
  let idleTimeout;
  const resetTimer = () => {
    if (!state.cashierToken) return;
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      clearCashierSession();
      showToast("Signed out due to inactivity.", "error");
      evaluateAppState();
    }, IDLE_TIMEOUT_MS);
  };

  ["mousemove", "keydown", "click", "touchstart"].forEach((event) => {
    window.addEventListener(event, resetTimer, { passive: true });
  });

  resetTimer();
  startIdleTimer.initialized = true;
  startIdleTimer.reset = resetTimer;
}

function renderQueue() {
  const queue = window.pos.readQueue();
  const meta = window.pos.getQueueMeta ? window.pos.getQueueMeta() : null;
  const reconcile = readCache("pos.reconcile", null);
  const summaryParts = [
    `${queue.length} queued operation${queue.length === 1 ? "" : "s"}.`
  ];
  if (meta?.at) {
    summaryParts.push(`Last sync: ${formatDate(new Date(meta.at))}.`);
  }
  if (reconcile?.at) {
    summaryParts.push(`Last reconcile: ${formatDate(new Date(reconcile.at))}.`);
  }
  queueSummary.textContent = summaryParts.join(" ");
  queueOutput.textContent = JSON.stringify(queue, null, 2);
  if (queueCount) {
    queueCount.textContent = `${queue.length}`;
  }
}

async function reconcileAfterSync(processed) {
  if (!processed || !state.online) return;
  const response = await window.pos.request({
    method: "GET",
    path: `/orders${buildQuery({ limit: 1 })}`,
    extraHeaders: getRequestHeaders()
  });
  if (response.ok) {
    writeCache("pos.reconcile", { at: new Date().toISOString(), processed });
    renderQueue();
  }
}

async function syncQueue() {
  if (!state.online) return;
  if (!window.pos?.flushQueue) {
    showToast("Queue sync unavailable. Restart the app.", "error");
    return;
  }
  try {
    const meta = await window.pos.flushQueue();
    renderQueue();
    try {
      await reconcileAfterSync(meta?.processed || 0);
    } catch (error) {
      const message = error?.message || String(error);
      showToast(`Reconcile failed: ${message}`, "error");
    }
  } catch (error) {
    const message = error?.message || String(error);
    showToast(`Queue sync failed: ${message}`, "error");
  }
}

async function refreshCaches() {
  if (!state.online) return;
  state.filtersLoaded = false;
  state.priceRulesLoaded = false;
  state.stockLoaded = false;
  state.promotionsLoaded = false;
  await ensureFiltersLoaded();
  await ensurePricingLoaded();
  await ensureStockLevelsLoaded();
  await ensurePromotionsLoaded();
}

function setFilterMode(mode) {
  state.filterMode = mode;
  state.featuredOnly = mode === "featured";
  if (mode === "category") state.selectedBrand = null;
  if (mode === "brand") state.selectedCategory = null;
  if (mode === "featured") {
    state.selectedCategory = null;
    state.selectedBrand = null;
  }

  if (filterCategoryButton) filterCategoryButton.classList.toggle("active", mode === "category");
  if (filterBrandButton) filterBrandButton.classList.toggle("active", mode === "brand");
  if (filterFeaturedButton) filterFeaturedButton.classList.toggle("active", mode === "featured");
  if (categoryTabs) categoryTabs.classList.toggle("hidden", mode !== "category");
  if (brandTabs) brandTabs.classList.toggle("hidden", mode !== "brand");
  if (featuredHint) featuredHint.classList.toggle("hidden", mode !== "featured");

  renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
  renderFilterChips(brandTabs, state.brands, state.selectedBrand, handleBrandSelect, "No brands configured.");

  if (mode === "featured") {
    renderProducts();
  } else {
    loadProducts();
  }
}

function renderFilterChips(container, options, selectedValue, onSelect, emptyLabel) {
  if (!container) return;
  container.innerHTML = "";

  const normalizedOptions = (options || []).map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return option;
  });

  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = "chip";
  allChip.textContent = "All";
  if (!selectedValue) allChip.classList.add("active");
  allChip.addEventListener("click", () => onSelect(null));
  container.appendChild(allChip);

  if (!normalizedOptions.length) {
    const empty = document.createElement("span");
    empty.className = "helper";
    empty.textContent = emptyLabel;
    container.appendChild(empty);
    return;
  }

  normalizedOptions.forEach((option) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = option.label;
    if (option.value === selectedValue) chip.classList.add("active");
    chip.addEventListener("click", () => onSelect(option.value));
    container.appendChild(chip);
  });
}

function setCustomer(customer) {
  state.customer = customer;
  updateCheckoutHeader();
}

function openCustomerModal() {
  if (!customerModal) return;
  if (!state.online) {
    showToast("Customer lookup is unavailable offline.", "error");
    return;
  }
  customerModal.classList.remove("hidden");
  if (customerSearchInput) {
    customerSearchInput.value = "";
    customerSearchInput.focus();
  }
  loadCustomers();
}

function closeCustomerModal() {
  if (!customerModal) return;
  customerModal.classList.add("hidden");
}

function canCheckout() {
  if (!state.cart.length) {
    showToast("Cart is empty.", "error");
    return false;
  }
  if (!state.openShift) {
    showToast("Open a shift before checkout.", "error");
    return false;
  }
  if (!state.cashierToken) {
    showToast("Cashier sign-in required.", "error");
    return false;
  }
  return true;
}

function openPaymentModal(method = "card") {
  if (!paymentModal || !paymentForm) return;
  if (!canCheckout()) return;
  paymentMethod.value = method;
  paymentProvider.value = getDefaultPaymentProvider();
  paymentAmount.value = state.orderTotals.grandTotal.toFixed(2);
  paymentCurrency.value = orderCurrencyInput?.value?.trim().toUpperCase() || "NGN";
  paymentEmail.value = state.customer?.email || "";
  paymentCapture.value = "true";
  updatePaymentFormState();
  paymentModal.classList.remove("hidden");
}

function closePaymentModal() {
  if (!paymentModal) return;
  paymentModal.classList.add("hidden");
}

function updatePaymentFormState() {
  if (!paymentMethod || !paymentProvider || !paymentEmail || !paymentCapture || !paymentHint) return;
  const isManual = paymentMethod.value === "manual";
  paymentProvider.disabled = isManual;
  paymentEmail.disabled = isManual;
  paymentCapture.disabled = isManual;
  if (isManual) {
    paymentProvider.value = "manual";
    paymentEmail.value = "";
    paymentCapture.value = "true";
    paymentHint.textContent = "Cash payment will record the order without a payment intent.";
    return;
  }
  paymentHint.textContent = "Payment intent will be created with the selected provider.";
}

function buildPaymentPayload() {
  const method = paymentMethod?.value || "card";
  if (method === "manual") {
    return { payment: undefined, capturePayment: undefined, method };
  }

  const amountRaw = Number(paymentAmount?.value);
  const amount = Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : state.orderTotals.grandTotal;
  const currency = paymentCurrency?.value?.trim().toUpperCase() || "NGN";
  const email = paymentEmail?.value?.trim() || state.customer?.email;
  if (!email) {
    showToast("Customer email is required for payment.", "error");
    return null;
  }
  const provider = paymentProvider?.value || getDefaultPaymentProvider();
  const capturePayment = paymentCapture?.value === "true";

  return {
    payment: {
      amount,
      currency,
      provider,
      capture_method: capturePayment ? "automatic" : "manual",
      payment_method: method,
      customer_email: email
    },
    capturePayment,
    method
  };
}

async function handlePaymentSubmit(event) {
  event.preventDefault();
  if (!canCheckout()) return;
  const payload = buildPaymentPayload();
  if (!payload) return;
  if (payload.method !== "manual" && !state.online) {
    showToast("Online connection required for card/transfer payments.", "error");
    return;
  }

  const result = await submitOrder({
    payment: payload.payment,
    capturePayment: payload.capturePayment
  });
  if (!result) return;
  closePaymentModal();
}

function openRefundModal() {
  if (!refundModal || !refundForm) return;
  if (!state.cashierToken) {
    showToast("Cashier sign-in required.", "error");
    return;
  }
  if (!state.online) {
    showToast("Refunds require an online connection.", "error");
    return;
  }
  const lastIntent = state.lastPaymentIntent;
  if (refundPaymentId) {
    refundPaymentId.value = lastIntent?.id || "";
  }
  if (refundAmount) {
    const amount = lastIntent?.amount ?? state.orderTotals.grandTotal ?? 0;
    refundAmount.value = amount ? Number(amount).toFixed(2) : "";
  }
  if (refundReason) {
    refundReason.value = "";
  }
  if (refundHint) {
    refundHint.textContent = lastIntent?.id
      ? `Last payment intent: ${lastIntent.id}`
      : "Enter the payment intent ID you want to refund.";
  }
  refundModal.classList.remove("hidden");
}

function closeRefundModal() {
  if (!refundModal) return;
  refundModal.classList.add("hidden");
}

async function handleRefundSubmit(event) {
  event.preventDefault();
  if (!state.online) {
    showToast("Refunds require an online connection.", "error");
    return;
  }

  const paymentId = refundPaymentId?.value?.trim();
  if (!paymentId) {
    showToast("Payment intent ID is required.", "error");
    return;
  }

  const amountValue = Number(refundAmount?.value);
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    showToast("Refund amount is required.", "error");
    return;
  }

  const reason = refundReason?.value?.trim();
  const result = await safeWrite({
    method: "POST",
    path: "/refunds",
    body: {
      payment_id: paymentId,
      amount: amountValue,
      reason: reason || undefined
    },
    scope: `refunds.create:${paymentId}:${amountValue}`
  });

  if (result.queued) {
    orderStatus.textContent = "Refund queued (offline).";
    return;
  }

  if (!result.response?.ok) {
    const message = result.response?.data?.message || "Refund failed.";
    showToast(message, "error");
    return;
  }

  orderStatus.textContent = `Refund submitted: ${paymentId}`;
  showToast("Refund submitted.");
  closeRefundModal();
}

function renderRecentOrders(orders) {
  if (!recentOrders) return;
  recentOrders.innerHTML = "";
  if (!orders.length) {
    recentOrders.textContent = "No recent orders found.";
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement("div");
    row.className = "order-item";

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = `${order.order_no} · ${order.currency} ${Number(order.total_amount).toFixed(2)}`;
    const meta = document.createElement("div");
    meta.className = "order-meta";
    meta.textContent = `Status: ${order.status ?? "unknown"}`;
    info.appendChild(title);
    info.appendChild(meta);

    row.appendChild(info);
    recentOrders.appendChild(row);
  });
}

async function loadRecentOrders() {
  if (!recentOrders) return;
  if (!state.online) {
    recentOrders.textContent = "Recent orders require an online connection.";
    return;
  }

  recentOrders.textContent = "Loading recent orders...";
  const baseParams = {
    limit: 20,
    status: "fulfilled",
    channel: state.config?.channel ?? "retail",
    location_id: state.selectedLocationId || undefined
  };

  let response = await window.pos.request({
    method: "GET",
    path: `/orders${buildQuery(baseParams)}`,
    extraHeaders: getRequestHeaders({ authToken: state.cashierToken })
  });

  if (response.ok && Array.isArray(response.data?.data) && response.data.data.length) {
    renderRecentOrders(response.data.data);
    return;
  }

  const fallbackParams = { ...baseParams };
  delete fallbackParams.status;
  response = await window.pos.request({
    method: "GET",
    path: `/orders${buildQuery(fallbackParams)}`,
    extraHeaders: getRequestHeaders({ authToken: state.cashierToken })
  });

  if (!response.ok) {
    recentOrders.textContent = "Unable to load recent orders.";
    return;
  }

  renderRecentOrders(response.data?.data || []);
}

function openRecentModal() {
  if (!recentModal) return;
  if (!state.cashierToken) {
    showToast("Cashier sign-in required.", "error");
    return;
  }
  if (!state.online) {
    showToast("Recent orders require an online connection.", "error");
    return;
  }
  recentModal.classList.remove("hidden");
  loadRecentOrders();
}

function closeRecentModal() {
  if (!recentModal) return;
  recentModal.classList.add("hidden");
}

function renderCustomerResults(customers) {
  if (!customerResults) return;
  customerResults.innerHTML = "";
  if (!customers.length) {
    customerResults.textContent = "No customers found.";
    return;
  }

  customers.forEach((customer) => {
    const row = document.createElement("div");
    row.className = "customer-item";

    const info = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = customer.name;
    const meta = document.createElement("div");
    meta.className = "customer-meta";
    const contact = [customer.email, customer.phone].filter(Boolean).join(" · ");
    meta.textContent = contact || "No contact details";

    info.appendChild(name);
    info.appendChild(meta);

    const action = document.createElement("button");
    action.className = "ghost";
    action.type = "button";
    action.textContent = "Select";
    action.addEventListener("click", () => {
      setCustomer(customer);
      closeCustomerModal();
    });

    row.appendChild(info);
    row.appendChild(action);
    customerResults.appendChild(row);
  });
}

async function loadCustomers() {
  if (!customerResults) return;
  if (!state.online) {
    customerResults.textContent = "Customer lookup requires an online connection.";
    return;
  }
  const query = buildQuery({ q: customerSearchInput?.value?.trim(), limit: 20 });
  const response = await window.pos.request({
    method: "GET",
    path: `/customers${query}`,
    extraHeaders: getRequestHeaders()
  });

  if (!response.ok) {
    customerResults.textContent = "Unable to load customers.";
    return;
  }

  renderCustomerResults(response.data?.data || []);
}

async function fetchPaged(path, limit = 100) {
  const results = [];
  let offset = 0;

  while (true) {
    const response = await window.pos.request({
      method: "GET",
      path: `${path}${buildQuery({ limit, offset })}`,
      extraHeaders: getRequestHeaders()
    });

    if (!response.ok) {
      return null;
    }

    const data = response.data?.data || [];
    results.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return results;
}

function setStockMaps(levels) {
  state.stockByProduct = new Map();
  state.stockByVariant = new Map();

  if (!Array.isArray(levels)) return;
  levels.forEach((level) => {
    const productId = level.product_id;
    if (!productId) return;
    const onHand = Number(level.on_hand ?? 0);
    const reserved = Number(level.reserved ?? 0);
    const available = Number(level.available ?? onHand - reserved);

    const existing = state.stockByProduct.get(productId) ?? { on_hand: 0, reserved: 0, available: 0 };
    state.stockByProduct.set(productId, {
      on_hand: existing.on_hand + onHand,
      reserved: existing.reserved + reserved,
      available: existing.available + available
    });

    if (level.variant_id) {
      state.stockByVariant.set(level.variant_id, { on_hand: onHand, reserved, available });
    }
  });
}

async function loadStockLevels() {
  const locationId = state.selectedLocationId || state.config?.locationId;
  if (!locationId) return;
  const cacheKey = `stock-levels:${locationId}`;

  if (!state.online) {
    const cached = readCache(cacheKey, STOCK_CACHE_TTL_MS);
    if (cached) {
      setStockMaps(cached);
      state.stockLoaded = true;
    }
    return;
  }

  const levels = await fetchPaged("/stock-levels", 200);
  if (!levels) {
    const cached = readCache(cacheKey, STOCK_CACHE_TTL_MS);
    if (cached) {
      setStockMaps(cached);
      state.stockLoaded = true;
    }
    return;
  }

  writeCache(cacheKey, levels);
  setStockMaps(levels);
  state.stockLoaded = true;
  if (state.catalogResults.length) {
    renderProducts();
  }
}

async function ensureStockLevelsLoaded() {
  if (state.stockLoaded) return;
  await loadStockLevels();
}

function getStockForProduct(productId) {
  if (!productId) return null;
  const stock = state.stockByProduct.get(productId);
  if (!stock) return null;
  return Number.isFinite(stock.available) ? stock.available : null;
}

async function loadBrandFilters() {
  const cacheKey = "filters:brands";
  if (!state.online) {
    const cached = readCache(cacheKey, null);
    if (cached?.length) {
      state.brands = cached;
      renderFilterChips(brandTabs, state.brands, state.selectedBrand, handleBrandSelect, "No brands configured.");
      return true;
    }
    renderFilterChips(brandTabs, [], state.selectedBrand, handleBrandSelect, "Offline: no cached brands.");
    return false;
  }

  const brands = await fetchPaged("/brands", 200);
  if (!brands) {
    renderFilterChips(brandTabs, [], state.selectedBrand, handleBrandSelect, "Unable to load brands.");
    return false;
  }
  state.brands = brands.map((brand) => brand.name).filter(Boolean);
  state.brands.sort((a, b) => a.localeCompare(b));
  writeCache(cacheKey, state.brands);
  renderFilterChips(brandTabs, state.brands, state.selectedBrand, handleBrandSelect, "No brands configured.");
  return true;
}

async function loadCategoryFilters() {
  const cacheSavedKey = "filters:categories:saved";
  const cacheFacetKey = "filters:categories:facet";
  const previousSource = state.categorySource;
  if (!state.online) {
    const cachedSaved = readCache(cacheSavedKey, null);
    const cachedFacet = readCache(cacheFacetKey, null);
    if (cachedSaved?.length) {
      state.categorySource = "saved";
      state.categories = cachedSaved;
      renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
      return true;
    }
    if (cachedFacet?.length) {
      state.categorySource = "facet";
      state.categories = cachedFacet;
      renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
      return true;
    }
    renderFilterChips(categoryTabs, [], state.selectedCategory, handleCategorySelect, "Offline: no cached categories.");
    return false;
  }

  const categories = await fetchPaged("/categories", 100);
  if (categories && categories.length) {
    state.categorySource = "saved";
    if (previousSource !== "saved") {
      state.selectedCategory = null;
    }
    state.categories = categories
      .map((category) => ({ value: category.id, label: category.name }))
      .filter((category) => category.label);
    writeCache(cacheSavedKey, state.categories);
    renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
    return true;
  }

  const facets = await fetchPaged("/facets", 50);
  if (!facets) {
    renderFilterChips(categoryTabs, [], state.selectedCategory, handleCategorySelect, "Unable to load categories.");
    return false;
  }
  const facetKey = state.categoryFacetKey || "category";
  const categoryFacet = facets.find((facet) => facet.key === facetKey);
  if (!categoryFacet) {
    state.categorySource = "facet";
    if (previousSource !== "facet") {
      state.selectedCategory = null;
    }
    state.categories = [];
    renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, `No facet values for ${facetKey}.`);
    return true;
  }

  const values = await fetchPaged(`/facets/${categoryFacet.id}/values`, 200);
  if (!values) {
    renderFilterChips(categoryTabs, [], state.selectedCategory, handleCategorySelect, "Unable to load categories.");
    return false;
  }
  state.categorySource = "facet";
  if (previousSource !== "facet") {
    state.selectedCategory = null;
  }
  state.categories = values.map((value) => value.value).filter(Boolean);
  state.categories.sort((a, b) => a.localeCompare(b));
  writeCache(cacheFacetKey, state.categories);
  renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
  return true;
}

async function ensureFiltersLoaded() {
  if (state.filtersLoaded) {
    renderFilterChips(categoryTabs, state.categories, state.selectedCategory, handleCategorySelect, "No categories configured.");
    renderFilterChips(brandTabs, state.brands, state.selectedBrand, handleBrandSelect, "No brands configured.");
    return;
  }

  const [categoryOk, brandOk] = await Promise.all([loadCategoryFilters(), loadBrandFilters()]);
  state.filtersLoaded = Boolean(categoryOk || brandOk);
}

function applyPricingRules(rules) {
  const productPrices = new Map();
  const variantPrices = new Map();
  const productFallback = new Map();

  for (const rule of rules || []) {
    const price = Number(rule.price);
    if (!Number.isFinite(price)) continue;
    if (rule.variant_id) {
      variantPrices.set(rule.variant_id, price);
      const current = productFallback.get(rule.product_id);
      if (current === undefined || price < current) {
        productFallback.set(rule.product_id, price);
      }
    } else {
      productPrices.set(rule.product_id, price);
    }
  }

  for (const [productId, price] of productFallback.entries()) {
    if (!productPrices.has(productId)) {
      productPrices.set(productId, price);
    }
  }

  state.priceRulesByProduct = productPrices;
  state.priceRulesByVariant = variantPrices;
  state.priceRulesLoaded = true;
}

async function ensurePricingLoaded() {
  if (state.priceRulesLoaded) return true;
  if (!state.config?.subsidiaryId) return false;

  let priceListId = state.priceListId || state.config?.priceListId;
  const cachedLists = readCache("pricing:lists", null);

  if (!priceListId && cachedLists?.length) {
    const channel = (state.config?.channel || "").toLowerCase();
    const preferred = cachedLists.find((list) => (list.channel || "").toLowerCase() === channel);
    priceListId = (preferred || cachedLists[0]).id;
    state.priceListId = priceListId;
  }

  if (!state.online) {
    if (!priceListId) return false;
    const cachedRules = readCache(`pricing:rules:${priceListId}`, null);
    if (!cachedRules?.length) return false;
    applyPricingRules(cachedRules);
    return true;
  }

  if (!priceListId) {
    const response = await window.pos.request({
      method: "GET",
      path: `/price-lists${buildQuery({ limit: 50 })}`,
      extraHeaders: getRequestHeaders()
    });
    if (!response.ok) {
      showToast("Unable to load price lists.", "error");
      return false;
    }
    const lists = response.data?.data || [];
    if (!lists.length) {
      showToast("No price lists configured for this subsidiary.", "error");
      return false;
    }
    writeCache("pricing:lists", lists);

    const channel = (state.config?.channel || "").toLowerCase();
    const preferred = lists.find((list) => (list.channel || "").toLowerCase() === channel);
    priceListId = (preferred || lists[0]).id;
    state.priceListId = priceListId;
    if (state.config && window.pos?.saveConfig) {
      state.config = window.pos.saveConfig({ priceListId });
      configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
    }
  }

  let rules = await fetchPriceRules(priceListId);
  if (!rules) {
    const cachedRules = readCache(`pricing:rules:${priceListId}`, null);
    if (!cachedRules?.length) return false;
    rules = cachedRules;
  } else {
    writeCache(`pricing:rules:${priceListId}`, rules);
  }

  applyPricingRules(rules);
  return true;
}

async function fetchPriceRules(priceListId) {
  const rules = [];
  const limit = 500;
  let offset = 0;

  while (true) {
    const response = await window.pos.request({
      method: "GET",
      path: `/price-rules${buildQuery({ price_list_id: priceListId, limit, offset })}`,
      extraHeaders: getRequestHeaders()
    });

    if (!response.ok) {
      showToast("Unable to load price rules.", "error");
      return null;
    }

    const data = response.data?.data || [];
    rules.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return rules;
}

async function refreshDevice() {
  const deviceId = state.config?.deviceId;
  if (!deviceId) {
    deviceInfo.textContent = "Device ID missing. Set it in config.";
    return;
  }

  const locationId = state.selectedLocationId || state.config?.locationId;
  const lines = [
    `Device ID: ${deviceId}`,
    `Location: ${locationId ?? "-"}`,
    "Provisioned in Admin-Ops."
  ];
  deviceInfo.textContent = lines.join("\n");
}

async function refreshOpenShift() {
  const deviceId = state.config?.deviceId;
  if (!deviceId || !state.selectedLocationId) {
    shiftInfo.textContent = "Location and device must be set in config.";
    if (openShiftForm) openShiftForm.classList.add("hidden");
    if (closeShiftForm) closeShiftForm.classList.add("hidden");
    updateShiftSummary();
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
    if (openShiftForm) openShiftForm.classList.remove("hidden");
    if (closeShiftForm) closeShiftForm.classList.add("hidden");
    updateShiftSummary();
    updateNav();
    return;
  }

  const lines = [
    `Shift: ${shift.id}`,
    `Opened: ${shift.opened_at}`,
    `Opening float: ${shift.opening_float ?? 0}`
  ];
  shiftInfo.textContent = lines.join("\n");
  if (openShiftForm) openShiftForm.classList.add("hidden");
  if (closeShiftForm) closeShiftForm.classList.remove("hidden");
  updateShiftSummary();
  updateNav();
}


function formatMoney(amount) {
  const currency = orderCurrencyInput?.value?.trim().toUpperCase() || "NGN";
  if (!Number.isFinite(amount)) return "-";
  return `${currency} ${amount.toFixed(2)}`;
}

function getProductInitials(name) {
  const cleaned = (name || "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join("").toUpperCase();
}

function getProductImage(product) {
  return product.image_url || product.imageUrl || product.image || null;
}

function extractStock(product) {
  const direct = [
    product.stock_on_hand,
    product.inventory_on_hand,
    product.quantity_on_hand,
    product.on_hand,
    product.available_qty,
    product.available_quantity,
  ];
  for (const value of direct) {
    if (typeof value === "number") return value;
  }
  const nested = product.inventory || {};
  const nestedValue = nested.on_hand ?? nested.available ?? null;
  return typeof nestedValue === "number" ? nestedValue : null;
}

function isFeaturedProduct(product) {
  if (product.featured || product.is_featured || product.isFeatured) return true;
  if (Array.isArray(product.tags)) {
    return product.tags.some((tag) => String(tag).toLowerCase() === "featured");
  }
  return false;
}

function renderProducts() {
  productResults.innerHTML = "";
  const filtered = state.featuredOnly
    ? state.catalogResults.filter((product) => isFeaturedProduct(product))
    : state.catalogResults;

  if (productCount) {
    productCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  }

  if (!filtered.length) {
    productResults.textContent = "No products found.";
    return;
  }

  filtered.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.setProperty("--delay", String(index * 30));

    const image = document.createElement("div");
    image.className = "product-image";
    const imageUrl = getProductImage(product);
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = product.name;
      image.appendChild(img);
    } else {
      image.textContent = getProductInitials(product.name);
    }

    const info = document.createElement("div");
    info.className = "product-info";
    const name = document.createElement("div");
    name.className = "product-title";
    name.textContent = product.name;
    const meta = document.createElement("div");
    meta.className = "product-meta";
    meta.textContent = product.sku ? `SKU: ${product.sku}` : "SKU: -";

    const priceValue = getPriceForProduct(product.id);
    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = priceValue !== null ? formatMoney(priceValue) : "No price";

    const stock = document.createElement("div");
    stock.className = "product-stock";
    const stockValue = getStockForProduct(product.id) ?? extractStock(product);
    if (stockValue !== null) {
      const threshold = getLowStockThreshold();
      if (stockValue <= threshold) {
        stock.classList.add("low");
      }
      stock.textContent = `Qty: ${stockValue}`;
    } else {
      stock.textContent = "Qty: -";
    }

    info.appendChild(name);
    info.appendChild(meta);
    info.appendChild(price);
    info.appendChild(stock);

    const action = document.createElement("button");
    action.className = "ghost";
    action.textContent = "Add";
    action.addEventListener("click", () => addToCart(product));

    card.appendChild(image);
    card.appendChild(info);
    card.appendChild(action);
    productResults.appendChild(card);
  });
}

function updateCartSummary() {
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let discount = 0;
  if (state.appliedPromotion) {
    const promoType = String(state.appliedPromotion.type || "").toLowerCase();
    const value = Number(state.appliedPromotion.value) || 0;
    if (promoType.includes("percent")) {
      discount = total * (value / 100);
    } else if (promoType.includes("fixed") || promoType.includes("amount") || promoType.includes("flat")) {
      discount = value;
    } else {
      discount = 0;
    }
  } else {
    discount = Number(state.manualDiscount) || 0;
  }
  discount = Math.max(0, Math.min(discount, total));

  const taxRate = Number(state.taxRate) || 0;
  const shipping = Number(state.shippingAmount) || 0;
  const taxable = Math.max(0, total - discount);
  const tax = taxable * (taxRate / 100);
  const grandTotal = taxable + tax + shipping;
  state.orderTotals = { itemCount, total, discount, tax, shipping, grandTotal };
  cartCount.textContent = `${itemCount}`;
  cartTotal.textContent = total.toFixed(2);
  if (cartDiscount) cartDiscount.textContent = discount.toFixed(2);
  if (cartTax) cartTax.textContent = tax.toFixed(2);
  if (cartShipping) cartShipping.textContent = shipping.toFixed(2);
  if (cartGrandTotal) cartGrandTotal.textContent = grandTotal.toFixed(2);
  if (discountInput) {
    discountInput.value = discount.toFixed(2);
  }
  if (taxRateInput) {
    taxRateInput.value = taxRate.toFixed(2);
  }
  if (shippingInput) {
    shippingInput.value = shipping.toFixed(2);
  }
  updatePaymentSummary();
}

function buildAdjustmentNote() {
  const parts = [];
  if (state.appliedPromotion) {
    parts.push(`Coupon ${state.appliedPromotion.code} (-${state.orderTotals.discount.toFixed(2)})`);
  } else if (state.orderTotals.discount > 0) {
    parts.push(`Discount -${state.orderTotals.discount.toFixed(2)}`);
  }
  if (state.taxRate > 0) {
    parts.push(`Tax ${state.taxRate.toFixed(2)}% (+${state.orderTotals.tax.toFixed(2)})`);
  }
  if (state.shippingAmount > 0) {
    parts.push(`Shipping +${state.orderTotals.shipping.toFixed(2)}`);
  }
  if (!parts.length) return "";
  return `Adjustments: ${parts.join(", ")}`;
}

function updatePaymentSummary() {
  if (paymentTotal) {
    paymentTotal.textContent = formatMoney(state.orderTotals.grandTotal);
  }
  if (paymentModal?.classList.contains("hidden")) {
    if (paymentAmount) {
      paymentAmount.value = state.orderTotals.grandTotal.toFixed(2);
    }
    if (paymentCurrency) {
      paymentCurrency.value = orderCurrencyInput?.value?.trim().toUpperCase() || "NGN";
    }
  }
}

function getLowStockThreshold() {
  const fromConfig = state.config?.lowStockThreshold ?? state.config?.low_stock_threshold;
  const value = Number(fromConfig);
  return Number.isFinite(value) ? value : 5;
}

function openFilterDrawer(title) {
  if (!filterDrawer) return;
  state.drawerOpen = true;
  if (filterDrawerTitle) {
    filterDrawerTitle.textContent = title;
  }
  filterDrawer.classList.add("open");
}

function closeFilterDrawer() {
  if (!filterDrawer) return;
  state.drawerOpen = false;
  filterDrawer.classList.remove("open");
}

function toggleFilterDrawer(mode, title) {
  if (state.filterMode === mode && state.drawerOpen) {
    closeFilterDrawer();
    return;
  }
  setFilterMode(mode);
  openFilterDrawer(title);
}

function handleCategorySelect(value) {
  state.selectedCategory = value;
  loadProducts();
  closeFilterDrawer();
}

function handleBrandSelect(value) {
  state.selectedBrand = value;
  loadProducts();
  closeFilterDrawer();
}

function normalizeCouponCode(value) {
  return (value || "").trim().toUpperCase();
}

function isPromotionActive(promotion) {
  if (!promotion?.start_at || !promotion?.end_at) return true;
  const now = Date.now();
  const start = Date.parse(promotion.start_at);
  const end = Date.parse(promotion.end_at);
  if (Number.isFinite(start) && now < start) return false;
  if (Number.isFinite(end) && now > end) return false;
  return true;
}

function setPromotionMap(promotions) {
  state.promotionsByCode = new Map();
  (promotions || []).forEach((promo) => {
    if (!promo?.code) return;
    state.promotionsByCode.set(normalizeCouponCode(promo.code), promo);
  });
}

async function loadPromotions() {
  const cacheKey = "promotions";
  if (!state.online) {
    const cached = readCache(cacheKey, PROMOTION_CACHE_TTL_MS);
    if (cached?.length) {
      setPromotionMap(cached);
      state.promotionsLoaded = true;
      return true;
    }
    return false;
  }

  const promotions = await fetchPaged("/promotions", 200);
  if (!promotions) {
    const cached = readCache(cacheKey, PROMOTION_CACHE_TTL_MS);
    if (cached?.length) {
      setPromotionMap(cached);
      state.promotionsLoaded = true;
      return true;
    }
    return false;
  }

  writeCache(cacheKey, promotions);
  setPromotionMap(promotions);
  state.promotionsLoaded = true;
  return true;
}

async function ensurePromotionsLoaded() {
  if (state.promotionsLoaded) return true;
  return loadPromotions();
}

function clearPromotion(options = {}) {
  state.appliedPromotion = null;
  if (couponStatus) {
    couponStatus.textContent = "";
  }
  if (!options.keepCode && couponCodeInput) {
    couponCodeInput.value = "";
  }
  if (discountInput) {
    discountInput.disabled = false;
  }
}

async function applyCoupon() {
  const code = normalizeCouponCode(couponCodeInput?.value);
  if (!code) {
    clearPromotion();
    updateCartSummary();
    return;
  }

  const ok = await ensurePromotionsLoaded();
  if (!ok) {
    showToast("Unable to load promotions.", "error");
    return;
  }

  const promotion = state.promotionsByCode.get(code);
  if (!promotion) {
    showToast("Coupon not found.", "error");
    if (couponStatus) couponStatus.textContent = "Coupon not found.";
    return;
  }
  if (!isPromotionActive(promotion)) {
    showToast("Coupon is not active.", "error");
    if (couponStatus) couponStatus.textContent = "Coupon is not active.";
    return;
  }

  state.appliedPromotion = promotion;
  if (couponStatus) couponStatus.textContent = `Applied ${promotion.code}`;
  if (discountInput) {
    discountInput.disabled = true;
  }
  updateCartSummary();
}

function handleDiscountChange() {
  const value = Number(discountInput?.value);
  if (state.appliedPromotion) {
    clearPromotion({ keepCode: false });
  }
  state.manualDiscount = Number.isFinite(value) && value >= 0 ? value : 0;
  updateCartSummary();
}

function handleTaxRateChange() {
  const value = Number(taxRateInput?.value);
  state.taxRate = Number.isFinite(value) && value >= 0 ? value : 0;
  updateCartSummary();
}

function handleShippingChange() {
  const value = Number(shippingInput?.value);
  state.shippingAmount = Number.isFinite(value) && value >= 0 ? value : 0;
  updateCartSummary();
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
    name.className = "item-name";
    name.textContent = item.name;

    const price = document.createElement("input");
    price.type = "number";
    price.min = "0";
    price.step = "0.01";
    price.value = String(item.unitPrice);
    price.className = "price-input";
    price.addEventListener("change", () => {
      const next = Number(price.value);
      item.unitPrice = Number.isFinite(next) && next >= 0 ? next : 0;
      price.value = String(item.unitPrice);
      renderCart();
    });

    const qtyWrap = document.createElement("div");
    qtyWrap.className = "qty-control";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    minus.addEventListener("click", () => {
      item.quantity = Math.max(1, item.quantity - 1);
      renderCart();
    });
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
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () => {
      item.quantity += 1;
      renderCart();
    });
    qtyWrap.appendChild(minus);
    qtyWrap.appendChild(qty);
    qtyWrap.appendChild(plus);

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
    row.appendChild(price);
    row.appendChild(qtyWrap);
    row.appendChild(total);
    row.appendChild(remove);
    cartItems.appendChild(row);
  });

  updateCartSummary();
}
function addToCart(product) {
  const existing = state.cart.find((item) => item.productId === product.id);
  const price = getPriceForProduct(product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: price ?? 0
    });
  }
  if (price === null) {
    showToast("No price configured for this item. Enter price manually.", "error");
  }
  renderCart();
}

function getPriceForProduct(productId) {
  if (!state.priceRulesLoaded) return null;
  const price = state.priceRulesByProduct.get(productId);
  return typeof price === "number" ? price : null;
}

async function loadProducts() {
  if (!state.config?.subsidiaryId) {
    showToast("Missing subsidiaryId in config.", "error");
    return;
  }

  await ensureFiltersLoaded();
  await ensurePricingLoaded();
  const facetFilters = [];
  if (state.selectedBrand) facetFilters.push(`brand=${state.selectedBrand}`);
  let path = "/products";

  if (state.filterMode === "category" && state.selectedCategory) {
    if (state.categorySource === "saved") {
      path = `/categories/${state.selectedCategory}/products`;
    } else {
      const facetKey = state.categoryFacetKey || "category";
      facetFilters.push(`${facetKey}=${state.selectedCategory}`);
    }
  }

  const query = buildQuery({
    q: productSearchInput.value.trim(),
    facets: facetFilters.length ? facetFilters.join("|") : undefined,
    limit: 24
  });
  const cacheKey = `products:${path}${query}`;

  if (!state.online) {
    const cached = readCache(cacheKey, PRODUCT_CACHE_TTL_MS);
    if (cached) {
      state.catalogResults = cached;
      renderProducts();
      showToast("Offline: showing cached products.");
      return;
    }
    showToast("Offline: no cached products for this filter.", "error");
    return;
  }

  const response = await window.pos.request({ method: "GET", path: `${path}${query}`, extraHeaders: getRequestHeaders() });
  if (!response.ok) {
    const cached = readCache(cacheKey, PRODUCT_CACHE_TTL_MS);
    if (cached) {
      state.catalogResults = cached;
      renderProducts();
      showToast("Using cached products after API error.", "error");
      return;
    }
    const message = response.data?.message || `Failed to load products (${response.status})`;
    showToast(message, "error");
    return;
  }

  state.catalogResults = response.data?.data || [];
  writeCache(cacheKey, state.catalogResults);
  renderProducts();
}

async function submitOrder(options = {}) {
  if (!canCheckout()) {
    return null;
  }
  if (options.payment && !state.online) {
    showToast("Online connection required for card/transfer payments.", "error");
    return null;
  }

  const currency = orderCurrencyInput.value.trim().toUpperCase() || "NGN";
  const baseNotes = orderNotesInput.value.trim();
  const adjustmentNote = buildAdjustmentNote();
  const notes = [baseNotes, adjustmentNote].filter(Boolean).join(" | ") || undefined;
  const { discount, tax, shipping } = state.orderTotals;
  const items = state.cart.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice
  }));
  const payload = {
    order: {
      currency,
      customer_id: state.customer?.id || undefined,
      discount_amount: discount || 0,
      tax_amount: tax || 0,
      shipping_amount: shipping || 0,
      items,
      notes
    },
    reserve_stock: true
  };
  if (options.payment) {
    payload.payment = options.payment;
  }
  if (typeof options.capturePayment === "boolean") {
    payload.capture_payment = options.capturePayment;
  }

  orderStatus.textContent = "Submitting order...";
  const result = await safeWrite({
    method: "POST",
    path: "/adapters/retail/checkout",
    body: payload,
    scope: `orders.create:${Date.now()}`
  });

  if (result.queued) {
    orderStatus.textContent = "Order queued (offline).";
    return result;
  }

  if (!result.response?.ok) {
    const message = result.response?.data?.message || "Order request failed.";
    orderStatus.textContent = message;
    return result;
  }

  const responseData = result.response.data;
  const order = responseData?.order ?? responseData;
  const paymentIntent = responseData?.payment_intent;
  const capturedPayment = responseData?.captured_payment;
  if (order) {
    orderStatus.textContent = `Order created: ${order.order_no} (${order.total_amount} ${order.currency})`;
  } else {
    orderStatus.textContent = "Order created.";
  }
  if (paymentIntent) {
    const status = paymentIntent.status ? ` (${paymentIntent.status})` : "";
    const intentLabel = paymentIntent.id ? ` ${paymentIntent.id}` : "";
    orderStatus.textContent += ` | Payment intent${intentLabel}${status}`;
    if (paymentIntent.checkout_url) {
      orderStatus.textContent += ` | Checkout: ${paymentIntent.checkout_url}`;
    }
  }
  if (capturedPayment) {
    orderStatus.textContent += " | Payment captured.";
  }
  state.lastOrder = order || null;
  state.lastPaymentIntent = paymentIntent || null;
  state.cart = [];
  renderCart();
  return result;
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

    const message = response.data?.message || response.data?.error || "Request failed.";
    showToast(`${message} (${response.status}).`, "error");
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
      extraHeaders: getRequestHeaders({ includeCashier: false }),
      skipAuth: true
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

if (managerActivateForm) {
  managerActivateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.config) {
      showToast("Config not loaded. Reload the app.", "error");
      return;
    }
    if (!state.config.groupId || !state.config.subsidiaryId) {
      showToast("Group and subsidiary IDs are required in config.", "error");
      return;
    }
    if (!state.config.deviceId) {
      showToast("Device ID missing in config.", "error");
      return;
    }
    if (!state.online) {
      showToast("API offline. Check the connection first.", "error");
      return;
    }

    const employeeNo = managerEmployeeNoInput.value.trim();
    const pin = managerPinInput.value.trim();
    if (!employeeNo || !pin) {
      showToast("Manager employee number and PIN are required.", "error");
      return;
    }

    const loginResponse = await window.pos.request({
      method: "POST",
      path: "/pos/cashiers/login",
      body: { employee_no: employeeNo, pin },
      extraHeaders: getRequestHeaders({ includeCashier: false }),
      skipAuth: true
    });

    if (!loginResponse.ok) {
      const message = loginResponse.data?.message || "Manager login failed.";
      showToast(message, "error");
      if (managerInfo) managerInfo.textContent = message;
      return;
    }

    const permissions = loginResponse.data?.user?.permissions ?? [];
    const isManager = permissions.includes("*") || permissions.includes("pos.devices.manage");
    if (!isManager) {
      const message = "Manager permission required to activate device.";
      showToast(message, "error");
      if (managerInfo) managerInfo.textContent = message;
      return;
    }

    const activateResponse = await window.pos.request({
      method: "POST",
      path: "/pos/devices/activate",
      body: {
        device_id: state.config.deviceId,
        location_id: state.selectedLocationId || state.config.locationId || undefined
      },
      extraHeaders: {
        ...getRequestHeaders({ includeCashier: false }),
        Authorization: `Bearer ${loginResponse.data?.access_token}`
      },
      skipAuth: true
    });

    if (!activateResponse.ok) {
      const message = activateResponse.data?.message || "Device activation failed.";
      showToast(message, "error");
      if (managerInfo) managerInfo.textContent = message;
      return;
    }

    const accessToken = activateResponse.data?.access_token;
    if (!accessToken) {
      showToast("Activation succeeded but token was missing.", "error");
      return;
    }

    state.config = window.pos.saveConfig({ jwt: accessToken });
    configRawEl.textContent = JSON.stringify(maskConfig(state.config), null, 2);
    managerPinInput.value = "";
    const hours = Math.round((activateResponse.data?.expires_in ?? 0) / 3600);
    if (managerInfo) {
      managerInfo.textContent = `Device activated. Token valid for ${hours || 24} hours.`;
    }
    showToast("Device token refreshed.");
    updateTokenStatus();
    clearCashierSession();
  });
}

openShiftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedLocationId) {
    showToast("Location missing in config.", "error");
    return;
  }
  if (!state.config?.deviceId) {
    showToast("Device ID missing in config.", "error");
    return;
  }
  if (!state.cashierToken) {
    showToast("Cashier sign-in required.", "error");
    return;
  }

  const payload = {
    device_id: state.config.deviceId,
    opening_float: openingFloatInput.value ? Number(openingFloatInput.value) : undefined,
    opened_by_id: state.cashier?.id,
    notes: openNotesInput.value.trim() || undefined
  };

  const result = await safeWrite({ method: "POST", path: "/pos/shifts", body: payload, scope: "pos.shift.open" });
  if (!result.queued) {
    showToast("Shift opened.");
    await refreshOpenShift();
    await evaluateAppState();
  }
});

closeShiftForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.openShift) {
    showToast("No open shift to close.", "error");
    return;
  }
  if (!state.cashierToken) {
    showToast("Cashier sign-in required.", "error");
    return;
  }

  const payload = {
    closing_float: closingFloatInput.value ? Number(closingFloatInput.value) : undefined,
    closed_by_id: state.cashier?.id,
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
    await evaluateAppState();
  }
});

searchProductsButton.addEventListener("click", loadProducts);
productSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    loadProducts();
  }
});

if (filterCategoryButton) {
  filterCategoryButton.addEventListener("click", () => toggleFilterDrawer("category", "Categories"));
}
if (filterBrandButton) {
  filterBrandButton.addEventListener("click", () => toggleFilterDrawer("brand", "Brands"));
}
if (filterFeaturedButton) {
  filterFeaturedButton.addEventListener("click", () => {
    setFilterMode("featured");
    closeFilterDrawer();
  });
}
if (addCustomerButton) {
  addCustomerButton.addEventListener("click", () => openCustomerModal());
}
if (closeCustomerModalButton) {
  closeCustomerModalButton.addEventListener("click", () => closeCustomerModal());
}
if (setWalkInButton) {
  setWalkInButton.addEventListener("click", () => {
    setCustomer(null);
    closeCustomerModal();
  });
}
if (customerSearchButton) {
  customerSearchButton.addEventListener("click", () => loadCustomers());
}
if (customerSearchInput) {
  customerSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadCustomers();
    }
  });
}

if (discountInput) {
  discountInput.addEventListener("input", handleDiscountChange);
}
if (taxRateInput) {
  taxRateInput.addEventListener("input", handleTaxRateChange);
}
if (shippingInput) {
  shippingInput.addEventListener("input", handleShippingChange);
}
if (applyCouponButton) {
  applyCouponButton.addEventListener("click", () => applyCoupon());
}
if (couponCodeInput) {
  couponCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCoupon();
    }
  });
}

submitOrderButton.addEventListener("click", () => submitOrder());
clearCartButton.addEventListener("click", () => {
  state.cart = [];
  orderStatus.textContent = "Cart cleared.";
  renderCart();
});

if (payCardButton) {
  payCardButton.addEventListener("click", () => openPaymentModal("card"));
}
if (payCashButton) {
  payCashButton.addEventListener("click", () => openPaymentModal("manual"));
}
if (payTransferButton) {
  payTransferButton.addEventListener("click", () => openPaymentModal("transfer"));
}
if (paySplitButton) {
  paySplitButton.addEventListener("click", () => showToast("Split payments are coming soon."));
}
if (payInstallmentButton) {
  payInstallmentButton.addEventListener("click", () => showToast("Installments are coming soon."));
}
if (payDepositButton) {
  payDepositButton.addEventListener("click", () => showToast("Deposits are coming soon."));
}
if (payPointsButton) {
  payPointsButton.addEventListener("click", () => showToast("Points redemption is coming soon."));
}
if (payDraftButton) {
  payDraftButton.addEventListener("click", () => submitOrder());
}
if (payCancelButton) {
  payCancelButton.addEventListener("click", () => {
    state.cart = [];
    orderStatus.textContent = "Checkout cancelled.";
    renderCart();
  });
}
if (payRecentButton) {
  payRecentButton.addEventListener("click", () => openRecentModal());
}

if (paymentForm) {
  paymentForm.addEventListener("submit", handlePaymentSubmit);
}
if (paymentMethod) {
  paymentMethod.addEventListener("change", updatePaymentFormState);
}
if (closePaymentModalButton) {
  closePaymentModalButton.addEventListener("click", () => closePaymentModal());
}
if (cancelPaymentButton) {
  cancelPaymentButton.addEventListener("click", () => closePaymentModal());
}
if (refundForm) {
  refundForm.addEventListener("submit", handleRefundSubmit);
}
if (closeRefundModalButton) {
  closeRefundModalButton.addEventListener("click", () => closeRefundModal());
}
if (cancelRefundButton) {
  cancelRefundButton.addEventListener("click", () => closeRefundModal());
}
if (closeRecentModalButton) {
  closeRecentModalButton.addEventListener("click", () => closeRecentModal());
}
if (refreshRecentButton) {
  refreshRecentButton.addEventListener("click", () => loadRecentOrders());
}
if (closeFilterDrawerButton) {
  closeFilterDrawerButton.addEventListener("click", () => closeFilterDrawer());
}

refreshDeviceButton.addEventListener("click", refreshDevice);
refreshShiftButton.addEventListener("click", refreshOpenShift);
refreshQueueButton.addEventListener("click", renderQueue);
if (reloadConfigButton) {
  reloadConfigButton.addEventListener("click", () => {
    loadConfig();
    evaluateAppState();
  });
}
if (reloadConfigMissingButton) {
  reloadConfigMissingButton.addEventListener("click", () => {
    loadConfig();
    evaluateAppState();
  });
}
checkHealthButton.addEventListener("click", async () => {
  await checkHealth();
  updateTokenStatus();
});

if (navShiftButton) {
  navShiftButton.addEventListener("click", () => {
    if (!state.cashierToken) return;
    setView("shift");
  });
}

if (navCheckoutButton) {
  navCheckoutButton.addEventListener("click", () => {
    if (!state.openShift) return;
    setView("checkout");
  });
}

if (navSignOutButton) {
  navSignOutButton.addEventListener("click", () => {
    clearCashierSession();
    showToast("Cashier signed out.");
  });
}

if (proceedCheckoutButton) {
  proceedCheckoutButton.addEventListener("click", () => {
    if (!state.openShift) {
      showToast("Open a shift first.", "error");
      return;
    }
    setView("checkout");
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
  setView("loading");
  loadConfig();
  renderCashier();
  updateTokenStatus();
  await evaluateAppState();
  renderQueue();
  renderCart();
  renderProducts();
  startIdleTimer();
  await refreshCaches();
  await syncQueue();
  setInterval(updateTokenStatus, 30000);
  setInterval(refreshCaches, CACHE_REFRESH_MS);
  setInterval(syncQueue, QUEUE_SYNC_MS);
}

bootstrap();
