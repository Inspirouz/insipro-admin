interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 min-h-full min-w-full bg-transparent"
        onClick={loading ? undefined : onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-md bg-bg-secondary border border-border rounded-xl shadow-soft-lg p-6">
        <h2 className="text-lg font-medium mb-2">{title}</h2>
        <p className="text-text-secondary text-sm mb-6">{description}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-bg-tertiary border border-border text-white font-medium rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isDanger
                ? 'bg-red-500/90 text-white hover:bg-red-500'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
