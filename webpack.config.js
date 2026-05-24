const path = require("path");

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const webpack = require("webpack");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const { merge } = require("webpack-merge");

class EmitEntryShimPlugin {
  constructor(opts) {
    this.shimName = opts.shimName;
    this.entryName = opts.entryName || "main";
  }
  apply(compiler) {
    const pluginName = "EmitEntryShimPlugin";
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const entrypoint = compilation.entrypoints.get(this.entryName);
          if (!entrypoint) return;
          const entryChunk = entrypoint.getEntrypointChunk();
          const jsFile = [...entryChunk.files].find((f) => f.endsWith(".js"));
          if (!jsFile || jsFile === this.shimName) return;
          const shim = `export * from "./${jsFile}";\n`;
          compilation.emitAsset(this.shimName, new compiler.webpack.sources.RawSource(shim));
        }
      );
    });
  }
}

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
        filename: "[name].[contenthash].worker.js",
        publicPath: isDev ? "http://localhost:4202/" : undefined,
      }),
      isProd && new EmitEntryShimPlugin({ shimName: "index.js" }),
    ].filter(Boolean),
    output: {
      filename: isProd ? "index.[contenthash].js" : "index.js",
      chunkFilename: "[name].[contenthash].js",
      assetModuleFilename: "assets/[name].[contenthash][ext]",
    },
    optimization: {
      moduleIds: "deterministic",
      chunkIds: "deterministic",
      runtimeChunk: false,
      splitChunks: {
        chunks: "async",
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
  });

  config.externals = [];

  return config;
};
