-- 報修登記系統：供 Supabase PostgreSQL 首次建表使用，本檔不會自動執行。
-- 若資料表已存在，應先檢視差異再另寫遷移，避免誤認既有結構符合需求。
-- 設計假設：所有欄位皆為必填；是否允許空字串及各文字長度上限待確認。
-- 「匿名者」指未登入時使用的 anon 角色；不包含 Supabase Auth 匿名登入帳號。
BEGIN;

-- 建立報修資料表；編號與建立時間由資料庫預設產生。
-- 分類、急迫程度及狀態採文字欄位，並以 CHECK 限制可接受的值。
CREATE TABLE public.repair_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    reporter_name text NOT NULL,
    location text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    urgency text NOT NULL DEFAULT '中',
    status text NOT NULL DEFAULT '待處理',
    CONSTRAINT repair_requests_category_check
        CHECK (category IN ('設備', '網路', '環境', '其他')),
    CONSTRAINT repair_requests_urgency_check
        CHECK (urgency IN ('低', '中', '高')),
    CONSTRAINT repair_requests_status_check
        CHECK (status IN ('待處理', '處理中', '已完成'))
);

-- 啟用資料列層級安全性；一般角色必須同時取得操作權限並符合政策。
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- 清除新資料表可能繼承的預設授權，再明確授予匿名者所需的最小權限。
-- 不授予 anon 或 authenticated 修改、刪除或清空資料表的權限。
-- 資料表擁有者與具備繞過 RLS 權限的管理角色不受一般匿名政策限制。
REVOKE ALL PRIVILEGES ON TABLE public.repair_requests
    FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.repair_requests TO anon;

-- 匿名者可填寫報修內容及初始狀態，不能指定編號或建立時間。
-- 未提供急迫程度或狀態時，使用資料表預設值。
GRANT INSERT (reporter_name, location, category, description, urgency, status)
    ON TABLE public.repair_requests TO anon;

-- 匿名新增政策：即使自行傳入狀態，也必須是「待處理」。
CREATE POLICY repair_requests_anon_insert
    ON public.repair_requests
    FOR INSERT
    TO anon
    WITH CHECK (status = '待處理');

-- 匿名讀取政策：允許讀取全部報修資料及所有欄位，包含姓名、地點與描述。
-- 此政策會公開整份清單；正式使用前須確認這些內容適合公開。
CREATE POLICY repair_requests_anon_select
    ON public.repair_requests
    FOR SELECT
    TO anon
    USING (true);

-- 不建立 UPDATE 或 DELETE 政策；後續管理員處理流程與授權方式待確認。
-- 本設計未提供防機器人、請求限流、文字長度限制或內容過濾。
COMMIT;
