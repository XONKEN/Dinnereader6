今晚回家吃飯嗎？— GitHub Pages 版 v5

本版重點：
1. 修正手機底部導覽遮住最後內容：頁面內容與安全區預留更大空間。
2. Firebase 設定改為「完整 Web App SDK 設定」解析，不再要求你單獨輸入 API Key，也支援貼上 const firebaseConfig = {...}。
3. 通知加入快速回覆按鈕：🏠 回家吃飯、🚫 今天不回家。支援的瀏覽器會直接在通知上顯示按鈕；點一下即可回覆。若頁面當下沒有開啟，瀏覽器會自動開啟 App 並完成回覆，不需要再手動找按鈕。
4. 家庭群組使用 Firebase Authentication Anonymous + Cloud Firestore 即時同步。
5. UI 與設定區重新整理，保留純靜態 GitHub Pages，無 Node / Vite / Gradle。

=== Firebase 設定 ===
1. Firebase Console 建立專案。
2. Authentication → Sign-in method → Anonymous → 啟用。
3. Firestore Database → 建立資料庫。
4. Project settings → Your apps → Web → 建立/選擇 Web App。
5. 找到 SDK setup and configuration / Config，完整複製：
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
6. App → 設定 → 家庭群組雲端 → 貼上 Firebase 設定。

注意：不要只貼 apiKey 的一串文字。要貼整個 Web App config。新版 App 可以辨識 JSON 或 const firebaseConfig = {...}。

=== Firestore Rules ===
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function member(groupId) {
      return signedIn() && exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid));
    }

    match /groups/{groupId} {
      allow get: if signedIn();
      allow create: if signedIn() && request.resource.data.createdBy == request.auth.uid;
      allow update, delete: if false;

      match /members/{uid} {
        allow read: if member(groupId) || (signedIn() && uid == request.auth.uid);
        allow create: if signedIn() && uid == request.auth.uid;
        allow update: if signedIn() && uid == request.auth.uid;
        allow delete: if signedIn() && uid == request.auth.uid;
      }

      match /messages/{messageId} {
        allow read: if member(groupId);
        allow create: if member(groupId) && request.resource.data.uid == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}

=== GitHub Pages ===
解壓縮後，把以下檔案放在 Repository 第一層：
index.html
sw.js
manifest.webmanifest
icon-180.png
icon-192.png
icon-512.png
README.txt

Settings → Pages → Deploy from a branch → main → /(root)。

=== 通知限制 ===
「通知上的快速回覆按鈕」由 Web Notification / Service Worker 提供，實際是否顯示 action 按鈕由手機瀏覽器與作業系統決定。Android Chrome / PWA 通常可以支援；部分瀏覽器可能只顯示通知本身。

純 GitHub Pages 沒有雲端排程能力，所以如果網頁完全被系統停止，不能保證它在 19:00 自己產生通知。要做到「App 完全關閉也能準時推播」，還需要 Firebase Cloud Messaging + 雲端排程服務。這與本版的「通知出現後一鍵回答」是兩件事。
