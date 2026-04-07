import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, AlignLeft } from 'lucide-react';

interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

interface DirectoryTreeProps {
  tree: TreeNode[];
}

const TreeItem: React.FC<{ node: TreeNode; depth: number }> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 1); // Auto-open root level
  const isDir = node.type === 'dir';

  return (
    <div className="select-none">
      <div 
        className={`flex items-center space-x-1.5 py-1 px-2 rounded-md hover:bg-white/5 cursor-pointer text-sm ${depth === 0 ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isDir && setIsOpen(!isOpen)}
      >
        {isDir ? (
          <>
            <span className="text-zinc-500">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            <span className="text-teal-400">
              {isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-3.5" /> {/* Spacer for alignment */}
            <FileText size={14} className="text-zinc-500" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      
      {isDir && isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map((child, idx) => (
            <TreeItem key={`${child.name}-${idx}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({ tree }) => {
  if (!tree || tree.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl h-full flex items-center justify-center text-zinc-500 p-6">
        Directory tree unavailable
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg flex flex-col h-full max-h-[400px]">
      <div className="p-4 border-b border-[#27272a] flex items-center space-x-2 shrink-0">
        <AlignLeft size={18} className="text-teal-400" />
        <h3 className="font-semibold text-zinc-100">Project Structure</h3>
      </div>
      <div className="p-2 overflow-y-auto flex-1 font-mono">
        {tree.map((node, idx) => (
          <TreeItem key={`root-${node.name}-${idx}`} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
};
