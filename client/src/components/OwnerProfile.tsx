import React from 'react';
import { MapPin, Link as LinkIcon, Building2, Star, BookOpen } from 'lucide-react';

interface OwnerRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
  repoUrl: string;
}

interface OwnerProfileProps {
  owner: {
    login: string;
    avatarUrl: string;
    name: string;
    bio: string;
    publicRepos: number;
    followers: number;
    following: number;
    company: string;
    location: string;
    blog: string;
    profileUrl: string;
  };
  repos?: OwnerRepo[];
  layout?: 'vertical' | 'horizontal';
}

export const OwnerProfile: React.FC<OwnerProfileProps> = ({ owner, repos = [], layout = 'vertical' }) => {
  if (!owner) return null;

  if (layout === 'horizontal') {
    return (
      <div className="p-10 h-full flex items-center gap-16">
        {/* Left Side: Identity */}
        <div className="flex items-center space-x-10 min-w-[500px] border-r border-zinc-800/40 pr-16">
          <div className="relative group shrink-0">
             <div className="absolute -inset-2 bg-gradient-to-r from-[#83aeff] to-purple-500 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
             <img 
               src={owner.avatarUrl} 
               alt={owner.login} 
               className="relative w-32 h-32 rounded-[32px] border-2 border-zinc-800 shadow-2xl"
             />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none truncate">
              {owner.name || owner.login}
            </h2>
            <a 
              href={owner.profileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#83aeff] text-xs font-black uppercase tracking-[0.4em] hover:text-white transition-colors mt-3 inline-block"
            >
              @{owner.login}
            </a>
            
            <div className="flex items-center space-x-10 mt-8 pt-8 border-t border-zinc-800/40">
              <div>
                <span className="block text-3xl font-black text-white italic tracking-tighter leading-none">{owner.followers}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Followers</span>
              </div>
              <div>
                <span className="block text-3xl font-black text-white italic tracking-tighter leading-none">{owner.publicRepos}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Repositories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Horizontal Repos */}
        {repos.length > 0 && (
          <div className="flex-1 min-w-0 py-4">
            <div className="flex items-center space-x-3 text-zinc-500 font-bold mb-6 text-[11px] uppercase tracking-[0.3em]">
              <BookOpen size={16} className="text-[#83aeff]/40" />
              <span>Priority Source Nodes</span>
            </div>
            <div className="grid grid-cols-2 gap-6 h-full">
              {repos.slice(0, 4).map((repo) => (
                <a
                  key={repo.name}
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-5 rounded-[24px] border border-zinc-800/60 hover:border-[#83aeff]/40 transition-all group bg-zinc-950/40 hover:bg-zinc-900/60 shadow-xl flex flex-col justify-center"
                >
                  <div className="font-black text-[#83aeff] text-xs uppercase tracking-wider truncate mb-3 group-hover:text-white transition-colors">
                    {repo.name}
                  </div>
                  <div className="flex items-center space-x-6 text-[10px] text-zinc-500 font-bold">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                      <span>{repo.language || 'Code'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Star size={14} className="text-yellow-500/40" />
                      <span>{repo.stars}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-start space-x-4 mb-5">
        <img 
          src={owner.avatarUrl} 
          alt={owner.login} 
          className="w-16 h-16 rounded-lg border border-[#27272a]"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-zinc-100 truncate">
            {owner.name || owner.login}
          </h2>
          <a 
            href={owner.profileUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-[#83aeff] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            @{owner.login}
          </a>
          
          {owner.bio && (
            <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{owner.bio}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs text-zinc-500">
            {owner.location && (
              <div className="flex items-center space-x-1">
                <MapPin size={12} />
                <span>{owner.location}</span>
              </div>
            )}
            {owner.company && (
              <div className="flex items-center space-x-1">
                <Building2 size={12} />
                <span>{owner.company}</span>
              </div>
            )}
            {owner.blog && (
              <div className="flex items-center space-x-1">
                <LinkIcon size={12} />
                <a href={owner.blog.startsWith('http') ? owner.blog : `https://${owner.blog}`} target="_blank" rel="noreferrer" className="hover:text-teal-400 truncate max-w-[150px] inline-block">
                  {owner.blog.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-[#27272a]">
            <div>
              <span className="block text-zinc-100 font-bold">{owner.followers}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Followers</span>
            </div>
            <div>
              <span className="block text-zinc-100 font-bold">{owner.publicRepos}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Repos</span>
            </div>
          </div>
        </div>
      </div>

      {repos.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center space-x-2 text-zinc-300 font-semibold mb-3 text-sm">
            <BookOpen size={14} className="text-[#83aeff]" />
            <span>Top Public Repositories</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {repos.slice(0, 4).map((repo) => (
              <a
                key={repo.name}
                href={repo.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="block p-3 rounded-xl border border-zinc-900/50 hover:border-[#83aeff]/50 transition-colors group bg-zinc-950/20"
              >
                <div className="font-medium text-[#83aeff] text-sm truncate mb-1 group-hover:text-white transition-colors">
                  {repo.name}
                </div>
                {repo.description && (
                  <div className="text-xs text-zinc-500 line-clamp-1 mb-2">
                    {repo.description}
                  </div>
                )}
                <div className="flex items-center space-x-3 text-xs text-zinc-400">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                    <span>{repo.language || 'Code'}</span>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    <Star size={12} className="text-yellow-500" />
                    <span>{repo.stars}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

