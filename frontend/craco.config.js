const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Polyfill Node.js core modules needed by jmuxer (and other packages)
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
      return webpackConfig;
    },
  },
};
