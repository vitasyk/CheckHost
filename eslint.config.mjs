import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import typescriptEslint from "typescript-eslint";
import globals from "globals";

export default [
    {
        ignores: [
            "**/.*",
            "**/.next/**",
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/public/**",
            "**/scripts/**",
            "**/*.js",
            "**/*.mjs",
            "**/*.config.js"
        ],
    },
    js.configs.recommended,
    ...typescriptEslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            "@next/next": nextPlugin,
            "react": reactPlugin,
            "react-hooks": hooksPlugin,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            ...reactPlugin.configs.recommended.rules,
            ...hooksPlugin.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "react/no-unknown-property": ["error", { "ignore": ["jsx", "global"] }],
            "@typescript-eslint/no-explicit-any": "off",
            "@next/next/no-img-element": "off",
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/set-state-in-effect": "off",
            "@typescript-eslint/no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_"
            }]
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
];
