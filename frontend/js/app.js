/**
 * app.js – Main application controller.
 *
 * Responsibilities:
 *  - Tab navigation (upload / URL / webcam)
 *  - Image ingestion (file drop, URL load, webcam capture)
 *  - Triggering detection via api.js
 *  - Rendering bounding boxes onto a <canvas>
 *  - Populating the results table
 *  - API settings panel
 */

/* ── Element references ─────────────────────────────────────────────────── */

const tabUpload   = document.getElementById('tab-upload');
const tabUrl      = document.getElementById('tab-url');
const tabWebcam   = document.getElementById('tab-webcam');

const panelUpload = document.getElementById('panel-upload');
const panelUrl    = document.getElementById('panel-url');
const panelWebcam = document.getElementById('panel-webcam');

const dropZone    = document.getElementById('drop-zone');
const fileInput   = document.getElementById('file-input');

const urlInput    = document.getElementById('url-input');
const urlLoadBtn  = document.getElementById('url-load-btn');

const webcamVideo      = document.getElementById('webcam-video');
const startWebcamBtn   = document.getElementById('start-webcam-btn');
const captureBtn       = document.getElementById('capture-btn');
const stopWebcamBtn    = document.getElementById('stop-webcam-btn');

const detectBtn        = document.getElementById('detect-btn');
const clearBtn         = document.getElementById('clear-btn');
const processingInd    = document.getElementById('processing-indicator');
const resultCanvas     = document.getElementById('result-canvas');
const canvasPlaceholder = document.getElementById('canvas-placeholder');

const showLabelsToggle     = document.getElementById('show-labels-toggle');
const showConfidenceToggle = document.getElementById('show-confidence-toggle');
const confidenceThreshold  = document.getElementById('confidence-threshold');
const thresholdValue       = document.getElementById('threshold-value');

const resultsSection = document.getElementById('results-section');
const resultsSummary = document.getElementById('results-summary');
const resultsTbody   = document.getElementById('results-tbody');

const apiUrlInput  = document.getElementById('api-url-input');
const apiSaveBtn   = document.getElementById('api-save-btn');
const apiTestBtn   = document.getElementById('api-test-btn');
const apiStatus    = document.getElementById('api-status');

const toast        = document.getElementById('toast');

/* ── Application state ──────────────────────────────────────────────────── */

let currentImageBlob = null;   // The image to detect on
let currentDetections = [];    // Last detection results
let webcamStream = null;       // Active MediaStream

/* ── Utility: Toast notifications ───────────────────────────────────────── */

let toastTimer = null;

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}

/* ── Utility: Enable / disable action buttons ───────────────────────────── */

function setImageReady(blob) {
  currentImageBlob = blob;
  detectBtn.disabled = false;
  clearBtn.disabled  = false;
}

function clearAll() {
  currentImageBlob  = null;
  currentDetections = [];

  const ctx = resultCanvas.getContext('2d');
  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCanvas.width  = 0;
  resultCanvas.height = 0;

  canvasPlaceholder.classList.remove('hidden');
  detectBtn.disabled  = true;
  clearBtn.disabled   = true;
  resultsSection.hidden = true;
  resultsTbody.innerHTML = '';
}

/* ── Tab navigation ─────────────────────────────────────────────────────── */

const TABS = [
  { btn: tabUpload,  panel: panelUpload },
  { btn: tabUrl,     panel: panelUrl    },
  { btn: tabWebcam,  panel: panelWebcam },
];

function activateTab(targetBtn) {
  TABS.forEach(({ btn, panel }) => {
    const active = btn === targetBtn;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
    panel.hidden   = !active;
    panel.classList.toggle('active', active);
  });

  // Stop webcam when switching away
  if (targetBtn !== tabWebcam) stopWebcam();
}

tabUpload.addEventListener('click', () => activateTab(tabUpload));
tabUrl.addEventListener('click',    () => activateTab(tabUrl));
tabWebcam.addEventListener('click', () => activateTab(tabWebcam));

/* ── File upload (click + drag-and-drop) ────────────────────────────────── */

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
  fileInput.value = '';   // reset so re-selecting same file fires change again
});

function handleFileSelect(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP).', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Kích thước tệp vượt quá 10 MB.', 'error');
    return;
  }
  loadImageBlob(file);
}

/* ── URL image load ─────────────────────────────────────────────────────── */

urlLoadBtn.addEventListener('click', () => {
  const src = urlInput.value.trim();
  if (!src) { showToast('Vui lòng nhập URL hình ảnh.', 'error'); return; }
  loadImageFromUrl(src);
});

urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') urlLoadBtn.click();
});

async function loadImageFromUrl(src) {
  try {
    urlLoadBtn.disabled = true;
    urlLoadBtn.textContent = '⏳ Đang tải…';

    const response = await fetch(src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('URL không phải là hình ảnh.');
    loadImageBlob(blob);
  } catch (err) {
    showToast(`Không thể tải ảnh: ${err.message}`, 'error');
  } finally {
    urlLoadBtn.disabled = false;
    urlLoadBtn.textContent = 'Tải ảnh';
  }
}

/* ── Webcam ──────────────────────────────────────────────────────────────── */

startWebcamBtn.addEventListener('click', startWebcam);
stopWebcamBtn.addEventListener('click',  stopWebcam);
captureBtn.addEventListener('click',     captureWebcam);

async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamVideo.srcObject = webcamStream;
    webcamVideo.classList.add('active');
    startWebcamBtn.disabled = true;
    captureBtn.disabled     = false;
    stopWebcamBtn.disabled  = false;
  } catch (err) {
    showToast(`Không thể truy cập camera: ${err.message}`, 'error');
  }
}

function stopWebcam() {
  if (!webcamStream) return;
  webcamStream.getTracks().forEach(t => t.stop());
  webcamStream = null;
  webcamVideo.srcObject = null;
  webcamVideo.classList.remove('active');
  startWebcamBtn.disabled = false;
  captureBtn.disabled     = true;
  stopWebcamBtn.disabled  = true;
}

function captureWebcam() {
  const vw = webcamVideo.videoWidth;
  const vh = webcamVideo.videoHeight;
  if (!vw || !vh) { showToast('Camera chưa sẵn sàng.', 'error'); return; }

  const offscreen = document.createElement('canvas');
  offscreen.width  = vw;
  offscreen.height = vh;
  offscreen.getContext('2d').drawImage(webcamVideo, 0, 0, vw, vh);

  offscreen.toBlob(blob => {
    if (blob) {
      loadImageBlob(blob);
      showToast('Đã chụp ảnh từ camera.');
    }
  }, 'image/jpeg', 0.92);
}

/* ── Load image blob → preview on canvas ────────────────────────────────── */

function loadImageBlob(blob) {
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    drawImageOnCanvas(img);
    URL.revokeObjectURL(url);
    setImageReady(blob);
    canvasPlaceholder.classList.add('hidden');
    currentDetections = [];
    resultsSection.hidden = true;
    showToast('Ảnh đã được tải. Nhấn "Nhận diện" để phát hiện biển báo.');
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    showToast('Không thể đọc tệp ảnh.', 'error');
  };

  img.src = url;
}

function drawImageOnCanvas(img) {
  const maxW = resultCanvas.parentElement.clientWidth - 2;
  const scale = Math.min(1, maxW / img.naturalWidth);
  resultCanvas.width  = Math.round(img.naturalWidth  * scale);
  resultCanvas.height = Math.round(img.naturalHeight * scale);

  const ctx = resultCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, resultCanvas.width, resultCanvas.height);

  // Store original-to-canvas scale for bbox rendering
  resultCanvas.dataset.scaleX = scale;
  resultCanvas.dataset.scaleY = scale;
  resultCanvas.dataset.origW  = img.naturalWidth;
  resultCanvas.dataset.origH  = img.naturalHeight;
  resultCanvas.dataset.imgSrc = img.src;
}

/* ── Detection ───────────────────────────────────────────────────────────── */

detectBtn.addEventListener('click', runDetection);

async function runDetection() {
  if (!currentImageBlob) return;

  detectBtn.disabled   = true;
  clearBtn.disabled    = true;
  processingInd.classList.remove('hidden');

  try {
    const threshold = parseFloat(confidenceThreshold.value);
    const detections = await detectImage(currentImageBlob, threshold);
    currentDetections = detections;

    // Redraw the image with bounding boxes
    await redrawWithDetections();

    // Populate results table
    renderResultsTable(detections);

    if (detections.length === 0) {
      showToast('Không phát hiện biển báo nào (thử hạ ngưỡng tin cậy).', '');
    } else {
      const mode = getApiUrl() ? 'thực tế' : 'demo';
      showToast(`Phát hiện ${detections.length} biển báo (chế độ ${mode}).`, 'success');
    }
  } catch (err) {
    showToast(`Lỗi nhận diện: ${err.message}`, 'error');
  } finally {
    detectBtn.disabled   = false;
    clearBtn.disabled    = false;
    processingInd.classList.add('hidden');
  }
}

async function redrawWithDetections() {
  const scaleX   = parseFloat(resultCanvas.dataset.scaleX) || 1;
  const scaleY   = parseFloat(resultCanvas.dataset.scaleY) || 1;

  // Reload the original image to clear previous boxes
  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = resultCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, resultCanvas.width, resultCanvas.height);
      drawDetections(ctx, currentDetections, scaleX, scaleY);
      resolve();
    };
    img.onerror = reject;
    // Re-create object URL from the current blob
    img.src = URL.createObjectURL(currentImageBlob);
  });
}

function drawDetections(ctx, detections, scaleX, scaleY) {
  const showLabels     = showLabelsToggle.checked;
  const showConfidence = showConfidenceToggle.checked;

  detections.forEach(det => {
    const sign  = getSign(det.label) || getSign(det.class_id);
    const color = sign ? categoryColor(sign.category) : '#457b9d';
    const name  = sign ? sign.name : det.label;

    const [bx, by, bw, bh] = det.bbox;
    const x = Math.round(bx * scaleX);
    const y = Math.round(by * scaleY);
    const w = Math.round(bw * scaleX);
    const h = Math.round(bh * scaleY);

    // Bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(x, y, w, h);

    // Semi-transparent fill
    ctx.fillStyle = `${color}22`;
    ctx.fillRect(x, y, w, h);

    if (!showLabels) return;

    // Label background
    const conf   = (det.confidence * 100).toFixed(0);
    const label  = showConfidence ? `${name} ${conf}%` : name;
    const fSize  = Math.max(11, Math.min(14, w / 8));
    ctx.font     = `bold ${fSize}px 'Segoe UI', sans-serif`;

    const padding  = 4;
    const textW    = ctx.measureText(label).width + padding * 2;
    const textH    = fSize + padding * 2;
    const labelY   = y > textH + 2 ? y - textH - 2 : y + 2;

    ctx.fillStyle  = color;
    ctx.fillRect(x, labelY, textW, textH);

    // Label text
    ctx.fillStyle  = '#ffffff';
    ctx.fillText(label, x + padding, labelY + fSize);
  });
}

/* ── Confidence threshold slider ────────────────────────────────────────── */

confidenceThreshold.addEventListener('input', () => {
  thresholdValue.textContent = confidenceThreshold.value;
});

// Re-render detections when display toggles change
[showLabelsToggle, showConfidenceToggle].forEach(el => {
  el.addEventListener('change', () => {
    if (currentDetections.length) redrawWithDetections();
  });
});

/* ── Results table ───────────────────────────────────────────────────────── */

function renderResultsTable(detections) {
  resultsTbody.innerHTML = '';

  const categories = {
    warning: 'Cảnh báo', prohibition: 'Cấm', mandatory: 'Hiệu lệnh', info: 'Chỉ dẫn',
  };

  if (detections.length === 0) {
    resultsSection.hidden = true;
    return;
  }

  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  sorted.forEach((det, i) => {
    const sign  = getSign(det.label) || getSign(det.class_id);
    const name  = sign ? sign.name  : det.label;
    const cat   = sign ? sign.category : 'info';
    const catVi = categories[cat] || cat;
    const badgeCls = categoryBadgeClass(cat);
    const conf  = (det.confidence * 100).toFixed(1);
    const [bx, by, bw, bh] = det.bbox;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><strong>${name}</strong><br/><small style="color:#6c757d">${det.label}</small></td>
      <td><span class="badge ${badgeCls}">${catVi}</span></td>
      <td>
        <div class="conf-bar-wrap">
          <div class="conf-bar"><div class="conf-bar-fill" style="width:${conf}%"></div></div>
          <span>${conf}%</span>
        </div>
      </td>
      <td>${bx}, ${by}, ${bw}, ${bh}</td>
    `;
    resultsTbody.appendChild(tr);
  });

  const mode = getApiUrl() ? '' : ' <em>(chế độ demo)</em>';
  resultsSummary.innerHTML = `Tìm thấy <strong>${detections.length}</strong> biển báo${mode}`;
  resultsSection.hidden = false;
}

/* ── Clear button ────────────────────────────────────────────────────────── */

clearBtn.addEventListener('click', clearAll);

/* ── API settings ────────────────────────────────────────────────────────── */

// Populate saved API URL on load
apiUrlInput.value = getApiUrl();
updateApiStatusDisplay();

apiSaveBtn.addEventListener('click', () => {
  setApiUrl(apiUrlInput.value);
  updateApiStatusDisplay();
  showToast('Đã lưu cấu hình API.', 'success');
});

apiTestBtn.addEventListener('click', async () => {
  apiTestBtn.disabled   = true;
  apiTestBtn.textContent = '⏳ Đang kiểm tra…';

  const result = await testApiConnection();
  apiStatus.textContent = result.message;
  apiStatus.className   = `api-status ${result.ok ? 'ok' : 'error'}`;

  apiTestBtn.disabled   = false;
  apiTestBtn.textContent = 'Kiểm tra kết nối';
});

function updateApiStatusDisplay() {
  const url = getApiUrl();
  if (url) {
    apiStatus.textContent = `Đang dùng: ${url}`;
    apiStatus.className   = 'api-status ok';
  } else {
    apiStatus.textContent = 'Chưa cấu hình – đang dùng chế độ demo.';
    apiStatus.className   = 'api-status demo';
  }
}

/* ── Init ────────────────────────────────────────────────────────────────── */

clearAll();
