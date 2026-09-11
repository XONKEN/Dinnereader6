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
請把 Firebase Console → Firestore Database → Rules 內原本內容全部替換成下面這份，再按 Publish。

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isMember(groupId) {
      return signedIn() && exists(
        /databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid)
      );
    }

    match /groups/{groupId} {
      // 讓已登入使用者可以用 8 碼代碼查詢群組是否存在、讀取群組名稱。
      allow get: if signedIn();

      // 建立群組只能由已登入使用者建立，且 createdBy 必須是自己的 UID。
      allow create: if signedIn()
                    && request.resource.data.createdBy == request.auth.uid;

      // 群組本身不能被一般成員修改或刪除。
      allow update, delete: if false;

      match /members/{uid} {
        // 群組成員可以看成員清單；尚未加入者只能讀自己的成員文件。
        allow read: if isMember(groupId)
                    || (signedIn() && uid == request.auth.uid);

        // 新加入者只能建立自己的成員文件。
        allow create: if signedIn() && uid == request.auth.uid;

        // 成員只能修改自己的暱稱等資料。
        allow update: if signedIn() && uid == request.auth.uid;

        // 成員只能刪除自己的成員文件，離開群組時使用。
        allow delete: if signedIn() && uid == request.auth.uid;
      }

      match /messages/{messageId} {
        // 只有群組成員可以讀取群組通知紀錄。
        allow read: if isMember(groupId);

        // 只有群組成員可以新增自己的答覆。
        allow create: if isMember(groupId)
                      && request.resource.data.uid == request.auth.uid;

        // 群組通知建立後不允許一般使用者修改或刪除。
        allow update, delete: if false;
      }
    }
  }
}

注意：Firestore 的子集合規則必須另外明確指定，父層 /groups/{groupId} 的規則不會自動套用到 members 或 messages；這也是本版把兩個子集合分開寫的原因。Firebase 官方文件也明確說明階層式資料的子集合需要明確規則。 

=== GitHub Pages ===
解壓縮後，把 ZIP 裡面的 7 個檔案直接放在 Repository 第一層，不要再多一層 home-dinner-reminder-v6 資料夾。

=== 通知限制 ===
Firestore onSnapshot 可提供即時資料同步；本版也會在網頁仍在運作時監聽群組新回覆並呼叫瀏覽器通知。若瀏覽器、App、分頁全部被系統停止，單靠 GitHub Pages + Firestore 前端監聽無法保證仍會彈出通知。若需要「完全關閉 App 後也一定推播」，仍需要 Firebase Cloud Messaging（FCM）與可在雲端執行的推播／排程後端。
