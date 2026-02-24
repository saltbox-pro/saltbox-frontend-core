const path = require("path");

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpack = require("webpack");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const { merge } = require("webpack-merge");

module.exports = (webpackConfigEnv, argv) => {
  const isDev = argv.mode === "development";
  const isProd = argv.mode === "production";

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
      new webpack.DefinePlugin({
        DEVELOPMENT: isDev,
        PRODUCTION: isProd,
      }),
      new MonacoWebpackPlugin({
        filename: "[name].worker.js",
        publicPath: isDev ? "http://localhost:4202/" : undefined,
      }),
    ],
    output: {
      filename: "index.js",
    },
  });

  config.externals = [];

  return config;
};
