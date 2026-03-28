import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg bg-[#141414] border-[#2a2a2a] text-white min-w-[260px]">
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-[#a3e635] flex-shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
      )}
      <span className="text-sm flex-1">{message}</span>
      <button type="button" onClick={onClose} className="text-[#a1a1a1] hover:text-white transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
