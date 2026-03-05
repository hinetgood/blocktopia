// Default ad config: Google test IDs.
// CI will overwrite dist/ad-config.js with production IDs from GitHub Secrets.
window.__BLOCKTOPIA_AD_TEST_MODE__ = true;
window.__BLOCKTOPIA_AD_CONFIG__ = {
  rewarded: {
    android: "ca-app-pub-3940256099942544/5224354917",
    ios: "ca-app-pub-3940256099942544/1712485313",
  },
  interstitial: {
    android: "ca-app-pub-3940256099942544/1033173712",
    ios: "ca-app-pub-3940256099942544/4411468910",
  },
};
