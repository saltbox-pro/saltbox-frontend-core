const { merge } = require("webpack-merge");
const webpack = require("webpack");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "saltbox",
    projectName: "core",
    webpackConfigEnv,
    argv,
    outputSystemJS: false,
  });

  const config = merge(defaultConfig, {
    devServer: {
      port: 4202,
    },
    resolve: {
      alias: {
        "saltbox-core": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "public/locales", to: "locales" },
        ],
      }),
      new webpack.DefinePlugin({
        DEVELOPMENT: argv.mode === 'development',
        PRODUCTION: argv.mode === 'production',
      }),
    ],
    output: {
      filename: 'index.js',
    },
  });

  config.externals = [];

  return config;
};
