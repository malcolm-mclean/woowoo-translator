import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const define = {};
Object.keys(process.env).forEach((key) => {
  if (key.startsWith("WOOWOO_")) {
    define[`process.env.${key}`] = JSON.stringify(process.env[key]);
  }
});

const assetsDir = path.join(__dirname, "../src");
const distDir = path.join(__dirname, "../dist");

const copyAssets = () => {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const cssSource = path.join(assetsDir, "style.css");
  const cssDest = path.join(distDir, "style.css");
  if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, cssDest);
  }

  const htmlSource = path.join(assetsDir, "index.html");
  const htmlDest = path.join(distDir, "index.html");
  if (fs.existsSync(htmlSource)) {
    fs.copyFileSync(htmlSource, htmlDest);
  }
};

copyAssets();

esbuild.build({
  entryPoints: [path.join(assetsDir, "app.ts")],
  bundle: true,
  outfile: path.join(distDir, "app.js"),
  define,
  minify: true,
  format: "esm",
  target: "es2020",
});
