import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, ChevronDown, RefreshCw, Plus, CheckCircle, X, Copy, Trash2 } from 'lucide-react';
import { Provider, ApiKey } from '../types';

interface ApiKeyManagerProps {
  provider: Provider;
  apiKeys: Record<Provider, ApiKey[]>;
  newKey: string;
  setNewKey: (key: string) => void;
  handleAddKey: () => void;
  handleActivateKey: (id: string) => void;
  handleRemoveKey: (id: string, e: React.MouseEvent) => void;
  resetKeys: () => void;
  isApiKeysVisible: boolean;
  setIsApiKeysVisible: (visible: boolean) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  provider,
  apiKeys,
  newKey,
  setNewKey,
  handleAddKey,
  handleActivateKey,
  handleRemoveKey,
  resetKeys,
  isApiKeysVisible,
  setIsApiKeysVisible
}) => {
  return (
    <>
      <div 
        onClick={() => setIsApiKeysVisible(!isApiKeysVisible)}
        className="flex items-center justify-between p-1.5 bg-[#0B0314] border-colorful-3d rounded-xl cursor-pointer hover:bg-[#8B5CF6]/10 transition-colors shadow-inner"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE] uppercase tracking-wider">
          <Key className="w-4 h-4" />
          Manage {provider.charAt(0).toUpperCase() + provider.slice(1)} API Keys
        </div>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${isApiKeysVisible ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isApiKeysVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#0B0314] border-colorful-3d rounded-xl p-5 space-y-5 shadow-inner relative z-30 mt-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#22D3EE]">
                    <span className="text-[10px] bg-[#8B5CF6]/20 px-2.5 py-1 rounded-md text-[#CBD5F5] border border-[#8B5CF6]/30">
                      {apiKeys[provider].length}/100 Keys
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetKeys();
                      }}
                      className="ml-2 text-[10px] bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 px-2.5 py-1 rounded-md text-[#22D3EE] transition-colors flex items-center gap-1.5 border-colorful-3d"
                      title="Reset all keys to valid state"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Keys
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    placeholder={`Enter new ${provider} API Key`} 
                    className="flex-1 bg-[#1A0B2E]/50 border-colorful-3d rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] text-[#F8FAFC] placeholder-slate-500 shadow-inner transition-all" 
                    type="text" 
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddKey()}
                  />
                  <button 
                    onClick={handleAddKey}
                    disabled={!newKey.trim() || apiKeys[provider].length >= 100}
                    className="btn-primary px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed border-colorful-3d"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {apiKeys[provider].length > 0 && (
                <div className="relative mt-4">
                  <div 
                    className="flex items-center justify-between p-3.5 bg-[#1A0B2E]/50 border-colorful-3d rounded-xl cursor-default shadow-inner"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></div>
                      <span className="text-sm text-[#F8FAFC] font-mono tracking-wider">
                        {apiKeys[provider].find(k => k.isActive)?.key.slice(0, 12)}...{apiKeys[provider].find(k => k.isActive)?.key.slice(-6)}
                      </span>
                      {apiKeys[provider].find(k => k.isActive)?.isValid === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {apiKeys[provider].find(k => k.isActive)?.isValid === false && <X className="w-4 h-4 text-rose-400" />}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {apiKeys[provider].map((apiKey) => (
                      <div 
                        key={apiKey.id}
                        onClick={() => handleActivateKey(apiKey.id)}
                        className={`group flex items-center justify-between p-3.5 cursor-pointer transition-all rounded-xl border-colorful-3d ${apiKey.isActive ? 'bg-[#8B5CF6]/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-[#1A0B2E]/30 hover:bg-[#8B5CF6]/10'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${apiKey.isActive ? 'bg-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-600'}`}></div>
                          <span className={`text-sm font-mono tracking-wider ${apiKey.isActive ? 'text-[#F8FAFC]' : 'text-slate-400'}`}>
                            {apiKey.key.slice(0, 12)}...{apiKey.key.slice(-6)}
                          </span>
                          {apiKey.isValid === true && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {apiKey.isValid === false && <X className="w-4 h-4 text-rose-400" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(apiKey.key);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy Key"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleRemoveKey(apiKey.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
