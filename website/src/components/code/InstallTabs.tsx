import { useState } from 'react';
import { INSTALL_COMMANDS } from '../../lib/constants';
import { CopyButton } from '../common/CopyButton';

type PackageManager = keyof typeof INSTALL_COMMANDS;

export function InstallTabs() {
  const [activeTab, setActiveTab] = useState<PackageManager>('npm');

  return (
    <div className="rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
      <div className="flex border-b border-zinc-800">
        {(Object.keys(INSTALL_COMMANDS) as PackageManager[]).map((pm) => (
          <button
            key={pm}
            onClick={() => setActiveTab(pm)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === pm
                ? 'bg-zinc-800 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {pm}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <code className="text-sm text-zinc-100 font-mono">
          {INSTALL_COMMANDS[activeTab]}
        </code>
        <CopyButton text={INSTALL_COMMANDS[activeTab]} />
      </div>
    </div>
  );
}
