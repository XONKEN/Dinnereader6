今晚回家吃飯嗎？— GitHub Pages + Firebase 版 v9

V9 新增：
1. 群組內任何成員都可以替「其他任何成員」建立通知。
2. 建立通知時可選擇對象、日期／時間、標題與內容；通知上的快速回覆固定顯示「是／否」。
3. 收件人的裝置在 App／網頁仍可運作時，會用 Firestore 即時監聽＋Service Worker 作為前端備援。
4. 加入 Firebase Cloud Messaging（FCM）裝置 Token 註冊與背景推播架構；搭配附帶的 Cloud Function，可在 App 完全關閉時由雲端在時間到達後推播。
5. 強化毛玻璃、背景光暈、模糊進場與動態模糊效果；保留 prefers-reduced-motion 無障礙處理。
6. Service Worker Cache 升級為 v9。

=== 最重要：背景推播 ===
單靠 GitHub Pages + 瀏覽器前端，無法保證 App 被作業系統完全終止後仍能準時執行 JavaScript。
因此 V9 提供「FCM + Firebase Functions」正式背景推播方案。

要讓「我幫媽媽排 20:00 通知」在媽媽 App 完全關閉時仍可靠推播，需完成以下一次性設定：

1. Firebase Console → Authentication → Sign-in method → Anonymous → 啟用。
2. Firebase Console → Firestore Database → 建立資料庫。
3. Firebase Console → Project settings → Your apps → Web → 取得完整 Web App SDK config。
4. Firebase Console → Project settings → Cloud Messaging → Web configuration → Web Push certificates → 建立／取得 VAPID public key。
5. App「設定」→「FCM Web Push 公開金鑰」貼上 VAPID public key。
6. 使用 Firebase CLI 登入並在此專案資料夾部署：
   firebase deploy --only firestore:rules,firestore:indexes,functions
7. FCM Web Push 需要瀏覽器／手機允許通知；Android Chrome／支援 PWA 的瀏覽器請把 App 安裝到主畫面後再允許通知，可靠度通常較高。

Cloud Function 使用 Asia/Taipei 時區，每分鐘檢查到期的 scheduledNotifications，取得收件人裝置 Token 後透過 FCM 發送 data-only push，Service Worker 顯示「是／否」按鈕。

注意：Firebase Functions 的排程通常需要啟用計費方案；實際 Firebase 費用依 Google/Firebase 當期方案與使用量而定。

=== Firestore Rules ===
本 ZIP 已附 firestore.rules 與 firestore.indexes.json。部署上述指令即可套用。

規則重點：
- 群組成員可以建立「自己發送給其他成員」的 scheduledNotifications。
- 收件人可以讀自己的待處理通知；建立者可以讀自己建立的通知。
- 一般成員不能自行把通知標成 sent / processing，也不能修改／刪除已建立通知；狀態更新由 Cloud Function Admin SDK 執行。
- 裝置 Token 只有本人可以寫入／讀取。

=== GitHub Pages ===
解壓後，網站需要把根目錄的檔案放到 Repository 第一層。
GitHub Pages 只負責前端；functions/ 目錄要用 Firebase CLI 部署到 Firebase，不能期待 GitHub Pages 自動執行 Cloud Function。

=== V9 通知流程 ===
建立者 → Firestore scheduledNotifications → Cloud Function 每分鐘掃描 → 找到到期通知 → 讀取 targetUid 的 devices → FCM data push → 收件人 Service Worker 顯示通知 → 點「是／否」→ 開啟／聚焦 App → 寫入原有回覆紀錄。

=== 相容性與限制 ===
- 前景／背景網頁仍提供 Firestore listener 作為備援。
- 若瀏覽器或手機禁止網頁通知、撤銷通知權限、限制背景活動，前端備援無法繞過作業系統限制。
- 完全關閉 App 的可靠背景推播依賴 FCM + Cloud Function，而不是單靠 setInterval。
- 通知的「是／否」會保留原本回覆資料結構，不會破壞既有晚餐紀錄。
