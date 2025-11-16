function getClientIp(req) {
  let ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

  if (typeof ip === 'string') {
    // Handle IPv6 localhost (::ffff:127.0.0.1 -> 127.0.0.1)
    return ip.split(',')[0].trim().replace('::ffff:', '');
  }

  return ip;
}

module.exports = { getClientIp };
