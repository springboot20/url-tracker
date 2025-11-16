// const fetch = require('node-fetch');
const cheerio = require('cheerio');

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

async function scrapeNGLProfile(url) {
  if (!url) return;

  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const ogTags = {};
    $('meta[property^="og:"]').each((i, element) => {
      const property = $(element).attr('property');
      const content = $(element).attr('content');
      if (property && content) {
        const key = property.replace('og:', '');
        ogTags[key] = content;
      }
    });

    return ogTags;
  } catch (error) {
    console.error('Error fetching or parsing URL:', error);
  }
}
module.exports = { getClientIp, scrapeNGLProfile };
