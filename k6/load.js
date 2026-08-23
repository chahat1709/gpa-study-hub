import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '60s', target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const health = http.get(`${BASE}/api/health`);
  check(health, { 'health 200': r => r.status === 200 });

  const meta = http.get(`${BASE}/api/academic/meta`);
  check(meta, { 'meta 200': r => r.status === 200 });

  // SQLite WAL ceiling: 300 concurrent reads should stay <500ms p95
  sleep(1);
}
