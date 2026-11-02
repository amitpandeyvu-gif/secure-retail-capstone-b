import app from '../server.js';

export default function handler(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const routedPath = requestUrl.searchParams.get('__path');
  if (routedPath !== null) {
    requestUrl.searchParams.delete('__path');
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api${routedPath ? `/${routedPath}` : ''}${query ? `?${query}` : ''}`;
  }
  return app(req, res);
}
