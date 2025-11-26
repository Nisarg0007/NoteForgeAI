// -------------------- HELPERS: Toast --------------------
const toastContainer = document.getElementById("toast-container");
function showToast(text, timeout = 2600) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = text;
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

// -------------------- TABS --------------------
document.querySelectorAll("#length-tabs .option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#length-tabs .option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
document.querySelectorAll("#format-tabs .option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#format-tabs .option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// -------------------- ELEMENT REFS --------------------
const pdfInput = document.getElementById("pdf-file");
const uploadTrigger = document.getElementById("upload-trigger");
const fileNameLabel = document.getElementById("file-name");
const pdfPreview = document.getElementById("pdf-preview");
const pdfName = document.getElementById("pdf-name");
const pdfBar = document.getElementById("pdf-progress-bar");

const summarizeBtn = document.getElementById("summarize-btn");
const loaderOverlay = document.getElementById("loader-overlay");
const outputArea = document.getElementById("output-area");
const downloadBtn = document.getElementById("download-summary");

const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

const pasteTrigger = document.getElementById("paste-trigger");
const textInput = document.getElementById("text-input");

// -------------------- Textarea autosize (grow with content, limit) --------------------
function autosizeTextarea(el, maxHeight = 420) {
  el.style.height = "auto";
  const newH = Math.min(el.scrollHeight, maxHeight);
  el.style.height = newH + "px";
}
textInput.addEventListener("input", () => autosizeTextarea(textInput));

// Paste trigger focuses textarea
pasteTrigger.addEventListener("click", () => {
  textInput.focus();
  showToast("✏️ Paste your text here");
});

// -------------------- Custom upload trigger --------------------
uploadTrigger.addEventListener("click", () => pdfInput.click());
pdfInput.addEventListener("change", handlePdfUpload);

function handlePdfUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  fileNameLabel.textContent = file.name;
  showToast("📄 PDF uploaded");
  pdfPreview.classList.remove("hidden");
  pdfName.innerText = file.name;

  // Animate progress to 100% smoothly
  animatePDFProgress()
    .then(() => {
      // keep preview visible after complete
      pdfBar.style.width = "100%";
    })
    .catch(() => {
      // fallback: ensure bar full on error
      pdfBar.style.width = "100%";
    });

  // Clear text area to avoid confusion
  textInput.value = "";
  autosizeTextarea(textInput);
}

// Smooth guaranteed PDF progress animation (returns Promise resolved at 100%)
function animatePDFProgress() {
  return new Promise((resolve) => {
    let p = 0;
    pdfBar.style.width = "0%";
    const id = setInterval(() => {
      // random but controlled increments
      p += 6 + Math.random() * 12;
      if (p >= 100) {
        p = 100;
        pdfBar.style.width = "100%";
        clearInterval(id);
        // small delay so user sees completion
        setTimeout(resolve, 300);
        return;
      }
      pdfBar.style.width = Math.floor(p) + "%";
    }, 140);
  });
}

// -------------------- Summarization progress (connects to API) --------------------
let progressInterval = null;
function setProgress(val, txt) {
  progressBar.style.width = `${val}%`;
  progressText.innerText = txt || `${val}%`;
}

function startProgress() {
  setProgress(8, "Connecting...");
  let p = 8;
  progressInterval = setInterval(() => {
    p += Math.random() * 7;
    if (p > 88) p = 88;
    setProgress(Math.floor(p), "Summarizing...");
  }, 450);
}

function stopProgress() {
  clearInterval(progressInterval);
  setProgress(100, "Finalizing...");
  setTimeout(() => setProgress(0, "Idle"), 700);
}

// -------------------- AJAX Summarize --------------------
summarizeBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  const pdfFile = pdfInput.files[0];

  if (!text && !pdfFile) {
    showToast("⚠️ Paste text or upload a PDF first");
    return;
  }

  const length = document.querySelector("#length-tabs .option.active").dataset.value;
  const format = document.querySelector("#format-tabs .option.active").dataset.value;

  const fd = new FormData();
  fd.append("summary_type", length);
  if (text) fd.append("user_text", text);
  if (pdfFile) fd.append("pdf_file", pdfFile);

  loaderOverlay.classList.remove("hidden");
  startProgress();
  showToast("⚡ Generating summary...");

  try {
    const resp = await fetch("/api/summarize", { method: "POST", body: fd });
    const data = await resp.json();
    loaderOverlay.classList.add("hidden");
    stopProgress();

    if (!resp.ok) {
      showToast("❌ " + (data.error || "Server error"));
      return;
    }

    outputArea.classList.remove("empty");
    outputArea.innerHTML = `<div class="rendered-summary">${marked.parse(data.summary)}</div>`;

    downloadBtn.disabled = false;
    downloadBtn.onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "pt",
    format: "a4"
  });

  const text = outputArea.innerText.trim();
  const margin = 40;
  const maxWidth = 520;

  const lines = doc.splitTextToSize(text, maxWidth);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.text(lines, margin, margin);

  doc.save("NoteForge_Summary.pdf");
};


    // ensure pdf progress shows 100% if PDF used
    if (pdfFile) pdfBar.style.width = "100%";

    showToast("✅ Summary ready");
  } catch (err) {
    loaderOverlay.classList.add("hidden");
    stopProgress();
    showToast("❌ Error: " + err.message, 4500);
  }
});
