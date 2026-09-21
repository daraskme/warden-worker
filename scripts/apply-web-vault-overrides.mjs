import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Keep customizations outside the generated upstream bundle. Run after extraction.
const root = fileURLToPath(new URL("../", import.meta.url));
const vault = path.resolve(root, process.argv[2] || "public/web-vault");
const indexPath = path.join(vault, "index.html");
let html = await readFile(indexPath, "utf8");
const viewport = /<meta\b(?=[^>]*\bname=["']viewport["'])[^>]*>/i;
if (!viewport.test(html)) throw new Error("Web Vault viewport marker changed; review the upstream build.");
html = html.replace(viewport, '<meta name="viewport" content="width=device-width, initial-scale=1"/>');
if (!html.includes('href="css/vaultwarden.css"')) {
  throw new Error("Web Vault stylesheet hook changed; review the upstream build.");
}
await mkdir(path.join(vault, "css"), { recursive: true });
await mkdir(path.join(vault, "images"), { recursive: true });
await copyFile(path.join(root, "public/css/vaultwarden.css"), path.join(vault, "css/vaultwarden.css"));
await copyFile(path.join(root, "public/images/warden-wordmark.svg"), path.join(vault, "images/warden-wordmark.svg"));
await writeFile(indexPath, html);
console.log("Applied Warden personal theme and responsive viewport.");
