import React from 'react';
import { Users } from 'lucide-react';

interface ContributorInfo {
  login: string;
  avatarUrl: string;
  contributions: number;
  profileUrl: string;
}

interface ContributorListProps {
  contributors: ContributorInfo[];
}

export const ContributorList: React.FC<ContributorListProps> = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-center text-zinc-500">
        No contributor data available.
      </div>
    );
  }

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
      <div className="px-6 py-4 border-b border-[#27272a] flex items-center space-x-2">
        <Users size={18} className="text-teal-400" />
        <h3 className="font-semibold text-zinc-100">Top Contributors</h3>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {contributors.map(c => (
          <a
            key={c.login}
            href={c.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center bg-[#09090b] p-3 rounded-lg border border-[#27272a] hover:border-teal-500/50 transition-colors group"
          >
            <img 
              src={c.avatarUrl} 
              alt={c.login} 
              className="w-12 h-12 rounded-full border-2 border-zinc-800 group-hover:border-teal-400 transition-colors mb-2"
            />
            <span className="text-sm font-medium text-zinc-200 truncate w-full text-center">{c.login}</span>
            <span className="text-xs text-teal-400 mt-1">{c.contributions} commits</span>
          </a>
        ))}
      </div>
    </div>
  );
};
