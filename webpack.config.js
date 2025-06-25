const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const path = require("path");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "saltbox",
    projectName: "core",
    webpackConfigEnv,
    argv,
    outputSystemJS: false,
  });

  return merge(defaultConfig, {
    resolve: {
      alias: {
        "@packages": path.resolve(__dirname, "src/shared"),
        "@store": path.resolve(__dirname, "src/store"),
        "@api": path.resolve(__dirname, "src/api/generated"),
      },
    },
    devServer: {
      port: 4002,
    },
  });
};
