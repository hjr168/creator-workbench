import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * 小程序独立 ESLint 配置（flat config）。
 *
 * 根仓库的 eslint.config.mjs 显式忽略了 miniapp/**（它走的是 Next 生态），
 * 因此小程序用这套独立的 typescript-eslint + react-hooks 配置。
 *
 * 依赖 hoist 在根 node_modules，与根仓库版本对齐，无需在小程序内重复安装即可运行。
 */
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".swc/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // Taro 小程序运行时有大量全局注入（Taro、JSX 自动运行时等），
    // 放宽若干在当前环境下误报较多的规则。
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
