/**
 * ============================================================
 * FOODHUBBIE SAAS — Unified Bot Engine
 * ============================================================
 * Orchestrates WhatsApp connection, State Machine, and Listeners.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const { BUSINESS_ID, OUTLET_ID, updateData } = require('./firebase');
const { handleIncomingMessage } = require('./whatsapp-engine');
const { initStatusMonitor } = require('./status-monitor');
const { initCommandListener } = require('./commands');

/**
 * Main Bot Startup Function
 */
async function startBot() {
  console.log(`\n🚀 Starting Foodhubbie SaaS Bot [${BUSINESS_ID}/${OUTLET_ID}]...`);

  // Session storage unique to this outlet
  const sessionPath = path.join(__dirname, 'sessions', `${BUSINESS_ID}_${OUTLET_ID}`);
  if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['Foodhubbie SaaS', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  // Connection handling
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`\n📸 Scan the QR code below to link [${OUTLET_ID}]:`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log(`\n✅ BOT IS ONLINE [${BUSINESS_ID}/${OUTLET_ID}]`);
      
      // Initialize Listeners
      initStatusMonitor(sock);
      initCommandListener(sock);
      
      // Heartbeat
      setInterval(() => {
        updateData('botStatus', { 
          lastSeen: Date.now(), 
          status: 'Online', 
          businessId: BUSINESS_ID, 
          outletId: OUTLET_ID 
        }).catch(() => {});
      }, 60000);
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`\n❌ Connection closed. Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) startBot();
    }
  });

  // Incoming message handling
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    for (const msg of m.messages) {
      if (!msg.message || msg.key.fromMe) continue;
      await handleIncomingMessage(sock, msg);
    }
  });
}

// Global error handling
process.on('uncaughtException', (err) => console.error('CRITICAL UNCAUGHT ERROR:', err));
process.on('unhandledRejection', (err) => console.error('CRITICAL UNHANDLED REJECTION:', err));

startBot();