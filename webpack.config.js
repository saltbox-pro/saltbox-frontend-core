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
    devServer: {
      port: 4202,
    },
    resolve: {
      alias: {
        "saltbox-shared": path.resolve(__dirname, "../saltbox-frontend-shared/src"),
        "saltbox-core-api": path.resolve(__dirname, "../saltbox-frontend-core/src/api/generated"),
        "saltbox-core": path.resolve(__dirname, "../saltbox-frontend-core/src"),
        "saltbox-base": path.resolve(__dirname, "../saltbox-frontend-base/src"),
        "saltbox-flow": path.resolve(__dirname, "../saltbox-frontend-flow/src"),
        "saltbox-root-config": path.resolve(__dirname, "../saltbox-frontend-root-config/src"),
      },
    },
    resolveLoader: {
    }
  });
};
