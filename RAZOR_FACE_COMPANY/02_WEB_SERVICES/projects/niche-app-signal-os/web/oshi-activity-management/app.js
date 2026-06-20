const STORAGE_KEY = "niche-app-signal-os:oshi-activity-management:v2";
const LEGACY_STORAGE_KEY = "niche-app-signal-os:oshi-activity-management:v1";

const sampleData = {
  lives: [
    {
      id: makeId(),
      event_name: "Spring Orbit Tour",
      artist_or_group: "RAYLIGHT",
      date: "2026-07-18",
      venue: "横浜アリーナ",
      seat: "センター B4 12番",
      ticket_status: "当選",
      companion: "友人A",
      emotion_tag: "余韻",
      setlist_note: "アンコールで新曲。MCは遠征組への話が長め。",
      cost: 12800,
      memo: "終演後にグッズ受け取り。銀テは保管ケースへ。",
    },
    {
      id: makeId(),
      event_name: "Summer Fan Meeting",
      artist_or_group: "RAYLIGHT",
      date: "2026-08-03",
      venue: "大阪城ホール",
      seat: "スタンド H 3列",
      ticket_status: "入金済み",
      companion: "未定",
      emotion_tag: "楽しみ",
      setlist_note: "アコースティック曲が良かった。",
      cost: 9800,
      memo: "ホテルと新幹線を同じ週に確認する。",
    },
  ],
  goods: [
    {
      id: makeId(),
      name: "ツアーTシャツ 2026",
      category: "アパレル",
      price: 4200,
      purchase_date: "2026-07-18",
      owned_count: 1,
      memo: "黒。未開封で保管。",
    },
    {
      id: makeId(),
      name: "ランダム缶バッジ",
      category: "ランダム",
      price: 600,
      purchase_date: "2026-07-18",
      owned_count: 6,
      memo: "交換候補をメモに残す。",
    },
  ],
  travels: [
    {
      id: makeId(),
      event_name: "Summer Fan Meeting",
      transport: 28600,
      hotel: 14800,
      food: 4200,
      goods: 8000,
      other: 1200,
      total: 56800,
    },
  ],
  memos: [
    {
      id: makeId(),
      title: "次の現場で忘れないこと",
      date: "2026-07-19",
      body: "入場前にモバイルバッテリー確認。交換用のOPP袋を多めに持つ。",
    },
  ],
};

let state = loadState();
let currentView = "dashboard";
let selected = {
  live: state.lives[0]?.id || "",
  goods: state.goods[0]?.id || "",
  travel: state.travels[0]?.id || "",
  memo: state.memos[0]?.id || "",
};

const views = {
  dashboard: document.querySelector("#dashboardView"),
  live: document.querySelector("#liveView"),
  goods: document.querySelector("#goodsView"),
  travel: document.querySelector("#travelView"),
  memo: document.querySelector("#memoView"),
};

const lists = {
  live: document.querySelector("#liveList"),
  goods: document.querySelector("#goodsList"),
  travel: document.querySelector("#travelList"),
  memo: document.querySelector("#memoList"),
};

const forms = {
  live: document.querySelector("#liveForm"),
  goods: document.querySelector("#goodsForm"),
  travel: document.querySelector("#travelForm"),
  memo: document.querySelector("#memoForm"),
};

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeState(value) {
  const base = value && typeof value === "object" ? value : clone(sampleData);
  return {
    lives: Array.isArray(base.lives) ? base.lives.map(normalizeLive) : [],
    goods: Array.isArray(base.goods) ? base.goods.map(normalizeGoods) : [],
    travels: Array.isArray(base.travels) ? base.travels.map(normalizeTravel) : [],
    memos: Array.isArray(base.memos) ? base.memos.map(normalizeMemo) : [],
  };
}

function normalizeLive(item) {
  return {
    id: item.id || makeId(),
    event_name: item.event_name || "",
    artist_or_group: item.artist_or_group || "",
    date: item.date || "",
    venue: item.venue || "",
    seat: item.seat || "",
    ticket_status: item.ticket_status || "未設定",
    companion: item.companion || item.companionName || "",
    emotion_tag: item.emotion_tag || "",
    setlist_note: item.setlist_note || "",
    cost: num(item.cost),
    memo: item.memo || "",
  };
}

function normalizeGoods(item) {
  return {
    id: item.id || makeId(),
    name: item.name || "",
    category: item.category || "",
    price: num(item.price),
    purchase_date: item.purchase_date || "",
    owned_count: num(item.owned_count || 1),
    memo: item.memo || "",
  };
}

function normalizeTravel(item) {
  const travel = {
    id: item.id || makeId(),
    event_name: item.event_name || "",
    transport: num(item.transport),
    hotel: num(item.hotel),
    food: num(item.food),
    goods: num(item.goods),
    other: num(item.other),
    total: num(item.total),
  };
  travel.total = travel.total || travelTotal(travel);
  return travel;
}

function normalizeMemo(item) {
  return {
    id: item.id || makeId(),
    title: item.title || "",
    date: item.date || "",
    body: item.body || "",
  };
}

function loadState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (current) return normalizeState(current);

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (legacy) return normalizeState(legacy);
  } catch {
    setTimeout(() => setStatus("保存データを読み込めなかったため、サンプルを表示しています。"), 0);
  }
  return normalizeState(sampleData);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
}

function yen(value) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function html(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function collectionName(type) {
  return { live: "lives", goods: "goods", travel: "travels", memo: "memos" }[type];
}

function collection(type) {
  return state[collectionName(type)];
}

function selectedRecord(type) {
  return collection(type).find((item) => item.id === selected[type]) || null;
}

function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === viewName);
  });
  Object.entries(views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
  render();
}

function render() {
  renderDashboard();
  renderCollection("live");
  renderCollection("goods");
  renderCollection("travel");
  renderCollection("memo");
}

function renderDashboard() {
  const totalGoods = state.goods.reduce((sum, item) => sum + num(item.price) * num(item.owned_count || 1), 0);
  const totalTravel = state.travels.reduce((sum, item) => sum + num(item.total), 0);
  const nextLive = state.lives
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  document.querySelector("#metricLives").textContent = String(state.lives.length);
  document.querySelector("#metricGoods").textContent = yen(totalGoods);
  document.querySelector("#metricTravel").textContent = yen(totalTravel);
  document.querySelector("#metricNext").textContent = nextLive ? `${nextLive.date} ${nextLive.event_name}` : "未登録";

  document.querySelector("#recentLiveList").innerHTML = compactRows(
    state.lives.slice(0, 4),
    "ライブ参戦ログはまだありません。",
    (item) => `${html(item.date || "日付未定")} / ${html(item.event_name)}<small>${html(item.ticket_status)} / ${html(item.venue || "会場未定")}</small>`
  );
  document.querySelector("#recentMemoList").innerHTML = compactRows(
    state.memos.slice(0, 4),
    "メモはまだありません。",
    (item) => `${html(item.date || "日付未定")} / ${html(item.title)}<small>${html(item.body || "").slice(0, 48)}</small>`
  );
}

function compactRows(rows, emptyText, renderer) {
  if (!rows.length) return `<div class="empty-state">${emptyText}</div>`;
  return rows.map((item) => `<div class="compact-row">${renderer(item)}</div>`).join("");
}

function renderCollection(type) {
  const rows = collection(type);
  lists[type].innerHTML = rows.length ? rows.map((item) => listButton(type, item)).join("") : emptyState(type);
  const record = selectedRecord(type);
  fillForm(type, record);
}

function listButton(type, item) {
  const isCurrent = item.id === selected[type];
  const title = {
    live: item.event_name,
    goods: item.name,
    travel: item.event_name,
    memo: item.title,
  }[type];
  const meta = {
    live: `${item.date || "日付未定"} / ${item.ticket_status || "未設定"} / ${item.emotion_tag || "タグなし"} / ${yen(item.cost)}`,
    goods: `${item.category || "カテゴリ未設定"} / ${yen(num(item.price) * num(item.owned_count || 1))} / ${item.owned_count || 0}点`,
    travel: `${yen(item.total)} / 交通 ${yen(item.transport)} / 宿 ${yen(item.hotel)}`,
    memo: `${item.date || "日付未定"} / ${(item.body || "").slice(0, 34)}`,
  }[type];

  return `
    <button class="record-item" type="button" data-type="${type}" data-id="${item.id}" aria-current="${isCurrent}">
      <span class="record-title">${html(title || "無題")}</span>
      <span class="record-meta">${html(meta)}</span>
    </button>
  `;
}

function emptyState(type) {
  const labels = {
    live: "ライブ参戦ログ",
    goods: "グッズ",
    travel: "遠征費",
    memo: "メモ",
  };
  return `
    <div class="empty-state">
      <strong>${labels[type]}はまだありません。</strong>
      <span>追加ボタンから最初の記録を作成できます。</span>
    </div>
  `;
}

function fillForm(type, record) {
  const form = forms[type];
  form.reset();
  form.querySelector("[data-delete]").disabled = !record;
  if (!record) {
    form.elements.id.value = "";
    return;
  }
  Object.entries(record).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value ?? "";
  });
  if (type === "travel") updateTravelTotal();
}

function addRecord(type) {
  const defaults = {
    live: {
      event_name: "新しいライブ",
      artist_or_group: "",
      date: "",
      venue: "",
      seat: "",
      ticket_status: "未設定",
      companion: "",
      emotion_tag: "",
      setlist_note: "",
      cost: 0,
      memo: "",
    },
    goods: { name: "新しいグッズ", category: "", price: 0, purchase_date: "", owned_count: 1, memo: "" },
    travel: { event_name: "新しい遠征", transport: 0, hotel: 0, food: 0, goods: 0, other: 0, total: 0 },
    memo: { title: "新しいメモ", date: "", body: "" },
  };
  const item = { id: makeId(), ...defaults[type] };
  collection(type).unshift(item);
  selected[type] = item.id;
  saveState();
  switchView(type);
  forms[type].querySelector("input:not([type='hidden'])")?.focus();
  setStatus("新しい記録を追加しました。");
}

function saveForm(type) {
  const form = forms[type];
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.id) return;

  const record = selectedRecord(type);
  if (!record) return;

  if (type === "live") data.cost = num(data.cost);
  if (type === "goods") {
    data.price = num(data.price);
    data.owned_count = num(data.owned_count);
  }
  if (type === "travel") {
    ["transport", "hotel", "food", "goods", "other"].forEach((key) => {
      data[key] = num(data[key]);
    });
    data.total = travelTotal(data);
  }

  Object.assign(record, data);
  saveState();
  render();
  setStatus("保存しました。");
}

function deleteRecord(type) {
  const id = selected[type];
  if (!id) return;
  state[collectionName(type)] = collection(type).filter((item) => item.id !== id);
  selected[type] = collection(type)[0]?.id || "";
  saveState();
  render();
  setStatus("削除しました。");
}

function travelTotal(source = Object.fromEntries(new FormData(forms.travel).entries())) {
  return ["transport", "hotel", "food", "goods", "other"].reduce((sum, key) => sum + num(source[key]), 0);
}

function updateTravelTotal() {
  forms.travel.elements.total.value = travelTotal();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "oshi-activity-management.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  const imported = JSON.parse(await file.text());
  if (!imported || !Array.isArray(imported.lives) || !Array.isArray(imported.goods) || !Array.isArray(imported.travels) || !Array.isArray(imported.memos)) {
    throw new Error("対応していないJSON形式です。");
  }
  state = normalizeState(imported);
  selected = {
    live: state.lives[0]?.id || "",
    goods: state.goods[0]?.id || "",
    travel: state.travels[0]?.id || "",
    memo: state.memos[0]?.id || "",
  };
  saveState();
  render();
  setStatus("インポートしました。");
}

function clearData() {
  state = { lives: [], goods: [], travels: [], memos: [] };
  selected = { live: "", goods: "", travel: "", memo: "" };
  saveState();
  render();
  setStatus("すべてのローカルデータを空にしました。");
}

function setStatus(message) {
  const status = document.querySelector("#statusLine");
  status.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    status.textContent = "";
  }, 2200);
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

document.querySelector("#quickLiveButton").addEventListener("click", () => addRecord("live"));
document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => addRecord(button.dataset.add));
});

Object.entries(forms).forEach(([type, form]) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveForm(type);
  });
  form.querySelector("[data-delete]").addEventListener("click", () => deleteRecord(type));
});

Object.values(lists).forEach((list) => {
  list.addEventListener("click", (event) => {
    const button = event.target.closest(".record-item");
    if (!button) return;
    selected[button.dataset.type] = button.dataset.id;
    render();
  });
});

["transport", "hotel", "food", "goods", "other"].forEach((name) => {
  forms.travel.elements[name].addEventListener("input", updateTravelTotal);
});

document.querySelector("#exportButton").addEventListener("click", exportData);
document.querySelector("#importButton").addEventListener("click", () => document.querySelector("#importFile").click());
document.querySelector("#clearButton").addEventListener("click", clearData);
document.querySelector("#importFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    await importData(file);
  } catch (error) {
    setStatus(error.message);
  } finally {
    event.target.value = "";
  }
});

saveState();
render();
