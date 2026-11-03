# 報修登記系統（示範）

純 HTML、CSS、JavaScript 前端，透過 CDN 載入 Supabase JavaScript v2，將報修資料新增至 `repair_requests`，並顯示依 `created_at` 由新到舊的最近 20 筆紀錄。

## 檔案

- `index.html`：報修表單與紀錄清單。
- `style.css`：桌面與手機版面。
- `app.js`：表單驗證、新增資料、查詢與訊息處理。
- `config.example.js`：Supabase 連線設定範例，僅包含占位字串。
- `config.js`：自行建立的本機 Supabase 連線設定，已加入 `.gitignore`，不提交至 Git。

## 設定連線

首次設定時，先將 `config.example.js` 複製為 `config.js`，再替換其中的 `YOUR_SUPABASE_URL` 與 `YOUR_SUPABASE_ANON_KEY`。若已有填好的 `config.js`，請保留原檔，不要覆蓋。請使用專案的 anon 金鑰；不要使用具有管理權限的金鑰。前端設定會提供給瀏覽器讀取，不能放入私密憑證。

## 資料表前置條件

前端已對齊專案現有的 `supabase/schema.sql`，使用下列欄位。該 SQL 不會由網頁自動執行；遠端是否已建表仍**待確認**。如果遠端既有欄位不同，需同步調整表單的 `name` 與 `app.js` 的查詢、顯示欄位。

| 欄位 | 預期型別 | 用途 |
| --- | --- | --- |
| `reporter_name` | text | 報修人，必填 |
| `location` | text | 地點或部門，必填 |
| `category` | text | 設備／網路／環境／其他，必填 |
| `description` | text | 問題說明，必填 |
| `urgency` | text | 低／中／高，必填 |
| `created_at` | timestamptz | 由資料庫預設 `now()`，用於排序 |

前端不傳送 `id`、`created_at`、`status`，沿用 SQL 的自動編號、建立時間與「待處理」預設值。若遠端資料表還有其他必填欄位，必須提供資料庫預設值或同步調整前端。

本範例沒有登入流程。現有 SQL 包含 anon 的新增與查詢權限及 RLS 政策，但是否已套用遠端仍**待確認**；也需確認資料表已開放 Data API 存取。該 SQL 允許匿名讀取全部報修資料，任何取得專案網址及 anon 金鑰的人都可能讀取姓名、地點與問題說明，請確認符合實際使用範圍。前端只顯示 20 筆，並非資料存取權限限制。

## 本機開啟測試

1. 安裝 Python 3，使用 PowerShell 切換到此專案資料夾。
2. 執行：

   ```powershell
   python -m http.server 8000 --bind 127.0.0.1
   ```

   若 Windows 找不到 `python`，可改用 `py -m http.server 8000 --bind 127.0.0.1`。

3. 在瀏覽器開啟 [報修登記測試頁](http://localhost:8000)。請使用 HTTP 開啟，且保持網路連線，以便載入 CDN 與連接 Supabase。
4. 填妥設定與資料表後，輸入各欄位並送出；應顯示「報修登記成功！」，表單清空，下方清單更新。
5. 點選「重新整理」可再次讀取最近 20 筆；時間顯示使用台北時區。
6. 測試結束後，在 PowerShell 按 `Ctrl+C` 關閉伺服器。

未填入設定時，表單會停用並顯示設定提示；資料新增或清單讀取失敗時會分別顯示錯誤訊息。新增成功但清單讀取失敗時，仍保留成功訊息，請重新整理清單即可。

若連線在送出途中中斷，資料可能已寫入，請先重新整理清單確認再重送，避免重複登記。

## 常見問題

- 無法載入程式庫：確認網路可連至 jsDelivr CDN。
- 找不到資料表或欄位：確認資料表名稱、欄位與 Data API 設定。
- 權限或 RLS 錯誤：檢查 anon 角色的資料表權限與對應 `INSERT`、`SELECT` 政策。
- 清單時間未顯示：確認 `created_at` 有值，且資料庫預設為 `now()`。

本專案只建立前端，未連線到實際 Supabase；資料庫新增與查詢的端到端驗證：**待確認**。

## 官方參考

- [Supabase JavaScript v2 安裝與 CDN](https://supabase.com/docs/reference/javascript/installing)
- [新增資料](https://supabase.com/docs/reference/javascript/insert)
- [資料排序](https://supabase.com/docs/reference/javascript/using-modifiers-order)
- [查詢資料](https://supabase.com/docs/reference/javascript/select)
