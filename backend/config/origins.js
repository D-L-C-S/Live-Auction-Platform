function parseAllowedOrigins() {
  const configured = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Railway healthchecks may send this origin.
  return [...new Set([...configured, 'https://healthcheck.railway.app'])];
}

function isAllowedOrigin(origin, allowedOrigins) {
  // Non-browser clients (curl, server-to-server) may not send an Origin header.
  if (!origin) return true;
  if (!allowedOrigins.length) return true;
  return allowedOrigins.includes(origin);
}

function corsOriginHandler(allowedOrigins) {
  return (origin, callback) => {
    if (isAllowedOrigin(origin, allowedOrigins)) return callback(null, true);
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    return callback(err);
  };
}

module.exports = { parseAllowedOrigins, isAllowedOrigin, corsOriginHandler };
