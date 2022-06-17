// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

const { createProxyMiddleware } = require('http-proxy-middleware');

// Proxy all requests for '/api' services to the development API.
// Base on the 'Configuring the Proxy Manually' section of
//  https://create-react-app.dev/docs/proxying-api-requests-in-development/
module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://api:5000',
      changeOrigin: true,
    })
  );
};
