/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Command Listener
 * ============================================================
 * Listens for commands from the Admin Dashboard at:
 * bot/{businessId}/{outletId}/commands
 */

const { db, resolvePath, getData } = require('./firebase');
const { formatJid } = require('../shared/utils');

/**
 * Initializes the command listener.
 */
function initCommandListener(sock) {
  const path = resolvePath('botCommands'); // businesses/{bid}/outlets/{oid}/botCommands
  console.log(`[Commands] Listening for triggers at: ${path}`);

  const cmdRef = db.ref(path);
  
  cmdRef.on('child_added', async (snap) => {
    const cmd = snap.val();
    if (!cmd) return;

    console.log(`[Commands] Received: ${cmd.action}`);

    try {
      switch (cmd.action) {
        case "SEND_GENERIC_MESSAGE":
          if (cmd.phone && cmd.message) {
            const jid = formatJid(cmd.phone);
            await sock.sendMessage(jid, { text: cmd.message });
          }
          break;

        case "SEND_DAILY_REPORT":
          // TODO: Implement report generation
          console.log("Daily Report requested for:", cmd.targetDate);
          break;
          
        // Add more commands as needed
      }

      // Always remove command after processing
      await snap.ref.remove();
    } catch (err) {
      console.error(`[Commands] Failed to execute ${cmd.action}:`, err.message);
    }
  });
}

module.exports = {
  initCommandListener
};
