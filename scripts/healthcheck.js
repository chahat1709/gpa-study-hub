#!/usr/bin/env node
import http from 'http';

const url = process.env.HEALTH_URL || `http://localhost:${process.env.PORT || 3000}/api/health`;
const timeoutMs = 5000;

const req = http.get(url, res => {
  let data = '';
  res.on('data', c => (data += c));
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const j = JSON.parse(data);
        if (j.status === 'ok') {
          console.log(`[health] ok uptime=${j.uptime}s`);
          process.exit(0);
        }
      } catch {}
    }
    console.error(`[health] fail status=${res.statusCode} body=${data.slice(0, 200)}`);
    process.exit(1);
  });
});
req.on('error', e => {
  console.error(`[health] error ${e.message} url=${url}`);
  process.exit(1);
});
req.setTimeout(timeoutMs, () => {
  req.destroy();
  console.error(`[health] timeout ${timeoutMs}ms`);
  process.exit(1);
});
