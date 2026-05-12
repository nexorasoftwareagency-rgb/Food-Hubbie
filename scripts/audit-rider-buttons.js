const fs = require('fs');
const path = require('path');

const buttonIds = [
    "btnAcceptOrder", "btnCancelPayment", "btnClearAllNotifs", "btnCloseNotifSheet",
    "btnCloseOTP", "btnCloseSettlement", "btnConfirmNo", "btnConfirmOTP",
    "btnConfirmPickup", "btnConfirmYes", "btn-edit-address", "btn-edit-phone",
    "btn-edit-photo", "btnIgnoreOrder", "btnRefreshApp", "btnResendOTP",
    "btn-toggle-aadhar", "btnViewSettlements"
];

const jsFile = path.join(__dirname, '../RiderApp/app.js');
const content = fs.readFileSync(jsFile, 'utf8');

console.log("🔍 RIDER APP BUTTON AUDIT\n");
let missingCount = 0;
buttonIds.forEach(id => {
    if (content.includes(id)) {
        console.log(`✅ ${id.padEnd(30)} FOUND`);
    } else {
        console.log(`❌ ${id.padEnd(30)} MISSING!`);
        missingCount++;
    }
});

console.log(`\n📊 SUMMARY: ${buttonIds.length - missingCount}/${buttonIds.length} Buttons Linked`);
process.exit(missingCount > 0 ? 1 : 0);
