import { Upload, X, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadFile } from '../lib/api/fileApi';

interface ImageUploadSlotProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: string;
}

export function ImageUploadSlot({ value, onChange, label, aspectRatio = '16/9' }: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] rounded-lg overflow-hidden transition-colors group ${uploading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-[#3a3a3a]'}`}
        style={{ aspectRatio }}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#a1a1a1]">
            <Loader2 className="h-8 w-8 mb-2 animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#6b6b6b] group-hover:text-[#a1a1a1] transition-colors">
            <Upload className="h-8 w-8 mb-2" />
            <span className="text-sm">Загрузить</span>
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
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}