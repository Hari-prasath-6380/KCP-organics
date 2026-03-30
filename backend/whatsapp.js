// ============================================================
// 📱 WHATSAPP INTEGRATION MODULE
// File: backend/whatsapp.js
// ============================================================

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Use the bundled Chromium from puppeteer@21 (compatible with whatsapp-web.js)
const puppeteer = require("puppeteer");
const CHROME_PATH = puppeteer.executablePath();

// ── ADMIN PHONE NUMBER ──────────────────────────────────────
// 🔧 Admin WhatsApp Number: +91 6380442089
// Format: CountryCode + PhoneNumber + @c.us (no + or spaces)
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP || "916380442089@c.us";
// ────────────────────────────────────────────────────────────

// Track readiness so we don't try to send before connected
let isClientReady = false;

// ── CLIENT SETUP ─────────────────────────────────────────────
// FIX: Uses a pre-cached WhatsApp Web HTML from GitHub instead of
// loading web.whatsapp.com live (which causes ERR_CONNECTION_TIMED_OUT
// in headless Chrome environments).
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./.wwebjs_auth"
    }),

    // ── 🔧 PUPPETEER: Uses bundled Chromium from puppeteer@21 ────
    puppeteer: {
        headless: true,
        executablePath: CHROME_PATH,
        
        timeout: 60000, // 60 seconds timeout
        
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--no-first-run",
            "--no-zygote",
            "--disable-extensions",
            "--disable-blink-features=AutomationControlled",
            "--disable-default-apps",
            "--disable-sync",
            "--disable-plugins",
            "--disable-images",
            "--disable-component-extensions-with-background-pages",
            "--disable-background-networking",
            "--disable-preconnect",
            "--disable-client-side-phishing-detection",
            "--disable-breakpad",
            "--disable-popup-blocking"
        ]
    }
    // ──────────────────────────────────────────────────────────
});

// ── QR CODE: Scan with WhatsApp → Linked Devices ────────────
client.on("qr", (qr) => {
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║    📱 WHATSAPP: SCAN QR CODE TO LINK DEVICE            ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("");
    qrcode.generate(qr, { small: true });
    console.log("");
    console.log("➡️  STEPS TO LINK:");
    console.log("   1. Open WhatsApp on your phone");
    console.log("   2. Tap MENU (⋮) → Linked Devices → Link a Device");
    console.log("   3. Point camera at the QR code above");
    console.log("");
    console.log("💡 Note: Scan QR code only once. Session will be saved.");
    console.log("════════════════════════════════════════════════════════\n");
});

// ── READY ─────────────────────────────────────────────────────
client.on("ready", () => {
    isClientReady = true;
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ [WhatsApp] CLIENT READY AND CONNECTED");
    console.log("✅ Notifications will be sent to: +91 6380442089");
    console.log("═══════════════════════════════════════════════════════\n");
});

// ── AUTHENTICATED ──────────────────────────────────────────────
client.on("authenticated", () => {
    console.log("🔐 [WhatsApp] Device authenticated — session saved");
    console.log("🔐 No QR code needed on next restart\n");
});

// ── AUTH FAILURE ───────────────────────────────────────────────
client.on("auth_failure", (msg) => {
    isClientReady = false;
    console.error("❌ [WhatsApp] Auth failed:", msg);
});

// ── DISCONNECTED ───────────────────────────────────────────────
client.on("disconnected", (reason) => {
    isClientReady = false;
    console.warn("⚠️  [WhatsApp] Disconnected:", reason);
});

// ── LOADING SCREEN ─────────────────────────────────────────────
client.on("loading_screen", (percent, message) => {
    console.log(`⏳ [WhatsApp] Loading... ${percent}% — ${message}`);
});

// ── BROWSER CRASH HANDLER ──────────────────────────────────────
client.on("remote_session_saved", () => {
    console.log("📱 [WhatsApp] Session saved — you can close WhatsApp Web.");
});

// ── GENERAL ERROR HANDLER ──────────────────────────────────────
client.on("error", (error) => {
    isClientReady = false;
    console.error("❌ [WhatsApp] Error:", error.message);
    console.warn("⚠️  [WhatsApp] Continuing without WhatsApp notifications...");
});

// ── UNHANDLED REJECTION HANDLER ────────────────────────────────
process.on("unhandledRejection", (reason, promise) => {
    if (reason && reason.message && reason.message.includes("Protocol error")) {
        console.warn("⚠️  [WhatsApp] Protocol error (puppeteer context destroyed) — WhatsApp disabled");
        console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
    } else {
        console.error("❌ Unhandled Rejection:", reason);
    }
});

// ── SEND ORDER NOTIFICATION ────────────────────────────────────
/**
 * Sends WhatsApp order notifications to both admin AND customer.
 * Called automatically from POST /orders in server.js
 *
 * @param {Object} orderData
 */
async function sendOrderNotification(orderData) {
    if (!isClientReady) {
        console.warn("⚠️  [WhatsApp] Client not ready yet — notification skipped.");
        return;
    }

    const { customerName, phone, items, totalAmount, paymentMethod, shippingAddress } = orderData;

    // Format each item in the order
    const itemList = items
        .map((item, i) =>
            `  ${i + 1}. ${item.title} × ${item.qty}  →  ₹${(item.price * item.qty).toLocaleString("en-IN")}`
        )
        .join("\n");

    // ── MESSAGE FOR ADMIN ──────────────────────────────────────
    const adminMessage =
`🛒 *New Order — KCP Organics*

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📍 *Address:* ${shippingAddress.address}, ${shippingAddress.city} — ${shippingAddress.pincode}

🪑 *Items Ordered:*
${itemList}

💰 *Total:* ₹${totalAmount.toLocaleString("en-IN")}
💳 *Payment:* ${paymentMethod}

🕐 *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

✅ Login to admin dashboard to update order status.`;

    // ── MESSAGE FOR CUSTOMER ───────────────────────────────────
    const customerMessage =
`✅ *Order Confirmed — KCP Organics*

Thank you for your order, ${customerName}! 🎉

🪑 *Items Ordered:*
${itemList}

💰 *Order Total:* ₹${totalAmount.toLocaleString("en-IN")}
💳 *Payment Method:* ${paymentMethod}

📍 *Delivery Address:*
${shippingAddress.address}
${shippingAddress.city} — ${shippingAddress.pincode}

🕐 *Order Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

You can track your order status through our website. We will notify you once your order is out for delivery.
Thank you for shopping with KCP Organics! 🙏`;

    try {
        // Send notification to ADMIN
        await client.sendMessage(ADMIN_WHATSAPP_NUMBER, adminMessage);
        console.log("✅ [WhatsApp] Order notification sent to admin (+91 6380442089)");

        // Send confirmation to CUSTOMER
        // Format customer phone number for WhatsApp: remove special chars and add @c.us
        const customerWhatsAppNumber = phone.replace(/\D/g, "").slice(-10);
        const fullCustomerNumber = `91${customerWhatsAppNumber}@c.us`;
        
        await client.sendMessage(fullCustomerNumber, customerMessage);
        console.log(`✅ [WhatsApp] Order confirmation sent to customer (+91${customerWhatsAppNumber})`);
    } catch (err) {
        console.error("❌ [WhatsApp] Failed to send message:", err.message);
    }
}

// ── SEND MESSAGE FROM USER ────────────────────────────────────
/**
 * Sends user messages to admin via WhatsApp
 * 
 * @param {string} senderName
 * @param {string} senderPhone
 * @param {string} messageText
 */
async function sendUserMessage(senderName, senderPhone, messageText) {
    if (!isClientReady) {
        console.warn("⚠️  [WhatsApp] Client not ready — user message not sent.");
        return;
    }

    const message =
`💬 *New Message from KCP Organics Website*

👤 *Name:* ${senderName}
📞 *Phone:* ${senderPhone}
🕐 *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

📝 *Message:*
${messageText}

---
Please reply to this customer via WhatsApp or email.`;

    try {
        await client.sendMessage(ADMIN_WHATSAPP_NUMBER, message);
        console.log(`✅ [WhatsApp] User message from ${senderName} sent to admin`);
    } catch (err) {
        console.error("❌ [WhatsApp] Failed to send user message:", err.message);
    }
}

// ── INITIALIZE WITH TIMEOUT ───────────────────────────────────
console.log("\n");
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║          📱 WHATSAPP INITIALIZATION STARTING           ║");
console.log("║                  (May take 20-30 seconds)              ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log("\n");

// Wrap initialization with timeout to prevent hanging
const initTimeout = setTimeout(() => {
    console.warn("⚠️  [WhatsApp] Initialization timeout — WhatsApp will be unavailable");
    console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
}, 60000); // 60 second timeout

client.initialize()
    .then(() => {
        clearTimeout(initTimeout);
        console.log("\n");
        console.log("╔════════════════════════════════════════════════════════╗");
        console.log("║     ✅ WHATSAPP CLIENT INITIALIZED SUCCESSFULLY        ║");
        console.log("╚════════════════════════════════════════════════════════╝");
        console.log("\n");
    })
    .catch((error) => {
        clearTimeout(initTimeout);
        isClientReady = false;
        console.error("\n❌ [WhatsApp] Initialization failed:", error.message);
        
        // Check if it's a Puppeteer/protocol error
        if (error.message && error.message.includes("Protocol error")) {
            console.warn("⚠️  [WhatsApp] Puppeteer protocol error — disabling WhatsApp");
        }
        
        console.warn("⚠️  [WhatsApp] Server will continue without WhatsApp notifications");
        console.warn("💡 [Tip] Try manually scanning QR codes later or restarting the server\n");
    });

// ============================================================
// Exports
// ============================================================
module.exports = { client, sendOrderNotification, sendUserMessage, isClientReady: () => isClientReady };
