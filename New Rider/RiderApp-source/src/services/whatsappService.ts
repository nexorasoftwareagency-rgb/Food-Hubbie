// === src/services/whatsappService.ts ===
// Sends customer-facing WhatsApp alerts. The WhatsApp bot engine (Evolution API)
// watches bot/{bid}/{oid}/commands and delivers the message — the rider app
// NEVER talks to Evolution API directly (PRD §12.12, matches SupremeAdmin proxy pattern).

import { db, ref, push, serverTimestamp } from "@/lib/firebase";
import { dbPaths, WHATSAPP_TEMPLATES } from "@/lib/constants";
import { cleanPhoneDigits } from "@/lib/utils";

async function sendGenericMessage(bid: string, oid: string, phone: string, message: string): Promise<void> {
  const cleanPhone = cleanPhoneDigits(phone);
  if (!cleanPhone) return; // no phone on file — skip silently, not fatal to the delivery flow
  const cmdRef = ref(db, dbPaths.botCommands(bid, oid));
  await push(cmdRef, {
    action: "SEND_GENERIC_MESSAGE",
    phone: cleanPhone,
    message,
    timestamp: serverTimestamp(),
  });
}

export const whatsappService = {
  sendAccepted(bid: string, oid: string, customerPhone: string, riderName: string, orderId: string) {
    return sendGenericMessage(bid, oid, customerPhone, WHATSAPP_TEMPLATES.ACCEPTED(riderName, orderId));
  },
  sendPickedUp(bid: string, oid: string, customerPhone: string, riderName: string, riderPhone: string, orderId: string) {
    return sendGenericMessage(
      bid,
      oid,
      customerPhone,
      WHATSAPP_TEMPLATES.PICKED_UP(riderName, riderPhone, orderId)
    );
  },
  sendReachedDrop(bid: string, oid: string, customerPhone: string, orderId: string) {
    return sendGenericMessage(bid, oid, customerPhone, WHATSAPP_TEMPLATES.REACHED_DROP(orderId));
  },
  sendOtp(bid: string, oid: string, customerPhone: string, orderId: string, otp: string) {
    return sendGenericMessage(bid, oid, customerPhone, WHATSAPP_TEMPLATES.SEND_OTP(orderId, otp));
  },
  sendArrived(bid: string, oid: string, customerPhone: string, orderId: string) {
    return sendGenericMessage(bid, oid, customerPhone, WHATSAPP_TEMPLATES.ARRIVED(orderId));
  },
};
