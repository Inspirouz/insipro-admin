import { Upload, X, Loader2, ClipboardPaste } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { uploadFileWithMeta, deleteFile, UploadedFileMeta } from '../lib/api/fileApi';
import { getProjectImageUrl } from '../lib/api/projectsApi';

const VIDEO_EXTS = /\.(mp4|webm|mov|ogg|quicktime|x-msvideo|x-matroska)(\?.*)?$/i;
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (/\/video__[^/]+$/i.test(url)) return true;
  return VIDEO_EXTS.test(url);
}

interface ImageUploadSlotProps {
  value: string | null;
  onChange: (url: string | null) => void;
  fileId?: string | null;
  label?: string;
  aspectRatio?: string;
  slotWidth?: number;
  onUploaded?: (meta: UploadedFileMeta) => void;
  dupCheckKey?: string;
  accept?: string;
}

const uploadedHashRegistry = new Map<string, Set<string>>();

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isDuplicate(hash: string, key: string): boolean {
  return uploadedHashRegistry.get(key)?.has(hash) ?? false;
}

function registerHash(hash: string, key: string) {
  if (!uploadedHashRegistry.has(key)) uploadedHashRegistry.set(key, new Set());
  uploadedHashRegistry.get(key)!.add(hash);
}

export function ImageUploadSlot({ value, onChange, fileId, label, aspectRatio = '1', slotWidth = 100, onUploaded, dupCheckKey, accept = 'image/*' }: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const pendingFileRef = useRef<{ file: File; hash: string } | null>(null);

  const allowsVideo = accept.includes('video');
  const isVideo = value ? isVideoUrl(value) : false;
  const resolvedSrc = value ? (getProjectImageUrl(value) || value) : null;

  const processFile = async (file: File) => {
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');
    if (!isImageFile && !(allowsVideo && isVideoFile)) {
      setUploadError(allowsVideo ? 'Только изображения или видео' : 'Только изображения');
      return;
    }
    setUploadError(null);
    setDuplicateWarning(false);

    if (dupCheckKey && isImageFile) {
      const hash = await hashFile(file);
      if (isDuplicate(hash, dupCheckKey)) {
        pendingFileRef.current = { file, hash };
        setDuplicateWarning(true);
        return;
      }
      pendingFileRef.current = { file, hash };
    } else {
      pendingFileRef.current = { file, hash: '' };
    }

    await doUpload(file, dupCheckKey && isImageFile ? pendingFileRef.current!.hash : undefined);
  };

  const doUpload = async (file: File, hash?: string) => {
    setDuplicateWarning(false);
    setUploading(true);
    try {
      const meta = await uploadFileWithMeta(file);
      onChange(meta.url);
      if (onUploaded) onUploaded(meta);
      if (hash && dupCheckKey) registerHash(hash, dupCheckKey);
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
      pendingFileRef.current = null;
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (value || uploading || removing) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await processFile(file);
        break;
      }
    }
  };

  useEffect(() => {
    const onDocPaste = (e: ClipboardEvent) => {
      if (!value && !uploading) handlePaste(e);
    };
    document.addEventListener('paste', onDocPaste);
    return () => document.removeEventListener('paste', onDocPaste);
  }, [value, uploading]);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileId) {
      setRemoving(true);
      try {
        await deleteFile(fileId);
      } catch (err) {
        console.error(err);
      } finally {
        setRemoving(false);
      }
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleConfirmDuplicate = async () => {
    if (!pendingFileRef.current) return;
    const { file, hash } = pendingFileRef.current;
    await doUpload(file, hash);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        ref={containerRef}
        onClick={() => !uploading && !removing && !duplicateWarning && inputRef.current?.click()}
        className={`relative bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-lg overflow-hidden transition-colors group ${uploading || removing ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-[#3a3a3a]'}`}
        style={{ width: slotWidth, aspectRatio, flexShrink: 0 }}
      >
        {uploading || removing ? (
          <div className="flex flex-col items-center justify-center h-full text-[#a1a1a1]">
            <Loader2 className="h-8 w-8 mb-2 animate-spin" />
            <span className="text-sm">{removing ? 'Удаление...' : 'Загрузка...'}</span>
          </div>
        ) : duplicateWarning ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-center">
            <span className="text-sm text-yellow-400">Это изображение уже загружалось</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleConfirmDuplicate(); }}
                className="px-3 py-1.5 text-xs bg-white text-black rounded-lg font-medium hover:bg-gray-100"
              >
                Загрузить
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDuplicateWarning(false); pendingFileRef.current = null; }}
                className="px-3 py-1.5 text-xs bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a]"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : resolvedSrc ? (
          <>
            {isVideo ? (
              <video
                src={resolvedSrc}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img src={resolvedSrc} alt="Preview" className="w-full h-full object-cover" />
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#6b6b6b] group-hover:text-[#a1a1a1] transition-colors gap-1">
            <Upload className="h-8 w-8 mb-1" />
            <span className="text-sm">Загрузить</span>
            {!allowsVideo && (
              <span className="text-xs opacity-60 flex items-center gap-1"><ClipboardPaste className="h-3 w-3" /> или вставить Cmd+V</span>
            )}
          </div>
        )}
        {uploadError && (
          <p className="absolute bottom-2 left-2 right-2 text-xs text-red-400 truncate" title={uploadError}>
            {uploadError}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
