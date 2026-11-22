var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var diagnostics_exports = {};
__export(diagnostics_exports, {
  staticDiagnose: () => staticDiagnose
});
module.exports = __toCommonJS(diagnostics_exports);
const NODE_BUILTINS = /* @__PURE__ */ new Set([
  "assert",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "querystring",
  "readline",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "worker_threads",
  "zlib"
]);
const CODE_FILE = /\.(tsx?|jsx?|mjs|cjs)$/i;
const RESOLVE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".css", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
const IMPORT_RE = /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9_-]{24,}\b/, "\u06A9\u0644\u06CC\u062F \u0634\u0628\u06CC\u0647 OpenAI"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "\u06A9\u0644\u06CC\u062F \u0634\u0628\u06CC\u0647 Google API"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "\u06A9\u0644\u06CC\u062F \u062E\u0635\u0648\u0635\u06CC"],
  [/\bghp_[A-Za-z0-9]{30,}\b/, "\u062A\u0648\u06A9\u0646 GitHub"]
];
function dirname(path) {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : path.slice(0, i);
}
function normalize(path) {
  const out = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}
function packageName(spec) {
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("@/") || spec.startsWith("node:") || spec.startsWith("data:") || /^https?:/.test(spec)) return null;
  const parts = spec.split("/");
  if (spec.startsWith("@")) return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  return parts[0];
}
function staticDiagnose(files) {
  var _a, _b;
  const findings = [];
  const add = (severity, file, message, hint) => findings.push({ severity, file, message, hint });
  for (const [path, content] of files) {
    if (/\.json$/i.test(path) && !/(^|\/)tsconfig[^/]*\.json$/i.test(path) && !/\.jsonc$/i.test(path)) {
      try {
        JSON.parse(content);
      } catch (e) {
        add("error", path, `JSON \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A: ${e.message}`);
      }
    }
    if (/^(<<<<<<<|>>>>>>>) /m.test(content)) add("error", path, "\u0646\u0634\u0627\u0646\u0647\u200C\u0647\u0627\u06CC merge conflict \u062F\u0631 \u0641\u0627\u06CC\u0644 \u0628\u0627\u0642\u06CC \u0645\u0627\u0646\u062F\u0647 \u0627\u0633\u062A.");
    if (/\.ya?ml$/i.test(path) && /^\t/m.test(content)) add("error", path, "\u0641\u0627\u06CC\u0644 YAML \u0628\u0627 Tab \u062A\u0648\u0631\u0641\u062A\u06AF\u06CC \u062F\u0627\u0631\u062F\u061B YAML \u0641\u0642\u0637 \u0641\u0627\u0635\u0644\u0647 (Space) \u0631\u0627 \u0642\u0628\u0648\u0644 \u0645\u06CC\u200C\u06A9\u0646\u062F.");
    if (!/(^|\/)\.env\.example$/.test(path) && !/\.lock$/.test(path)) {
      for (const [re, label] of SECRET_PATTERNS) if (re.test(content)) add("error", path, `\u0627\u062D\u062A\u0645\u0627\u0644 \u0648\u062C\u0648\u062F \u0631\u0627\u0632/\u06A9\u0644\u06CC\u062F (${label}) \u062F\u0627\u062E\u0644 \u0633\u0648\u0631\u0633.`, "\u06A9\u0644\u06CC\u062F \u0631\u0627 \u062D\u0630\u0641 \u0648 \u062F\u0631 Worker Secret \u062B\u0628\u062A \u06A9\u0646.");
    }
  }
  let declared = /* @__PURE__ */ new Set();
  const pkgRaw = files.get("package.json");
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw);
      declared = /* @__PURE__ */ new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {}), ...Object.keys(pkg.peerDependencies || {}), ...Object.keys(pkg.optionalDependencies || {})]);
      if (!((_a = pkg.scripts) == null ? void 0 : _a.build)) add("warning", "package.json", "\u0627\u0633\u06A9\u0631\u06CC\u067E\u062A build \u062A\u0639\u0631\u06CC\u0641 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.");
      const lockExists = ["package-lock.json", "bun.lock", "bun.lockb", "yarn.lock", "pnpm-lock.yaml"].some((f) => files.has(f));
      if (!lockExists) add("info", "package.json", "\u0641\u0627\u06CC\u0644 lock \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F\u061B \u0646\u0633\u062E\u0647 \u0648\u0627\u0628\u0633\u062A\u06AF\u06CC\u200C\u0647\u0627 \u062F\u0631 \u0647\u0631 \u0646\u0635\u0628 \u0645\u0645\u06A9\u0646 \u0627\u0633\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06A9\u0646\u062F.");
    } catch {
    }
  }
  const missingPackages = /* @__PURE__ */ new Map();
  for (const [path, content] of files) {
    if (!CODE_FILE.test(path)) continue;
    IMPORT_RE.lastIndex = 0;
    let match;
    while (match = IMPORT_RE.exec(content)) {
      const spec = (match[1] || match[2] || match[3] || match[4] || "").split("?")[0];
      if (!spec) continue;
      if (spec.startsWith(".")) {
        const base = normalize(`${dirname(path)}/${spec}`);
        if (!RESOLVE_SUFFIXES.some((s) => files.has(base + s))) add("error", path, `\u0645\u0633\u06CC\u0631 import \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: ${spec}`);
      } else if (spec.startsWith("@/")) {
        const base = normalize(spec.slice(2));
        if (!RESOLVE_SUFFIXES.some((s) => files.has(base + s))) add("error", path, `alias import \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: ${spec}`);
      } else {
        const name = packageName(spec);
        if (!name || NODE_BUILTINS.has(name.split("/")[0]) || NODE_BUILTINS.has(spec)) continue;
        if (pkgRaw && !declared.has(name) && !missingPackages.has(name)) missingPackages.set(name, path);
      }
    }
  }
  for (const [name, file] of missingPackages) add("error", file, `\u067E\u06A9\u06CC\u062C \xAB${name}\xBB import \u0634\u062F\u0647 \u0648\u0644\u06CC \u062F\u0631 package.json \u0646\u06CC\u0633\u062A.`, `npm install ${name}`);
  const wrangler = files.get("wrangler.toml");
  if (wrangler) {
    if (/REPLACE_WITH_/i.test(wrangler)) add("error", "wrangler.toml", "\u0645\u0642\u062F\u0627\u0631 placeholder \u0647\u0646\u0648\u0632 \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A (\u0645\u062B\u0644\u0627\u064B database_id).", "npx wrangler d1 create \u0631\u0627 \u0627\u062C\u0631\u0627 \u0648 \u0634\u0646\u0627\u0633\u0647 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646 \u06CC\u0627 scripts/setup.sh \u0631\u0627 \u0627\u062C\u0631\u0627 \u06A9\u0646.");
    const main = (_b = /^main\s*=\s*"([^"]+)"/m.exec(wrangler)) == null ? void 0 : _b[1];
    if (main && !files.has(main.replace(/^\.\//, ""))) add("error", "wrangler.toml", `\u0641\u0627\u06CC\u0644 main \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: ${main}`);
    if (!/^compatibility_date\s*=/m.test(wrangler)) add("warning", "wrangler.toml", "compatibility_date \u062A\u0639\u0631\u06CC\u0641 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.");
    if (/\[assets\]/.test(wrangler) && !/not_found_handling/.test(wrangler)) add("info", "wrangler.toml", '\u0628\u0631\u0627\u06CC SPA \u0628\u0647\u062A\u0631 \u0627\u0633\u062A not_found_handling = "single-page-application" \u062A\u0646\u0638\u06CC\u0645 \u0634\u0648\u062F.');
  }
  const html = files.get("index.html");
  if (html) {
    for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      const src = m[1];
      if (/^(https?:)?\/\//.test(src)) continue;
      if (!files.has(normalize(src))) add("error", "index.html", `\u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u0648\u0631\u0648\u062F\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F: ${src}`);
    }
  }
  if (files.has(".env") || [...files.keys()].some((p) => /(^|\/)\.dev\.vars$/.test(p))) add("error", ".env", "\u0641\u0627\u06CC\u0644 \u0645\u062D\u0631\u0645\u0627\u0646\u0647 (.env \u06CC\u0627 .dev.vars) \u062F\u0627\u062E\u0644 \u067E\u0631\u0648\u0698\u0647 \u0627\u0633\u062A \u0648 \u0646\u0628\u0627\u06CC\u062F \u0645\u0646\u062A\u0634\u0631 \u0634\u0648\u062F.");
  const order = { error: 0, warning: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 200);
}
