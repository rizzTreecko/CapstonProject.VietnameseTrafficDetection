/**
 * api.js – Communication layer between the frontend and the YOLO backend.
 *
 * The backend is expected to expose a single POST endpoint that accepts a
 * multipart/form-data request with an "image" field and responds with JSON:
 *
 *   {
 *     "detections": [
 *       {
 *         "label":      "no_entry",   // class label string
 *         "class_id":   0,            // class index (optional)
 *         "confidence": 0.92,         // 0–1 float
 *         "bbox":       [x, y, w, h]  // pixel coords relative to original image
 *       },
 *       ...
 *     ]
 *   }
 *
 * If no API URL is configured, detectImage() falls back to demo data so the
 * UI can be exercised without a running backend.
 */

const API_STORAGE_KEY = 'vntd_api_url';

/** Retrieve the saved API URL (or empty string if not set). */
function getApiUrl() {
  return localStorage.getItem(API_STORAGE_KEY) || '';
}

/** Persist the API URL to localStorage. */
function setApiUrl(url) {
  localStorage.setItem(API_STORAGE_KEY, url.trim());
}

/**
 * Send an image Blob/File to the detection backend and return parsed results.
 *
 * @param {Blob|File} imageBlob
 * @param {number}    confidenceThreshold  – detections below this are dropped
 * @returns {Promise<Detection[]>}
 */
async function detectImage(imageBlob, confidenceThreshold = 0.25) {
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return _demoDetect(imageBlob, confidenceThreshold);
  }

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.jpg');
  formData.append('confidence', String(confidenceThreshold));

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Lỗi từ máy chủ: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (!Array.isArray(json.detections)) {
    throw new Error('Phản hồi từ máy chủ không hợp lệ (thiếu trường "detections").');
  }

  return json.detections.filter(d => d.confidence >= confidenceThreshold);
}

/**
 * Test whether the configured endpoint is reachable.
 *
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function testApiConnection() {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { ok: false, message: 'Chưa cấu hình URL.' };
  }

  try {
    const response = await fetch(apiUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    if (response.ok || response.status === 405) {
      // 405 Method Not Allowed is fine – the endpoint exists
      return { ok: true, message: `Kết nối thành công (HTTP ${response.status}).` };
    }
    return { ok: false, message: `HTTP ${response.status} ${response.statusText}` };
  } catch (err) {
    return { ok: false, message: `Không thể kết nối: ${err.message}` };
  }
}

// ─── Demo / mock detection ───────────────────────────────────────────────────

/**
 * Generates plausible fake detections so the UI can be demoed without a
 * backend.  The number and positions of detections scale with image size.
 */
function _demoDetect(imageBlob, confidenceThreshold) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(imageBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      const picks = _randomPicks(3 + Math.floor(Math.random() * 3));
      const detections = picks.map(sign => {
        const bw = 60 + Math.random() * 90;
        const bh = bw * (0.85 + Math.random() * 0.3);
        const bx = Math.random() * (w - bw);
        const by = Math.random() * (h - bh);
        return {
          label:      sign.label,
          class_id:   sign.id,
          confidence: 0.60 + Math.random() * 0.39,
          bbox:       [
            Math.round(bx),
            Math.round(by),
            Math.round(bw),
            Math.round(bh),
          ],
        };
      }).filter(d => d.confidence >= confidenceThreshold);

      // Simulate network latency
      setTimeout(() => resolve(detections), 400 + Math.random() * 300);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve([]);
    };

    img.src = url;
  });
}

function _randomPicks(n) {
  const copy = [...TRAFFIC_SIGNS];
  const result = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}
