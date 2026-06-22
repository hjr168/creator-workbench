import { defineConfig } from "@tarojs/cli";
import path from "node:path";

export default defineConfig({
  projectName: "creator-workbench-miniapp",
  date: "2026-06-15",
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: "src",
  outputRoot: "dist",
  alias: {
    "@": path.resolve(__dirname, "..", "src")
  },
  plugins: [],
  defineConstants: {
    "process.env.TARO_APP_API_BASE": JSON.stringify(process.env.TARO_APP_API_BASE || "http://127.0.0.1:3000")
  },
  copy: {
    patterns: [],
    options: {}
  },
  framework: "react",
  compiler: {
    type: "webpack5",
    prebundle: {
      enable: false
    }
  },
  mini: {
    webpackChain(chain) {
      chain.merge({
        watchOptions: {
          ignored: /(?:node_modules|dist)\//
        }
      });
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    }
  },
  h5: {}
});
