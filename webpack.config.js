var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

const APP_PATH = path.resolve(__dirname, './aleph/static');

module.exports = function(env) {
  return {
    entry: {
      aleph: glob.sync('./aleph/static/js/**/*.js'),
      vendor: [
        './aleph/static/vendor/jquery/dist/jquery.js',
        './aleph/static/vendor/moment/moment.js',
        './aleph/static/vendor/pdfjs-dist/build/pdf.js',
        './aleph/static/vendor/pdfjs-dist/build/pdf.worker.js',
        // Angular
        './aleph/static/vendor/angular/angular.js',
        './aleph/static/vendor/angular-pdf/dist/angular-pdf.js',
        './aleph/static/vendor/angular-route/angular-route.js',
        './aleph/static/vendor/angular-truncate/src/truncate.js',
        './aleph/static/vendor/angular-sanitize/angular-sanitize.js',
        './aleph/static/vendor/angular-loading-bar/src/loading-bar.js',
        './aleph/static/vendor/angular-animate/angular-animate.js',
        './aleph/static/vendor/angular-ui-select/dist/select.js',
        './aleph/static/vendor/angular-bootstrap/ui-bootstrap-tpls.js',
        './aleph/static/vendor/ng-file-upload/ng-file-upload.js',
      ]
    },
    output: {
      filename: '[name].js?',
      path: path.resolve(APP_PATH, 'dist'),
      pathinfo: !env.prod,
    },
    devtool: env.prod ? 'source-map' : 'eval',
    module: {
      loaders: [
        {
          test: /\.(jpg|png|gif|svg|woff2?|ttf|eot)$/,
          use: 'file-loader?name=[name].[ext]'
        },
        {
          test: /\.(css|scss)$/,
          loader: ExtractTextPlugin.extract({
            loader: 'css-loader!sass-loader',
            query: {
              sourceMap: true,
              includePaths: [
                path.resolve(APP_PATH, 'vendor')
              ]
            }
          })
        }
      ]
    },
    plugins: [
      // Generate an external css file with a hash in the filename
      new ExtractTextPlugin({
        filename: 'aleph.css', disable: false, allChunks: true
      }),

      // Minify JS
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: true
        }
      }),
    ]
  };
};
