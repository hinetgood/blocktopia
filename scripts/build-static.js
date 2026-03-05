const fs = require("fs");
const path = require("path");

const TEST_AD_CONFIG = {
  rewarded: {
    android: "ca-app-pub-3940256099942544/5224354917",
    ios: "ca-app-pub-3940256099942544/1712485313",
  },
  interstitial: {
    android: "ca-app-pub-3940256099942544/1033173712",
    ios: "ca-app-pub-3940256099942544/4411468910",
  },
};

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

function envOrDefault(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function writeAdConfig(distDir) {
  const rewardedAndroid = envOrDefault("ADMOB_REWARDED_ANDROID", TEST_AD_CONFIG.rewarded.android);
  const rewardedIos = envOrDefault("ADMOB_REWARDED_IOS", TEST_AD_CONFIG.rewarded.ios);
  const interstitialAndroid = envOrDefault("ADMOB_INTERSTITIAL_ANDROID", TEST_AD_CONFIG.interstitial.android);
  const interstitialIos = envOrDefault("ADMOB_INTERSTITIAL_IOS", TEST_AD_CONFIG.interstitial.ios);
  const iosAppId = (process.env.ADMOB_APP_ID_IOS || "").trim();
  const hasIosUnitIds = Boolean(
    (process.env.ADMOB_REWARDED_IOS || "").trim() &&
    (process.env.ADMOB_INTERSTITIAL_IOS || "").trim()
  );

  // Formal release mode requires iOS App ID + iOS ad unit IDs.
  const isProd = Boolean(iosAppId && hasIosUnitIds);
  const adConfig = {
    rewarded: { android: rewardedAndroid, ios: rewardedIos },
    interstitial: { android: interstitialAndroid, ios: interstitialIos },
  };

  const output = [
    "// Auto-generated during build. Do not edit dist/ad-config.js directly.",
    `window.__BLOCKTOPIA_AD_TEST_MODE__ = ${isProd ? "false" : "true"};`,
    `window.__BLOCKTOPIA_AD_CONFIG__ = ${JSON.stringify(adConfig, null, 2)};`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(distDir, "ad-config.js"), output, "utf8");
  console.log(`AdMob mode: ${isProd ? "PRODUCTION" : "TEST"}`);
}

function main() {
  const root = process.cwd();
  const distDir = path.join(root, "dist");
  removeRecursive(distDir);
  fs.mkdirSync(distDir, { recursive: true });

  copyRecursive(path.join(root, "index.html"), path.join(distDir, "index.html"));
  copyRecursive(path.join(root, "ad-config.js"), path.join(distDir, "ad-config.js"));
  copyRecursive(path.join(root, "assets"), path.join(distDir, "assets"));
  writeAdConfig(distDir);

  console.log("Build complete: dist updated");
}

main();
