export function validateCoords(lat, lng) {
  const l = parseFloat(lat);
  const n = parseFloat(lng);
  if (isNaN(l) || l < -90 || l > 90) return { valid: false, msg: "Invalid Latitude (-90 to 90)" };
  if (isNaN(n) || n < -180 || n > 180) return { valid: false, msg: "Invalid Longitude (-180 to 180)" };
  return { valid: true };
}

export function validatePhone(phone, label) {
  if (!phone) return true;
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length === 10) return { valid: true, value: "91" + clean };
  if (clean.length !== 12 || !clean.startsWith("91"))
    return { valid: false, msg: `${label} must be 10 digits or 12 digits starting with 91` };
  return { valid: true, value: clean };
}

export function validateGSTIN(gst) {
  if (!gst) return true;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(gst)) return { valid: false, msg: "Invalid GSTIN Format" };
  return { valid: true };
}

export function validateFSSAI(fssai) {
  if (!fssai) return true;
  if (!/^[0-9]{14}$/.test(fssai)) return { valid: false, msg: "FSSAI must be exactly 14 digits" };
  return { valid: true };
}

export function validateBackupCode(code) {
  if (!/^[0-9]{4}$/.test(code)) return { valid: false, msg: "Backup Code must be 4 digits" };
  return { valid: true };
}
