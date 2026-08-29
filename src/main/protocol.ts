import { net, protocol } from 'electron';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const VIEWABLE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'media',
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ]);
}

export function handleMediaProtocol(): void {
  protocol.handle('media', (request) => {
    const encodedPath = new URL(request.url).pathname.replace(/^\//, '');
    const filePath = decodeURIComponent(encodedPath);

    if (!VIEWABLE_EXTENSIONS.includes(extname(filePath).toLowerCase())) {
      return new Response('forbidden', { status: 403 });
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });
}
