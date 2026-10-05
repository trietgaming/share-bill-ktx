const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Load the actual TypeScript modules with isolated browser/server dependencies.
// This keeps regression tests on Node's built-in runner without a Next server.
module.exports = function createLoader(mocks = {}, globals = {}) {
    const root = path.resolve(__dirname, "..");
    const cache = new Map();
    const context = vm.createContext({
        console, setTimeout, clearTimeout, URL, Date, Promise, Error, ...globals,
    });
    function load(specifier, parent = root) {
        if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
        if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return require(specifier);
        let filename = specifier.startsWith("@/")
            ? path.resolve(root, specifier.slice(2)) : path.resolve(parent, specifier);
        if (!path.extname(filename)) {
            filename = [".ts", ".tsx", ".js"].map((ext) => filename + ext).find(fs.existsSync);
        }
        if (!filename) throw new Error(`Module not found: ${specifier}`);
        if (cache.has(filename)) return cache.get(filename).exports;
        const module = { exports: {} };
        cache.set(filename, module);
        const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
            fileName: filename,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
                esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
            },
        });
        const factory = vm.runInContext(`(function(require, module, exports) {${outputText}\n})`, context, { filename });
        factory((id) => load(id, path.dirname(filename)), module, module.exports);
        return module.exports;
    }
    return load;
};
