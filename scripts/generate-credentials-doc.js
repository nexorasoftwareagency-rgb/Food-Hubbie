const admin = require('firebase-admin');
const serviceAccount = require('../bot/service-account.json');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function generateDoc() {
    const data = {};
    
    // Extract Admins
    const adminsSnap = await db.ref('admins').once('value');
    const admins = adminsSnap.val() || {};
    
    // Extract Riders
    const ridersSnap = await db.ref('riders').once('value');
    const riders = ridersSnap.val() || {};
    
    // Extract Businesses/Outlets
    const bizSnap = await db.ref('businesses').once('value');
    const businesses = bizSnap.val() || {};

    let content = "# Foodhubbie Ecosystem Credentials\n\n";
    content += "*Generated on: " + new Date().toLocaleString() + "*\n\n";

    content += "## 🔑 Super Admin Credentials\n\n";
    content += "| Name | Email | Password | Role |\n";
    content += "| :--- | :--- | :--- | :--- |\n";
    
    // SuperAdmin from script — password must be set via env var, never hardcoded
    content += "| Username | Nexorasoftwareagency@gmail.com | [SET VIA FIREBASE CONSOLE] | SuperAdmin |\n";
    
    // Other admins from DB
    content += "\n## 🏬 Shop Admin Credentials\n\n";
    content += "| Name | Email | Password (Legacy) | Business | Outlet | Role |\n";
    content += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";
    
    for (const [uid, admin] of Object.entries(admins)) {
        if (admin.email === 'Nexorasoftwareagency@gmail.com') continue;
        content += `| ${admin.name || 'N/A'} | ${admin.email || 'N/A'} | ${admin.password || '---'} | ${admin.businessId || 'N/A'} | ${admin.outlet || 'N/A'} | ${admin.role || 'Admin'} |\n`;
    }

    content += "\n## 🚴 Rider Fleet Credentials\n\n";
    content += "| Name | Phone | Passcode | Email | Status |\n";
    content += "| :--- | :--- | :--- | :--- | :--- |\n";
    
    for (const [uid, rider] of Object.entries(riders)) {
        content += `| ${rider.name || 'N/A'} | ${rider.phone || 'N/A'} | ${rider.passcode || '---'} | ${rider.email || 'N/A'} | ${rider.status || 'Active'} |\n`;
    }

    content += "\n## 🏢 Business & Outlet Slugs\n\n";
    content += "| Business Name | Business ID | Outlet Name | Outlet ID | Slug |\n";
    content += "| :--- | :--- | :--- | :--- | :--- |\n";
    
    for (const [bizId, biz] of Object.entries(businesses)) {
        const outlets = biz.outlets || {};
        for (const [outId, outlet] of Object.entries(outlets)) {
            content += `| ${biz.name || 'N/A'} | ${bizId} | ${outlet.name || 'N/A'} | ${outId} | ${outlet.slug || outlet.meta?.slug || 'N/A'} |\n`;
        }
    }

    content += "\n## 🛠️ System Configurations\n\n";
    content += "- **Firebase DB:** https://food-hubbie-default-rtdb.firebaseio.com\n";
    content += "- **Service Account:** bot/service-account.json\n";

    fs.writeFileSync('Credential.md', content);
    console.log("✅ Credential.md generated successfully!");
    process.exit(0);
}

generateDoc();
