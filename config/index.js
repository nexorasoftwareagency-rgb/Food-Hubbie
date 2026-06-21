const FirebaseConfig = require('./firebase-config');
const Constants = require('./constants');
const { TOKENS: ThemeTokens, resolveMarketplaceTheme } = require('./theme-tokens');

module.exports = {
  ...FirebaseConfig,
  ...Constants,
  TOKENS: ThemeTokens,
  resolveMarketplaceTheme,
};
