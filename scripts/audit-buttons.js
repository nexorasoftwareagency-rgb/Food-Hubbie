const fs = require('fs');
const path = require('path');

const buttonIds = [
    "btnAddAddonField", "btnAddCatAddonField", "btnAddCategory", "btnAddFeeSlab", "btnAddSizeField",
    "btnChangeCatPhoto", "btnChangeGreetingImg", "btnChangeMenuImg", "btnChangeQR", "btnClearAllNotif",
    "btnClearLostSales", "btnClearNotificationsBottom", "btnClearWalkinCart", "btnConfirmReauth",
    "btnDownloadExcel", "btnDownloadPDF", "btnEnableNotif", "btnGenerateReport", "btnGenerateRiderReport",
    "btnMigrateAddons", "btnMigrateDishAddons", "btnNewTabOutlet", "btnPosQtyDec", "btnPosQtyInc",
    "btnQuickToggleOutlet", "btnRiderExportExcel", "btnRiderExportPDF", "btnRunImageMigration",
    "btnSaveInventory", "btnSaveSettings", "btnSettleRiderAnalytics", "btnShowAddInventory",
    "btnSidebarClose", "btnTestNotif", "btnToggleRiderPass", "btnToggleWifiPass", "btnUpdateDishPhoto",
    "btnUploadAadhar", "btnUploadRiderPhoto", "btnWhatsappReport"
];

const jsDir = path.join(__dirname, '../ShopAdmin/js');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(file => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

const jsFiles = getAllFiles(jsDir);
const results = {};

buttonIds.forEach(id => {
    results[id] = { found: false, files: [] };
    jsFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes(id)) {
            results[id].found = true;
            results[id].files.push(path.basename(file));
        }
    });
});

console.log("🔍 SHOP ADMIN BUTTON AUDIT\n");
let missingCount = 0;
buttonIds.forEach(id => {
    if (results[id].found) {
        console.log(`✅ ${id.padEnd(30)} in [${results[id].files.join(', ')}]`);
    } else {
        console.log(`❌ ${id.padEnd(30)} MISSING!`);
        missingCount++;
    }
});

console.log(`\n📊 SUMMARY: ${buttonIds.length - missingCount}/${buttonIds.length} Buttons Linked`);
process.exit(missingCount > 0 ? 1 : 0);
