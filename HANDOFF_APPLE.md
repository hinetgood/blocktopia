# Blocktopia — Apple App Store 上架交接手冊

## TL;DR
Blocktopia 是一款 HTML5 Canvas 方塊消除遊戲，用 Capacitor 包成原生 App。
Android 版已準備好（Google Play 開發者帳號已通過）。
本文件交接 **iOS App Store 上架** 的所有必要資訊。

---

## 1. 專案結構

```
D:\0.技師案子-本地作業\APP\blocktopia\
├── index.html              ← 遊戲主檔（單檔，~4500 行）
├── capacitor.config.ts     ← Capacitor 設定
├── package.json            ← Node 依賴
├── dist/                   ← Web 輸出目錄（webDir）
├── android/                ← Capacitor Android 專案（已生成）
├── ios/                    ← Capacitor iOS 專案（已生成）
│   ├── App/
│   ├── capacitor-cordova-ios-plugins/
│   └── debug.xcconfig
├── assets/
│   └── store/              ← App Store 素材（見 §5）
└── node_modules/
```

### Git
- Repo: `https://github.com/hinetgood/blocktopia.git` (Private)
- Branch: `master`
- 最新 commit: `60398ba` — feat: 遊戲體驗四項優化
- GitHub Pages (Web 版): `https://hinetgood.github.io/blocktopia/`

---

## 2. 技術棧

| 項目 | 值 |
|------|-----|
| 遊戲引擎 | 純 HTML5 Canvas，零框架 |
| 原生包裝 | Capacitor 8.1.0 |
| 廣告 SDK | @capacitor-community/admob 8.0.0 |
| App ID (Bundle ID) | `com.blocktopia.app` |
| App 名稱 | `Blocktopia` |
| 最低 iOS 版本 | Capacitor 8 預設（iOS 14+） |

### 關鍵依賴
```json
{
  "@capacitor-community/admob": "^8.0.0",
  "@capacitor/android": "^8.1.0",
  "@capacitor/cli": "^8.1.0",
  "@capacitor/core": "^8.1.0",
  "@capacitor/ios": "^8.1.0"
}
```

---

## 3. Build 流程

### 3A. 同步 Web → iOS
```bash
cd D:\0.技師案子-本地作業\APP\blocktopia

# 1. 複製最新 index.html 到 dist/
npm run build

# 2. 同步到 iOS 專案
npx cap sync ios

# 3. 打開 Xcode
npx cap open ios
```

### 3B. Xcode 設定
在 Xcode 中需要設定：

1. **Signing & Capabilities**
   - Team: 用戶的 Apple Developer 帳號
   - Bundle Identifier: `com.blocktopia.app`
   - 啟用 Automatically manage signing

2. **General**
   - Display Name: `Blocktopia`
   - Version: `1.0.0`
   - Build: `1`
   - Deployment Target: `14.0`+
   - Device Orientation: Portrait only（遊戲是直式）
   - Status Bar Style: Light Content

3. **Info.plist 補充項目**
   - `NSAppTransportSecurity` → Allow Arbitrary Loads: YES（Firebase + LINE SDK 需要）
   - 廣告追蹤：`NSUserTrackingUsageDescription` = "此應用使用廣告追蹤以提供個人化廣告體驗"

4. **App Icons**
   - 來源圖片：`assets/store/app_icon.png`（AI 生成的可愛方塊吉祥物）
   - 需要生成完整的 AppIcon asset catalog（1024x1024 起）

### 3C. Archive & Upload
```
Xcode → Product → Archive → Distribute App → App Store Connect
```

---

## 4. 廣告設定（AdMob）

目前程式碼中使用 **Google 測試 ID**，上架前需替換。

### 位置：`index.html` 第 40-50 行
```javascript
const AD_CONFIG = {
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917', // ← 測試 ID
    ios:     'ca-app-pub-3940256099942544/1712485313', // ← 測試 ID
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712', // ← 測試 ID
    ios:     'ca-app-pub-3940256099942544/4411468910', // ← 測試 ID
  }
};
```

### 廣告類型
| 類型 | 觸發時機 | 說明 |
|------|----------|------|
| Rewarded Video | 玩家主動點「看廣告」按鈕 | 獲得 +1 愛心（體力） |
| Interstitial | 每 3 次 Game Over | 全螢幕廣告，自動顯示 |

### 上架時
1. 到 [admob.google.com](https://admob.google.com) 建立 iOS App
2. 建立 2 個 Ad Unit（Rewarded + Interstitial）
3. 替換上方 `ios` 欄位的 ID
4. 在 `ios/App/App/Info.plist` 加入 `GADApplicationIdentifier`（AdMob App ID）

---

## 5. App Store 素材

所有素材在 `assets/store/` 目錄：

| 檔案 | 用途 | 尺寸/比例 |
|------|------|-----------|
| `app_icon.png` | App 圖示 | 1:1（需裁切/縮放為 1024x1024） |
| `feature_graphic.png` | 宣傳橫幅（Google Play 用，App Store 可選） | 16:9 |
| `screenshot_1_gameplay.png` | 截圖 1：遊戲畫面 | 9:16 |
| `screenshot_2_menu.png` | 截圖 2：主選單 | 9:16 |
| `screenshot_3_leaderboard.png` | 截圖 3：排行榜 | 9:16 |
| `screenshot_4_effects.png` | 截圖 4：特效展示 | 9:16 |

### App Store 截圖要求
- iPhone 6.7" (1290×2796) — 必要
- iPhone 6.5" (1242×2688) — 必要
- iPad 12.9" (2048×2732) — 如果支援 iPad
- **目前的截圖是 AI 生成的概念圖，可能需要用實機截圖替換或調整尺寸**

---

## 6. 第三方服務（已整合）

### LINE LIFF（登入）
- LIFF ID: `2009316265-Q37iKwg6`（`index.html:127`）
- 用途：LINE 帳號登入 → 取得暱稱 + 頭像 → 排行榜顯示
- CDN: `https://static.line-scdn.net/liff/edge/2/sdk.js`

### Firebase Firestore（排行榜）
- Project: `blocktopia-32874`（`index.html:128-135`）
- 用途：全球排行榜讀寫
- CDN: Firebase 10.12.0 compat

### 注意
- 這些服務在 Web 和原生 App 中都會運作（透過 WebView）
- LINE LIFF 在 iOS WebView 中有限制 — `liff.login()` 會用 `window.location.href` 跳轉而非 popup（已在程式碼中處理，見 `index.html:155-180`）

---

## 7. 遊戲核心功能清單

| 功能 | 狀態 |
|------|------|
| 無盡模式 | ✅ |
| 關卡模式（20 關 × 4 世界） | ✅ |
| 障礙物（石頭/冰塊/鎖定格） | ✅ |
| 特殊方塊（炸彈/彩虹/閃電） | ✅ |
| 愛心體力系統（5 顆/30 分鐘恢復） | ✅ |
| Rewarded Video 廣告 | ✅（測試 ID） |
| Interstitial 廣告 | ✅（測試 ID） |
| LINE 登入 | ✅ |
| Firebase 排行榜 | ✅ |
| 任務系統 | ✅ |
| 教學引導 | ✅ |
| BGM + 9 種音效 | ✅ |
| 畫面轉場 | ✅ |
| 拖曳預覽 | ✅ |

---

## 8. App Store Connect 上架資訊（建議）

```
App 名稱：Blocktopia
副標題：Block Puzzle Challenge
分類：Games > Puzzle
年齡分級：4+（無暴力/無不當內容）
價格：免費

關鍵字（100 字以內）：
block,puzzle,tetris,brain,casual,match,grid,strategy,cube,relax

描述：
Blocktopia 是一款令人著迷的方塊消除益智遊戲！

將彩色方塊拖放到棋盤上，填滿整行或整列即可消除得分。
收集炸彈、彩虹、閃電等特殊方塊，創造華麗的連鎖消除！

特色：
- 20 個精心設計的關卡，4 個獨特世界
- 無盡模式，挑戰你的極限
- 華麗的寶石方塊視覺效果
- 全球排行榜，與好友一較高下
- 簡單易學，深度策略

隱私政策 URL：（需要提供）
支援 URL：https://github.com/hinetgood/blocktopia
```

---

## 9. 已知限制 & 注意事項

1. **隱私政策**：App Store 要求提供隱私政策 URL。需要建立一個簡單的隱私政策頁面（可用 GitHub Pages）
2. **App 審核注意**：
   - 廣告必須有明確的關閉方式（Rewarded Video 是用戶主動觀看，OK）
   - LINE 登入如果審核員沒有 LINE 帳號，需要在審核備註說明是可選功能
3. **iPad 適配**：目前遊戲以手機直式設計為主，iPad 上會以手機比例顯示，建議限制為 iPhone Only 或確認 iPad 顯示正常
4. **iOS 模擬器測試**：AdMob 在模擬器上可能不會載入，這是正常的
5. **dist/ 在 .gitignore 裡**：build 前需要先 `npm run build` 生成 dist/

---

## 10. Checklist

- [ ] Apple Developer 帳號已登入 Xcode
- [ ] `npm run build` 生成 dist/
- [ ] `npx cap sync ios` 同步最新程式碼
- [ ] Xcode 設定 Signing Team + Bundle ID
- [ ] App Icon asset catalog 生成完整尺寸
- [ ] 實機測試（iPhone）確認遊戲正常運行
- [ ] 截圖符合 App Store 尺寸要求（6.7" + 6.5"）
- [ ] 建立隱私政策頁面
- [ ] AdMob iOS Ad Unit ID 替換（可先用測試 ID 上架審核）
- [ ] Info.plist 加入必要權限描述
- [ ] Archive → Upload to App Store Connect
- [ ] 填寫 App Store Connect 上架資訊
- [ ] 提交審核
