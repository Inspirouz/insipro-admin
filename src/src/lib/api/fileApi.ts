import { getToken } from '../auth';

const getApiBase = (): string => {
  try {
    const env = (import.meta as { env?: { VITE_API_URL?: string } }).env;
    return env?.VITE_API_URL ?? '';
  } catch {
    return '';
  }
};

function fileUploadUrl(): string {
  const base = getApiBase();
  const path = base ? '/file' : '/api/file';
  return base ? `${base.replace(/\/$/, '')}${path}` : path;
}

function fileUploadHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Response: { url: string } or { data: { url: string } } or { path: string } */
interface FileUploadResponse {
  url?: string;
  path?: string;
  data?: { url?: string; path?: string };
  message?: string;
}

/**
 * POST /api/file
 * Body: FormData with key "file" (binary).
 * Returns the URL (or path) of the uploaded file.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(fileUploadUrl(), {
    method: 'POST',
    headers: fileUploadHeaders(),
    body: formData,
  });

  const json: FileUploadResponse = await res.json();

  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Upload failed: ${res.status}`;
    throw new Error(msg);
  }

  const url =
    json.url ??
    json.path ??
    json.data?.url ??
    json.data?.path ??
    '';
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('No URL in upload response');
  }
  return url.trim();
}
