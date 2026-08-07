function getGoogle(override) {
  if (override) return override;
  try {
    return require('googleapis').google;
  } catch (error) {
    throw new Error('googleapis dependency is required. Run npm install before using GSC extraction.');
  }
}

function createSearchConsoleClient(auth, googleOverride) {
  const google = getGoogle(googleOverride);
  return google.searchconsole({ version: 'v1', auth });
}

function extractStatus(error) {
  return error?.response?.status || error?.code || null;
}

function extractReasons(error) {
  const errors = error?.response?.data?.error?.errors;
  if (!Array.isArray(errors)) return [];
  return errors.map((item) => item.reason).filter(Boolean);
}

function isRetryable(error) {
  const rawStatus = extractStatus(error);
  if (rawStatus === null || rawStatus === undefined) return true;
  if (typeof rawStatus === 'string' && !/^\d+$/.test(rawStatus)) return true;
  const status = Number(rawStatus);
  if ([429, 500, 502, 503, 504].includes(status)) return true;
  if (status === 403) {
    const retryableReasons = new Set(['rateLimitExceeded', 'userRateLimitExceeded', 'quotaExceeded']);
    return extractReasons(error).some((reason) => retryableReasons.has(reason));
  }
  return false;
}

function delayMs(attempt, base = 500, cap = 8000, random = Math.random) {
  const exponential = Math.min(cap, base * (2 ** attempt));
  return Math.round(exponential * (0.8 + (random() * 0.4)));
}

async function withRetry(fn, { maxAttempts = 5, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), random = Math.random } = {}) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxAttempts - 1) throw error;
      await sleep(delayMs(attempt, 500, 8000, random));
    }
  }
  throw lastError;
}

module.exports = { createSearchConsoleClient, isRetryable, delayMs, withRetry };
