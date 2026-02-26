import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

try {
    const nextConfigs = compat.extends("next/core-web-vitals");
    console.log("Successfully expanded next/core-web-vitals. Length:", nextConfigs.length);

    const seen = new WeakSet();
    function checkCircular(obj, path = "$") {
        if (obj && typeof obj === 'object') {
            if (seen.has(obj)) {
                console.log("Circular reference found at path:", path);
                return true;
            }
            seen.add(obj);
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    checkCircular(obj[key], `${path}.${key}`);
                }
            }
        }
        return false;
    }

    console.log("Checking for circular references in nextConfigs...");
    checkCircular(nextConfigs);

    console.log("Attempting to JSON.stringify nextConfigs...");
    try {
        JSON.stringify(nextConfigs);
        console.log("JSON.stringify successful!");
    } catch (e) {
        console.error("JSON.stringify failed:", e.message);
    }
} catch (e) {
    console.error("Error during compat.extends:", e);
}
