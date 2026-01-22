const escpos = require("escpos");

function parseNumericId(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return undefined;
  const parsed = raw.startsWith("0x") ? Number.parseInt(raw, 16) : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePrinterConfig(config = {}) {
  const type = (config.type || "none").toLowerCase();
  if (type === "none" || !type) return null;
  const columns = Number.isFinite(Number(config.columns)) ? Number(config.columns) : 42;
  return {
    type,
    columns,
    encoding: config.encoding || "GB18030",
    autoCut: config.autoCut !== false,
    kickDrawer: Boolean(config.kickDrawer),
    network: {
      host: config.network?.host || config.host,
      port: Number(config.network?.port || config.port || 9100),
    },
    usb: {
      vendorId: parseNumericId(config.usb?.vendorId ?? config.vendorId),
      productId: parseNumericId(config.usb?.productId ?? config.productId),
    },
    bluetooth: {
      address: config.bluetooth?.address || config.address,
      channel: Number(config.bluetooth?.channel || config.channel || 1),
    },
    headerLines: Array.isArray(config.headerLines) ? config.headerLines : [],
    footerLines: Array.isArray(config.footerLines) ? config.footerLines : [],
  };
}

function resolveAdapter(config) {
  if (config.type === "network") {
    const Network = require("escpos-network");
    return new Network(config.network.host, config.network.port);
  }
  if (config.type === "usb") {
    const Usb = require("escpos-usb");
    if (!Number.isFinite(config.usb.vendorId) || !Number.isFinite(config.usb.productId)) {
      throw new Error("USB printer requires vendorId and productId");
    }
    return new Usb(config.usb.vendorId, config.usb.productId);
  }
  if (config.type === "bluetooth") {
    const Bluetooth = require("escpos-bluetooth");
    if (!config.bluetooth.address) {
      throw new Error("Bluetooth printer requires address");
    }
    return new Bluetooth(config.bluetooth.address, config.bluetooth.channel);
  }
  throw new Error(`Unsupported printer type: ${config.type}`);
}

function formatRow(left, right, width) {
  const leftText = left || "";
  const rightText = right || "";
  const space = width - leftText.length - rightText.length;
  if (space >= 1) return `${leftText}${" ".repeat(space)}${rightText}`;
  return `${leftText}\n${rightText}`;
}

function wrapText(text, width) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    if (!line) {
      line = word;
      return;
    }
    if (line.length + word.length + 1 <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function printLines(printer, lines) {
  lines.forEach((line) => printer.text(line));
}

function renderReceipt(printer, receipt, config) {
  const width = config.columns;
  const divider = "-".repeat(width);

  if (config.headerLines.length) {
    printer.align("ct");
    printLines(printer, config.headerLines);
  }
  if (receipt.header?.length) {
    printer.align("ct");
    printLines(printer, receipt.header);
  }

  printer.align("lt");
  printer.text(divider);

  const metaLines = [];
  if (receipt.meta?.orderNo) metaLines.push(`Order: ${receipt.meta.orderNo}`);
  if (receipt.meta?.date) metaLines.push(`Date: ${receipt.meta.date}`);
  if (receipt.meta?.location) metaLines.push(`Location: ${receipt.meta.location}`);
  if (receipt.meta?.cashier) metaLines.push(`Cashier: ${receipt.meta.cashier}`);
  if (receipt.meta?.customer) metaLines.push(`Customer: ${receipt.meta.customer}`);
  if (receipt.meta?.status) metaLines.push(`Status: ${receipt.meta.status}`);
  printLines(printer, metaLines);

  printer.text(divider);

  const items = Array.isArray(receipt.items) ? receipt.items : [];
  items.forEach((item) => {
    const total = item.total?.toFixed(2) ?? "0.00";
    const nameLines = wrapText(item.name, width - total.length - 1);
    if (nameLines.length) {
      printer.text(formatRow(nameLines[0], total, width));
      nameLines.slice(1).forEach((line) => printer.text(line));
    } else {
      printer.text(formatRow("Item", total, width));
    }
    const detailParts = [];
    if (item.qty) detailParts.push(`${item.qty} x ${item.unitPrice.toFixed(2)}`);
    if (item.variant) detailParts.push(item.variant);
    if (item.sku) detailParts.push(`SKU ${item.sku}`);
    detailParts.forEach((detail) => printer.text(`  ${detail}`));
  });

  printer.text(divider);

  const totals = receipt.totals || {};
  const subtotal = Number(totals.subtotal) || 0;
  const discount = Number(totals.discount) || 0;
  const tax = Number(totals.tax) || 0;
  const shipping = Number(totals.shipping) || 0;
  const total = Number(totals.total) || 0;
  printer.text(formatRow("Subtotal", subtotal.toFixed(2), width));
  if (discount > 0) printer.text(formatRow("Discount", `-${discount.toFixed(2)}`, width));
  if (tax > 0) printer.text(formatRow("Tax", tax.toFixed(2), width));
  if (shipping > 0) printer.text(formatRow("Shipping", shipping.toFixed(2), width));
  printer.text(formatRow("Total", total.toFixed(2), width));

  const payments = Array.isArray(receipt.payments)
    ? receipt.payments
    : receipt.payment
      ? [receipt.payment]
      : [];
  if (payments.length) {
    printer.text(divider);
    printer.align("lt");
    if (receipt.meta?.paymentPlan) {
      printer.text(`Payment plan: ${receipt.meta.paymentPlan}`);
    }
    payments.forEach((payment) => {
      const methodLabel = payment.type ? `${payment.method} (${payment.type})` : payment.method;
      const amountValue = Number(payment.amount);
      const amountLabel = Number.isFinite(amountValue) && amountValue > 0 ? amountValue.toFixed(2) : "";
      if (amountLabel) {
        printer.text(formatRow(methodLabel || "Payment", amountLabel, width));
      } else {
        printer.text(`Payment: ${methodLabel || "manual"}`);
      }
      if (payment.provider) printer.text(`  Provider: ${payment.provider}`);
      if (payment.reference) printer.text(`  Ref: ${payment.reference}`);
      if (payment.status) printer.text(`  Status: ${payment.status}`);
      if (payment.points) printer.text(`  Points: ${payment.points}`);
    });
    const paidTotal = Number(receipt.paid_total) || 0;
    if (paidTotal) {
      printer.text(formatRow("Paid total", paidTotal.toFixed(2), width));
    }
  }

  if (receipt.footer?.length || config.footerLines.length) {
    printer.text(divider);
    printer.align("ct");
    printLines(printer, receipt.footer || []);
    printLines(printer, config.footerLines);
  }

  if (receipt.meta?.offline) {
    printer.text(divider);
    printer.align("ct");
    printer.text("OFFLINE - PENDING SYNC");
  }
}

async function printReceipt(receipt, printerConfig) {
  const config = normalizePrinterConfig(printerConfig);
  if (!config) return { ok: false, error: "Printer not configured" };

  let device;
  try {
    device = resolveAdapter(config);
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }

  const printer = new escpos.Printer(device, { encoding: config.encoding, width: config.columns });

  return new Promise((resolve) => {
    device.open((error) => {
      if (error) {
        resolve({ ok: false, error: error.message || String(error) });
        return;
      }
      try {
        renderReceipt(printer, receipt, config);
        if (config.kickDrawer && typeof printer.cashdraw === "function") {
          printer.cashdraw(2);
        }
        if (config.autoCut && typeof printer.cut === "function") {
          printer.cut();
        }
        printer.close();
        resolve({ ok: true });
      } catch (err) {
        try {
          printer.close();
        } catch {
          // ignore
        }
        resolve({ ok: false, error: err.message || String(err) });
      }
    });
  });
}

async function testPrinter(printerConfig) {
  const receipt = {
    header: ["HoldCo POS", "Printer test"],
    meta: {
      orderNo: "TEST-0001",
      date: new Date().toISOString(),
      location: "Test location",
      cashier: "Test cashier",
      status: "TEST",
    },
    items: [
      { name: "Sample item", qty: 1, unitPrice: 0.01, total: 0.01 },
    ],
    totals: { subtotal: 0.01, discount: 0, tax: 0, shipping: 0, total: 0.01 },
    payment: { method: "manual", provider: "manual", amount: 0.01, status: "TEST" },
    footer: ["Thank you"],
  };

  return printReceipt(receipt, printerConfig);
}

module.exports = { printReceipt, testPrinter };
