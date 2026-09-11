今晚回家吃飯嗎？— GitHub Pages 版 v6

本版重點：
1. 底部新增「群組」專用入口，群組相關功能全部集中在這裡。
2. 修正建立／加入群組流程：按下後會顯示建立中／加入中，並顯示 Firebase 或 Firestore 的具體錯誤原因。
3. 建立群組後直接進入群組首頁，顯示群組名稱、代碼、所有成員與最近 50 則通知紀錄。
4. 其他成員的新吃飯答覆會即時同步；在目前網頁仍可運作且通知權限允許時，會跳出「群組新回覆」通知。
5. 通知上的兩個快速答覆文字可以在「設定 → 通知上的快速答覆」自行修改。修改後，通知按鈕、App 內答覆按鈕與紀錄顯示會同步使用新文字。
6. 群組成員暱稱修改會同步到 Firestore。
7. 保留 PWA、Service Worker 與通知快速回覆。

=== Firebase 設定 ===
Authentication → Sign-in method → Anonymous → 啟用。
Firestore Database → 建立資料庫。
Project settings → Your apps → Web → SDK setup and configuration，完整複製 Web App config。

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
解壓縮後，把 ZIP 裡面的 7 個檔案直接放在 Repository 第一層，不要再多一層 home-dinner-reminder-v6 資料夾。

=== 通知限制 ===
Firestore onSnapshot 可提供即時資料同步；本版也會在網頁仍在運作時監聽群組新回覆並呼叫瀏覽器通知。若瀏覽器、App、分頁全部被系統停止，單靠 GitHub Pages + Firestore 前端監聽無法保證仍會彈出通知。若需要「完全關閉 App 後也一定推播」，仍需要 Firebase Cloud Messaging（FCM）與可在雲端執行的推播／排程後端。
