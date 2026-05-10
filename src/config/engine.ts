export const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || 'http://localhost:8080';

export function getEngineRoute(path: string) {
  const baseUrl = ENGINE_URL.endsWith('/') ? ENGINE_URL.slice(0, -1) : ENGINE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
