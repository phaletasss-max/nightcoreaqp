// Babel config para Expo Router. babel-preset-expo ya incluye el soporte de
// expo-router (el antiguo plugin `expo-router/babel` quedó deprecado y fusionado).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
