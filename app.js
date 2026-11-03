"use strict";

(() => {
  const form = document.getElementById("repair-form");
  const fields = document.getElementById("form-fields");
  const submitButton = document.getElementById("submit-button");
  const refreshButton = document.getElementById("refresh-button");
  const formMessage = document.getElementById("form-message");
  const listMessage = document.getElementById("list-message");
  const list = document.getElementById("request-list");
  let client;
  let saving = false;
  let loading = false;

  function showMessage(element, text, type = "") {
    element.textContent = text;
    element.className = `message ${type}`.trim();
  }

  function errorMessage(error) {
    return error && typeof error.message === "string" ? error.message : "連線異常，請稍後再試。";
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function renderRequests(requests) {
    const fragment = document.createDocumentFragment();
    for (const request of requests) {
      const item = createTextElement("li", "request-item", "");
      const heading = createTextElement("div", "request-heading", "");
      const urgencyClass = { "低": "low", "中": "medium", "高": "high" }[request.urgency] || "";
      heading.append(
        createTextElement("h3", "", request.location || "地點待確認"),
        createTextElement("span", "badge", request.category || "類別待確認"),
        createTextElement("span", `badge ${urgencyClass}`, `緊急程度：${request.urgency || "待確認"}`)
      );
      const date = request.created_at ? new Date(request.created_at) : null;
      const timestamp = date && !Number.isNaN(date.getTime())
        ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei" }).format(date)
        : "時間待確認";
      item.append(
        heading,
        createTextElement("p", "request-meta", `${request.reporter_name || "報修人待確認"}・${timestamp}（台北時間）`),
        createTextElement("p", "request-description", request.description || "問題說明待確認")
      );
      fragment.append(item);
    }
    list.replaceChildren(fragment);
  }

  async function loadRequests() {
    if (loading || !client) return;
    loading = true;
    refreshButton.disabled = true;
    list.setAttribute("aria-busy", "true");
    showMessage(listMessage, "正在載入報修紀錄…");
    try {
      const { data, error } = await client.from("repair_requests")
        .select("reporter_name, location, category, description, urgency, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      renderRequests(data || []);
      showMessage(listMessage, data?.length ? "" : "目前沒有報修紀錄。");
    } catch (error) {
      showMessage(listMessage, `清單載入失敗：${errorMessage(error)} 若已有紀錄，畫面保留上次載入的內容，請重新整理。`, "error");
    } finally {
      loading = false;
      refreshButton.disabled = false;
      list.setAttribute("aria-busy", "false");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving || !client || !form.reportValidity()) return;
    const payload = Object.fromEntries(
      Array.from(new FormData(form), ([key, value]) => [key, String(value).trim()])
    );
    if (Object.values(payload).some((value) => !value)) {
      showMessage(formMessage, "請完整填寫所有欄位，內容不可只有空白。", "error");
      return;
    }
    saving = true;
    fields.disabled = true;
    submitButton.textContent = "送出中…";
    showMessage(formMessage, "正在送出報修…");
    try {
      const { error } = await client.from("repair_requests").insert(payload);
      if (error) throw error;
      form.reset();
      showMessage(formMessage, "報修登記成功！", "success");
      // 等待既有查詢結束後再讀取，避免顯示送出前的舊清單。
      if (loading) {
        await new Promise((resolve) => {
          const timer = setInterval(() => {
            if (!loading) { clearInterval(timer); resolve(); }
          }, 50);
        });
      }
      await loadRequests();
    } catch (error) {
      showMessage(formMessage, `送出未確認成功：${errorMessage(error)} 表單內容已保留；連線中斷時，請先重新整理清單確認是否已登記，再決定是否重送。`, "error");
    } finally {
      saving = false;
      fields.disabled = false;
      submitButton.textContent = "送出報修";
    }
  });

  refreshButton.addEventListener("click", loadRequests);

  try {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.anonKey || config.url === "YOUR_SUPABASE_URL" || config.anonKey === "YOUR_SUPABASE_ANON_KEY") {
      throw new Error("請先在 config.js 填入 Supabase 專案網址與 anon 金鑰。");
    }
    if (!window.supabase?.createClient) {
      throw new Error("Supabase 程式庫未載入，請檢查網路連線後重新整理頁面。");
    }
    client = window.supabase.createClient(config.url, config.anonKey);
    loadRequests();
  } catch (error) {
    fields.disabled = true;
    refreshButton.disabled = true;
    showMessage(formMessage, errorMessage(error), "error");
    showMessage(listMessage, "尚未連線，無法載入報修紀錄。");
  }
})();
