/**
 * ============================================================
 * FOODHUBBIE SAAS — Bot Ecosystem Config (PM2)
 * ============================================================
 * Replaces the separate Pizza-bot/ecosystem.config.js and 
 * Cake-bot/ecosystem.config.js with a unified multi-instance setup.
 * 
 * Each outlet runs as a separate PM2 process with its own
 * BUSINESS_ID and OUTLET_ID environment variables.
 * 
 * To add a new outlet: just add another entry to the apps array.
 * ============================================================
 */

module.exports = {
  apps: [
    {
      name: "foodhubbie-bot-roshani-pizza",
      script: "index.js",
      cwd: __dirname,
      env: {
        BUSINESS_ID: "business_roshani",
        OUTLET_ID: "outlet_pizza",
        FIREBASE_DATABASE_URL: "https://food-hubbie-default-rtdb.firebaseio.com",
        BOT_LABEL: "Roshani Pizza Bot"
      },
      watch: false,
      max_memory_restart: "300M"
    },
    {
      name: "foodhubbie-bot-roshani-cake",
      script: "index.js",
      cwd: __dirname,
      env: {
        BUSINESS_ID: "business_roshani",
        OUTLET_ID: "outlet_cake",
        FIREBASE_DATABASE_URL: "https://food-hubbie-default-rtdb.firebaseio.com",
        BOT_LABEL: "Roshani Cake Bot"
      },
      watch: false,
      max_memory_restart: "300M"
    }
  ]
};
