const { randomUUID } = require('crypto');

/**
 * Request ID tracing — professional observability.
 * Sets x-request-id (incoming or generated) and logs it. Use in every log line.
 */
function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
}

module.exports = { requestId };
