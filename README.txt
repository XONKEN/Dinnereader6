今晚回家吃飯嗎？— GitHub Pages 版 v4

這一版修正：
1. 底部導覽增加安全區與頁面底部空間，不會再被手機底部手勢列／導覽列擋住。
2. 提醒檢查改為每 5 秒檢查當天提醒時間，並用 Service Worker showNotification + 瀏覽器通知雙路徑；可在 App 開著時準時觸發。
3. 新增「家庭群組」：建立／加入群組、群組代碼、成員、即時吃飯回覆。
4. 純 GitHub Pages，不需要 Node、Vite、Gradle。

重要：GitHub Pages 是靜態網站，本身不能在 App 完全關閉時於手機本機可靠排程通知，也不能讓不同手機直接共享資料。因此「關閉 App 後仍準時通知」與「群組即時同步」需要雲端 Push／資料庫。群組功能本版使用 Firebase 免費方案的 Firestore + Anonymous Auth。

=== Firebase 一次性設定 ===
A. 到 Firebase Console 建立專案。
B. 在 Authentication → Sign-in method 開啟 Anonymous（匿名登入）。
C. 建立 Firestore Database（Production mode）。
D. Project settings → Your apps → Web，新增 Web App，複製 Firebase SDK 設定 JSON。
E. 在本 App → 設定 → 設定群組雲端，把整段 JSON 貼進去。

=== Firestore Rules ===
把 Firestore Rules 設成以下內容後發布：

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function member(groupId) {
      return signedIn() && exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
    }
    match /groups/{groupId} {
      allow read: if signedIn();
      allow create: if signedIn();
      allow update, delete: if signedIn() && resource.data.createdBy == request.auth.uid;
      match /members/{uid} {
        allow read: if member(groupId) || (signedIn() && uid == request.auth.uid);
        allow create: if signedIn() && uid == request.auth.uid;
        allow update, delete: if signedIn() && uid == request.auth.uid;
      }
      match /messages/{messageId} {
        allow read: if member(groupId);
        allow create: if member(groupId) && request.resource.data.uid == request.auth.uid;
        allow update, delete: if member(groupId) && resource.data.uid == request.auth.uid;
      }
    }
  }
}

注意：群組代碼是分享用的邀請碼，不是密碼。不要把敏感資料放進群組訊息。

=== GitHub Pages 上傳 ===
解壓縮後，把 index.html、manifest.webmanifest、sw.js、三個 icon PNG 放在 Repository 第一層。Settings → Pages → Deploy from a branch → main → /(root)。

=== 通知限制 ===
按「允許手機通知」後可用「立即測試通知」確認權限。Android／部分瀏覽器在網頁開啟或 PWA 工作時可以正常觸發本版的時間檢查；但瀏覽器／作業系統可以暫停完全關閉的網頁，所以不能把純 GitHub Pages 當成原生鬧鐘。若要「手機完全關閉 App 也一定在 19:00 收到」，下一版應接 Firebase Cloud Messaging / Web Push，由雲端在時間到時發送。
