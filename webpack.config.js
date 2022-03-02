const path = require('path');

module.exports = {
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ]
  },
  output: {
    filename: 'app.js',
    path: path.join(__dirname, 'dist'),
    publicPath: "/dist/",
    sourceMapFilename: "[file].map", // Default
    devtoolModuleFilenameTemplate:
      "webpack:///[resource-path]?[loaders]",
  },
  mode: 'development',
  devtool: 'eval-source-map'
};