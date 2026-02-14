const revealNodes = Array.from(document.querySelectorAll(".reveal"));
const statNodes = Array.from(document.querySelectorAll("[data-count]"));
const heroCard = document.getElementById("heroCard");
const yearNode = document.getElementById("year");
const downloadStatusNode = document.getElementById("downloadStatus");
const checksumNode = document.getElementById("checksumText");
const topDownloadBtn = document.getElementById("downloadBtn");
const bottomDownloadBtn = document.getElementById("downloadBtnBottom");
const exeSizeNode = document.getElementById("exeSize");
const cursorGlow = document.getElementById("cursorGlow");
const headerNode = document.getElementById("siteHeader");
const toTopBtn = document.getElementById("toTopBtn");
const scrollLine = document.getElementById("scrollLine");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const featureChips = Array.from(document.querySelectorAll(".chip[data-filter]"));
const featureCards = Array.from(document.querySelectorAll(".feature[data-tags]"));
const demoTabs = Array.from(document.querySelectorAll(".demo-tab[data-demo]"));
const demoScreens = Array.from(document.querySelectorAll(".demo-screen[data-demo-screen]"));
const randomTipBtn = document.getElementById("randomTipBtn");
const tipOutput = document.getElementById("tipOutput");
const faqSearchInput = document.getElementById("faqSearchInput");
const faqItems = Array.from(document.querySelectorAll("#faqList details"));
const DOWNLOAD_CANDIDATES = [
  "./downloads/WONDELauncher.exe",
  "../dist/WONDELauncher.exe",
  "../dist/WONDELauncher-portable.zip",
  "./downloads/WONDELauncher-portable.zip",
  "../dist/WONDELauncher/WONDELauncher.exe",
  "/dist/WONDELauncher/WONDELauncher.exe",
];

const SITE_THEME_KEY = "wl-site-theme";
const tips = [
  "Совет: для старых сборок используй Java 8, для 1.18+ обычно нужен Java 17.",
  "Совет: если моды не стартуют, сначала запусти профиль без них и проверь логи.",
  "Совет: Smart Repair с интернетом восстановит missing libraries автоматически.",
  "Совет: делай отдельный профиль под каждый крупный модпак для чистоты файлов.",
  "Совет: после ручного импорта модов нажми Refresh перед запуском.",
];

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

function setTheme(theme) {
  const resolved = theme === "night" ? "night" : "sky";
  document.documentElement.setAttribute("data-theme", resolved);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = resolved === "night" ? "Тема: Night" : "Тема: Sky";
  }
  try {
    localStorage.setItem(SITE_THEME_KEY, resolved);
  } catch (_) {}
}

function initTheme() {
  let saved = "sky";
  try {
    saved = localStorage.getItem(SITE_THEME_KEY) || "sky";
  } catch (_) {}
  setTheme(saved);
}

initTheme();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "sky";
    setTheme(current === "night" ? "sky" : "night");
  });
}

const revealObserver = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.16 }
);

for (const node of revealNodes) {
  revealObserver.observe(node);
}

let statAnimated = false;
function animateStats() {
  if (statAnimated) return;
  statAnimated = true;
  const durationMs = 1400;
  const start = performance.now();
  function frame(now) {
    const ratio = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - ratio, 3);
    for (const node of statNodes) {
      const target = Number(node.dataset.count || 0);
      node.textContent = String(Math.round(target * eased));
    }
    if (ratio < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const heroObserver = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        animateStats();
        heroObserver.disconnect();
      }
    }
  },
  { threshold: 0.35 }
);

const heroSection = document.querySelector(".hero");
if (heroSection) {
  heroObserver.observe(heroSection);
}

if (heroCard) {
  heroCard.addEventListener("mousemove", event => {
    const rect = heroCard.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 8;
    const rotateX = (0.5 - py) * 8;
    heroCard.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  heroCard.addEventListener("mouseleave", () => {
    heroCard.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  });
}

function setDownloadState({ ok, text, sizeLabel = "", checksumText = "", disableButtons = false }) {
  if (downloadStatusNode) downloadStatusNode.textContent = text;
  if (exeSizeNode && sizeLabel) exeSizeNode.textContent = sizeLabel;
  if (checksumNode && checksumText) checksumNode.textContent = checksumText;
  const ariaDisabled = disableButtons && !ok ? "true" : "false";
  [topDownloadBtn, bottomDownloadBtn].forEach(btn => {
    if (!btn) return;
    btn.setAttribute("aria-disabled", ariaDisabled);
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function fileLabelFromPath(path) {
  const normalized = String(path || "").replace(/\\/g, "/");
  const name = normalized.split("/").filter(Boolean).pop() || "download";
  return name;
}

async function probeDownload() {
  const preferred = DOWNLOAD_CANDIDATES[0];
  if (topDownloadBtn) topDownloadBtn.setAttribute("href", preferred);
  if (bottomDownloadBtn) bottomDownloadBtn.setAttribute("href", preferred);

  if (location.protocol === "file:") {
    const label = fileLabelFromPath(preferred);
    setDownloadState({
      ok: true,
      text: "Локальный режим: кнопка скачивания активна.",
      sizeLabel: label,
      checksumText: `Прямая загрузка: ${preferred}`,
    });
    return;
  }

  async function probePath(path) {
    try {
      const head = await fetch(path, { method: "HEAD", cache: "no-store" });
      if (head.ok) {
        const lenRaw = head.headers.get("content-length");
        const size = lenRaw ? Number(lenRaw) : NaN;
        return { ok: true, size };
      }
      if (head.status === 405 || head.status === 501) {
        const getResp = await fetch(path, { method: "GET", cache: "no-store" });
        if (getResp.ok) {
          return { ok: true, size: NaN };
        }
      }
      return { ok: false };
    } catch (_) {
      return { ok: false };
    }
  }

  for (const candidate of DOWNLOAD_CANDIDATES) {
    const result = await probePath(candidate);
    if (!result.ok) continue;
    if (topDownloadBtn) topDownloadBtn.setAttribute("href", candidate);
    if (bottomDownloadBtn) bottomDownloadBtn.setAttribute("href", candidate);
    const readableSize = formatBytes(result.size);
    const label = fileLabelFromPath(candidate);
    setDownloadState({
      ok: true,
      text: readableSize ? `Файл готов к загрузке (${readableSize}).` : "Файл готов к загрузке.",
      sizeLabel: readableSize ? `${label} (${readableSize})` : label,
      checksumText: `Прямая загрузка: ${candidate}`,
    });
    return;
  }

  setDownloadState({
    ok: false,
    text: "Автопроверка не смогла подтвердить файл, но кнопку можно нажать для прямой загрузки.",
    checksumText: `Пробовались пути: ${DOWNLOAD_CANDIDATES.join(" | ")}`,
    disableButtons: false,
  });
}

probeDownload();

function applyFeatureFilter(filter) {
  const resolved = String(filter || "all");
  featureChips.forEach(chip => {
    chip.classList.toggle("is-active", chip.dataset.filter === resolved);
  });
  featureCards.forEach(card => {
    const tags = String(card.dataset.tags || "")
      .split(/\s+/)
      .filter(Boolean);
    const visible = resolved === "all" || tags.includes(resolved);
    card.classList.toggle("is-hidden", !visible);
  });
}

featureChips.forEach(chip => {
  chip.addEventListener("click", () => {
    applyFeatureFilter(chip.dataset.filter || "all");
  });
});

applyFeatureFilter("all");

function setDemoTab(target) {
  const key = String(target || "repair");
  demoTabs.forEach(tab => {
    tab.classList.toggle("is-active", tab.dataset.demo === key);
  });
  demoScreens.forEach(screen => {
    screen.classList.toggle("is-active", screen.dataset.demoScreen === key);
  });
}

demoTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    setDemoTab(tab.dataset.demo || "repair");
  });
});

setDemoTab("repair");

if (randomTipBtn && tipOutput) {
  randomTipBtn.addEventListener("click", () => {
    const tip = tips[Math.floor(Math.random() * tips.length)] || tips[0];
    tipOutput.textContent = tip;
  });
}

if (faqSearchInput) {
  faqSearchInput.addEventListener("input", () => {
    const query = String(faqSearchInput.value || "").trim().toLowerCase();
    faqItems.forEach(item => {
      const text = item.textContent ? item.textContent.toLowerCase() : "";
      const visible = !query || text.includes(query);
      item.classList.toggle("is-hidden", !visible);
      if (visible && query) item.open = true;
      if (!query) item.open = false;
    });
  });
}

function updateScrollUi() {
  const y = window.scrollY || 0;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = h > 0 ? Math.min(Math.max(y / h, 0), 1) : 0;
  if (scrollLine) {
    scrollLine.style.width = `${ratio * 100}%`;
  }
  if (headerNode) {
    headerNode.classList.toggle("scrolled", y > 8);
  }
  if (toTopBtn) {
    toTopBtn.classList.toggle("is-visible", y > 420);
  }
}

window.addEventListener("scroll", updateScrollUi, { passive: true });
updateScrollUi();

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (cursorGlow) {
  window.addEventListener("pointermove", event => {
    document.body.classList.add("has-pointer");
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });
}
