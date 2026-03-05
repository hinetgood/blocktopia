# GitHub Actions iOS 發版（無 Mac）

此專案已新增 workflow：

- `.github/workflows/ios-testflight.yml`

用途：在 GitHub 的 `macOS runner` 自動建置 iOS IPA，並上傳到 TestFlight。

## 1) 先設定 GitHub Secrets

到 `GitHub Repo -> Settings -> Secrets and variables -> Actions`，新增：

- `APPLE_TEAM_ID`：Apple Developer Team ID（10 碼）
- `APPSTORE_KEY_ID`：App Store Connect API Key ID
- `APPSTORE_ISSUER_ID`：App Store Connect API Issuer ID（UUID）
- `APPSTORE_API_KEY_BASE64`：`.p8` 檔內容做 Base64 後的字串
- `ADMOB_APP_ID_IOS`：AdMob iOS App ID（格式：`ca-app-pub-xxxx~yyyy`）
- `ADMOB_REWARDED_IOS`：AdMob iOS Rewarded 廣告單元 ID
- `ADMOB_INTERSTITIAL_IOS`：AdMob iOS Interstitial 廣告單元 ID
- `ADMOB_REWARDED_ANDROID`（選填）：Android Rewarded ID
- `ADMOB_INTERSTITIAL_ANDROID`（選填）：Android Interstitial ID

## 2) 產生 `APPSTORE_API_KEY_BASE64`

在本機（Windows PowerShell）執行：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\AuthKey_XXXXXX.p8"))
```

把輸出完整字串貼到 `APPSTORE_API_KEY_BASE64`。

## 3) 觸發建置

兩種方式：

1. GitHub `Actions` 頁面手動執行 `iOS TestFlight`（`workflow_dispatch`）
2. push tag：`ios-v1.0.0`（符合 `ios-v*`）

## 4) Workflow 會做的事

1. `npm ci`
2. `npm run build`
3. `npx cap sync ios`
4. `xcodebuild archive`
5. `xcodebuild -exportArchive`
6. `xcrun altool` 上傳 TestFlight

## 5) 常見失敗點

- `No Accounts` / `Provisioning profile` 相關錯誤：
  - 確認 `APPLE_TEAM_ID` 正確
  - 確認 App ID `com.hinetgood.blocktopia` 已在 Apple Developer 建立
  - 確認 App Store Connect API Key 有權限（建議 Admin / App Manager）
- `No IPA file found`：
  - 查看 Archive/Export 步驟 log，通常是簽名或匯出設定失敗

## 6) 上架備註

- workflow 會先檢查 AdMob iOS 正式 ID；沒填會直接失敗，避免誤上測試廣告。
- `dist/ad-config.js` 會在 build 時自動由 Secrets 產生。
- 審核備註請註明：LINE 登入為可選功能（不登入也可遊玩）。
- 隱私政策可用：
  - `https://hinetgood.github.io/blocktopia/privacy-policy.html`
