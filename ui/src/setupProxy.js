const { createProxyMiddleware } = require('http-proxy-middleware');

const proxy = process.env.ALEPH_UI_API_URL || "http://api:5000"

// Proxy all requests for '/api' services to the development API.
// Base on the 'Configuring the Proxy Manually' section of
//  https://create-react-app.dev/docs/proxying-api-requests-in-development/
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: proxy,
      changeOrigin: true,
    })
  );
};
