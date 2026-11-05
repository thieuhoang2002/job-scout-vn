/**
 * Human Delay & Anti-Rate-Limit Utility
 * Emulates natural human reading & navigation patterns with randomized jitter.
 */

function humanDelay(minMs = 800, maxMs = 2000) {
  const jitter = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, jitter));
}

async function fetchWithBackoff(fetchFn, maxRetries = 2, baseDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchFn();
      if (res && res.statusCode === 429) {
        const waitTime = baseDelay * attempt + Math.floor(Math.random() * 1000);
        console.warn(`⚠️ [Rate-Limit 429] Đang tạm dừng ${Math.round(waitTime / 1000)}s mô phỏng người dùng nghỉ lướt...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, baseDelay * attempt));
    }
  }
}

module.exports = {
  humanDelay,
  fetchWithBackoff
};

