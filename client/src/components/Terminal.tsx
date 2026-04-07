import React, { useEffect, useRef } from 'react';
import { Terminal as TermIcon } from 'lucide-react';

interface TerminalProps {
  logs: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-[#18181b] border-b border-[#27272a] px-4 py-2.5 flex items-center justify-between shrink-0 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs text-zinc-500 font-mono ml-3 font-semibold tracking-wider flex items-center space-x-1">
             <TermIcon size={12} className="text-teal-400/80" />
             <span>ENGINE LOGS</span>
          </span>
        </div>
      </div>
      <div 
        className="bg-[#09090b] text-[#a1a1aa] p-4 font-mono text-xs overflow-y-auto w-full text-left flex-1 border border-t-0 border-[#27272a] rounded-b-xl" 
        ref={scrollRef}
      >
        {logs.length === 0 ? (
          <span className="text-zinc-600">Waiting for logs...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="whitespace-pre-wrap leading-relaxed py-0.5 pointer-events-none">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

