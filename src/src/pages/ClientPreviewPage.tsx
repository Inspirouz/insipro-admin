import { useState } from 'react';
import { RefreshCw, ExternalLink, Monitor } from 'lucide-react';

const CLIENT_URL = 'http://localhost:5174';

export function ClientPreviewPage() {
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2a2a2a] bg-[#0f0f0f] shrink-0">
        <Monitor className="h-4 w-4 text-[#a3e635]" />
        <span className="text-sm font-medium text-[#a1a1a1]">Клиентская часть</span>
        <span className="text-xs text-[#404040] font-mono">{CLIENT_URL}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setKey(k => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#242424] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Обновить
          </button>
          <a
            href={CLIENT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#242424] transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Открыть отдельно
          </a>
        </div>
      </div>
      <iframe
        key={key}
        src={CLIENT_URL}
        className="flex-1 w-full border-0"
        title="Клиентская часть"
        allow="same-origin"
      />
    </div>
  );
}
