/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 * @format
 */

// Import the default Expo Metro config
const { getDefaultConfig } = require('@expo/metro-config');

// Get the default Expo Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

// Customize the configuration to include your extra node modules
defaultConfig.resolver.extraNodeModules = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('readable-stream'),
  url: require.resolve('react-native-url-polyfill'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
};

// Export the modified configuration
module.exports = defaultConfig;