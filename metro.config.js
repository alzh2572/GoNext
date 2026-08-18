const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Нужно для expo-sqlite на web (wa-sqlite.wasm)
config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const ua = String(req.headers['user-agent'] || '');
    const isBrowser = /Mozilla\/|Chrome\/|Safari\//i.test(ua);

    // COEP/COOP нужны только браузеру. На Expo Go (Android OkHttp) они
    // могут зависнуть на Reloading / Bundling 100%.
    if (isBrowser) {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }

    return middleware(req, res, next);
  };
};

module.exports = config;
