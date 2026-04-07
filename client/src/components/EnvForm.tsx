import React, { useState } from 'react';
import { Play, Lock, Eye, EyeOff, Settings } from 'lucide-react';

interface EnvVarInfo {
  key: string;
  defaultValue: string;
  isSecret: boolean;
}

interface EnvFormProps {
  envVars: EnvVarInfo[];
  onSubmit: (envVars: Record<string, string>) => void;
  disabled?: boolean;
}

export const EnvForm: React.FC<EnvFormProps> = ({ envVars, onSubmit, disabled }) => {
  // Pre-fill with defaults
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    envVars.forEach(v => {
      if (v.defaultValue) initial[v.key] = v.defaultValue;
    });
    return initial;
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  // Separate secrets (user must fill) from pre-filled vars
  const secrets = envVars.filter(v => v.isSecret);
  const prefilled = envVars.filter(v => !v.isSecret && v.defaultValue);

  if (envVars.length === 0) {
    return (
      <div className="p-6 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col items-center justify-center text-center shadow-lg h-full">
        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 border border-teal-500/20">
          <Play size={24} className="text-teal-400 ml-1" />
        </div>
        <h3 className="text-lg font-bold text-zinc-100 mb-2">Ready to Launch</h3>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm">No manual environment variables required. The system has automatically configured everything for you.</p>
        <button
          onClick={() => onSubmit({})}
          disabled={disabled}
          className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          <Play size={18} />
          <span>Deploy Container</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-[#18181b] border border-[#27272a] rounded-xl space-y-6 shadow-lg h-full flex flex-col">
      <div className="flex items-center space-x-2 border-b border-[#27272a] pb-4">
         <Settings size={20} className="text-teal-400" />
         <h3 className="text-lg font-bold text-zinc-100">Environment Configuration</h3>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {/* Secrets section — user must fill these */}
        {secrets.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center space-x-2 mb-3">
              <Lock size={14} className="text-yellow-500" />
              <span>Required Secrets</span>
            </h4>
            <div className="space-y-4">
              {secrets.map(v => (
                <div key={v.key} className="flex flex-col space-y-1.5 text-left">
                  <label className="text-xs text-zinc-400 font-medium flex items-center space-x-1">
                    <span>{v.key}</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showSecrets[v.key] ? 'text' : 'password'}
                      placeholder={`Enter ${v.key}`}
                      className="w-full bg-[#09090b] border border-[#3f3f46] rounded-md px-3 py-2 pr-10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono text-sm"
                      value={values[v.key] || ''}
                      onChange={e => handleChange(v.key, e.target.value)}
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                      onClick={() => setShowSecrets(prev => ({ ...prev, [v.key]: !prev[v.key] }))}
                    >
                      {showSecrets[v.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pre-filled section — collapsed, already has defaults */}
        {prefilled.length > 0 && (
          <details className="group border border-[#27272a] bg-[#09090b] rounded-lg">
            <summary className="text-sm text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 transition select-none p-3 flex items-center justify-between">
              <span>Auto-Configured Options ({prefilled.length})</span>
              <span className="text-xs opacity-50 group-open:hidden">Click to view</span>
            </summary>
            <div className="p-3 pt-0 space-y-3 border-t border-[#27272a]/50 mt-1">
              {prefilled.map(v => (
                <div key={v.key} className="flex flex-col space-y-1 text-left">
                  <label className="text-xs text-zinc-500 font-mono">{v.key}</label>
                  <input
                    type="text"
                    className="bg-[#18181b] border border-[#27272a] rounded-md px-2 py-1.5 text-zinc-400 font-mono text-xs focus:outline-none focus:border-teal-500/50"
                    value={values[v.key] || ''}
                    onChange={e => handleChange(v.key, e.target.value)}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="pt-4 mt-auto">
        <button
          type="submit"
          disabled={disabled}
          className="w-full flex items-center justify-center space-x-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 px-6 py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-[#18181b] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={18} />
          <span>Deploy Container</span>
        </button>
      </div>
    </form>
  );
};
