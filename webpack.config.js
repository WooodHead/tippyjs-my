const path = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')


const extractSass = new ExtractTextPlugin({
  filename: "tippy.css",
  disable: process.env.NODE_ENV === "development"
});

module.exports = {
  devServer: {
    contentBase: path.join(__dirname), // boolean | string | array, static file location
    // hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    // noInfo: true, // only errors & warns on hot reload
    // inline:true
    hot: true,
    inline: true,
  },

  entry: ['./app.js'],
  output: {
    path: path.join(__dirname, 'js'),
    filename: 'tippy.js'
  },
  module: {
    rules: [{
        test: /\.scss$/,
        use: extractSass.extract({
          use: [{
              loader: "css-loader",
              options: {
                minimize: true
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [
                  require('autoprefixer')({
                    browsers: ['>0.5%']
                  })
                ]
              }
            },
            {
              loader: "sass-loader"
            }
          ],
          fallback: "style-loader"
        })
      }, {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }],
        exclude: /node_modules/
      },
      {
        test: path.resolve(__dirname, 'node_modules/webpack-dev-server/client'),
        loader: 'null-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    extractSass
  ]
}