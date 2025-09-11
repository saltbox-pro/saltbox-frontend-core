const { merge } = require("webpack-merge");
const path = require("path");
const dotEnv = require("dotenv");
const baseConfig = require("./webpack.config");

dotEnv.config();

const commonPath =  process.env.COMMON_REPO_PATH || "";

module.exports = (webpackConfigEnv, argv) => {
  const config = baseConfig(webpackConfigEnv, argv);
  
  return merge(config, {
    resolve: {
      alias: {
        // Link other repositories in dev mode
        ...(commonPath && {
          "@saltbox/saltbox-frontend-common": path.resolve(__dirname, commonPath),
        }),
        // Force single React instance for the link compatibility
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
    },
    module: {
      rules: [
        {
          // Handle CSS from the linked packages
          test: /\.css$/,
          include: [
            commonPath && path.resolve(__dirname, commonPath),
          ].filter(notEmpty => !!notEmpty),
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
  });
};