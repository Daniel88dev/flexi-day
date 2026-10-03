function handler(event) {
  var request = event.request;
  var host = request.headers.host.value;

  // Apex -> www redirect (unchanged).
  if (host === 'flexi-day.com') {
    var qs = '';
    var parts = [];
    for (var key in request.querystring) {
      parts.push(key + '=' + request.querystring[key].value);
    }
    if (parts.length) qs = '?' + parts.join('&');
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://www.flexi-day.com' + request.uri + qs }
      }
    };
  }

  // Static-export routing: the site is a Next.js `output: export` with
  // `trailingSlash: true`, so each route is a folder containing index.html
  // (e.g. /email-verified/ -> email-verified/index.html). S3 (REST/OAC origin)
  // does no directory-index resolution, so rewrite the URI here.
  var uri = request.uri;
  if (uri.startsWith('/.well-known/')) return request;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.split('/').pop().includes('.')) {
    // Extensionless path (e.g. /email-verified) -> its folder index.
    request.uri = uri + '/index.html';
  }

  return request;
}