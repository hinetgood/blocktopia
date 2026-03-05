const fs = require("fs");
const path = require("path");

function removeRecursive(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || stat.isFile()) {
    fs.unlinkSync(target);
    return;
  }
  for (const entry of fs.readdirSync(target)) {
    removeRecursive(path.join(target, entry));
  }
  fs.rmdirSync(target);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  const root = process.cwd();
  const distDir = path.join(root, "dist");
  removeRecursive(distDir);
  fs.mkdirSync(distDir, { recursive: true });

  copyRecursive(path.join(root, "index.html"), path.join(distDir, "index.html"));
  copyRecursive(path.join(root, "assets"), path.join(distDir, "assets"));

  console.log("Build complete: dist updated");
}

main();
