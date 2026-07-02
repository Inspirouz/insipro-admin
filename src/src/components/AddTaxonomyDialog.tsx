import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AddTaxonomyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, nameUz: string, nameEn: string) => void;
  title: string;
  initialValue?: string;
  initialNameUz?: string;
  initialNameEn?: string;
}

export function AddTaxonomyDialog({
  isOpen,
  onClose,
  onSave,
  title,
  initialValue = '',
  initialNameUz = '',
  initialNameEn = '',
}: AddTaxonomyDialogProps) {
  const [name, setName] = useState(initialValue);
  const [nameUz, setNameUz] = useState(initialNameUz);
  const [nameEn, setNameEn] = useState(initialNameEn);

  useEffect(() => {
    setName(initialValue);
    setNameUz(initialNameUz);
    setNameEn(initialNameEn);
  }, [initialValue, initialNameUz, initialNameEn]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), nameUz.trim(), nameEn.trim());
      setName('');
      setNameUz('');
      setNameEn('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-soft-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-medium">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1a1a1a] rounded transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Название (RU)</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              placeholder="Введите название..." autoFocus required />
          </div>
          <div>
            <label htmlFor="nameUz" className="block text-sm font-medium mb-2">Nomi (UZ)</label>
            <input id="nameUz" type="text" value={nameUz} onChange={(e) => setNameUz(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              placeholder="O'zbek tilidagi nomi..." />
          </div>
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium mb-2">Name (EN)</label>
            <input id="nameEn" type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg focus:outline-none focus:border-[#a3e635] transition-colors"
              placeholder="English name..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 px-4 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Сохранить
            </button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white font-medium rounded-lg hover:bg-[#242424] transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
