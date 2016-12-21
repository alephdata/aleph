var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');

const APP_PATH = path.resolve(__dirname, './aleph/static');

module.exports = function(env) {
  return {
    devtool: env.prod ? 'source-map' : 'eval',
    entry: {
      aleph: [
        path.resolve(APP_PATH, 'style/aleph.scss'),
      ].concat(
        glob.sync(path.resolve(APP_PATH, 'js/**/*.js'))
      )
    },
    output: {
      filename: '[name].js?',
      path: path.resolve(APP_PATH, 'assets'),
      pathinfo: !env.prod,
    },
    module: {
      loaders: [
        {
          test: /\.(jpg|png|gif|svg|woff2?|ttf|eot)$/,
          use: 'file-loader?name=[name].[ext]'
        },
        {
          test: /\.(css|scss)$/,
          loader: ExtractTextPlugin.extract({
            loader: 'css-loader?sourceMap!sass-loader?sourceMap'
          })
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin({
        filename: 'aleph.css',
        allChunks: true
      }),

      new webpack.optimize.UglifyJsPlugin({
        // Full list of options below
        // https://github.com/mishoo/UglifyJS2/blob/master/lib/compress.js#L50
        compress: {
          warnings: true
        }
      }),
    ]
  };
};
