import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals"),
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@next/next/no-img-element": "off",
            "react-hooks/exhaustive-deps": "warn"
        }
    }
];

export default eslintConfig;
