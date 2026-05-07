import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const EPSPluginSetup: React.FC = () => {
  const [gsInstalled, setGsInstalled] = useState<boolean | null>(null);
  const [imInstalled, setImInstalled] = useState<boolean | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      // In a real Electron app, this would use window.electron.invoke
      // For this prototype, we'll simulate the check
      const gsStatus = await (window as any).electron?.invoke('check-gs');
      const imStatus = await (window as any).electron?.invoke('check-im');
      setGsInstalled(gsStatus);
      setImInstalled(imStatus);
    } catch (e) {
      console.error("Failed to check status", e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      const result = await (window as any).electron?.invoke('install-eps-tools');
      if (result.success) {
        await checkStatus();
      } else {
        setError(result.message || 'Installation failed');
      }
    } catch (e) {
      setError('Installation execution failed: ' + e);
    } finally {
      setInstalling(false);
    }
  };

  const isReady = gsInstalled && imInstalled;

  return (
    <div className="bg-[#0B0314]/80 backdrop-blur-md border border-[#8B5CF6]/30 rounded-xl p-4 mt-3 w-full shadow-inner">
      <div className="flex items-center gap-2 text-[#22D3EE] font-bold text-sm uppercase tracking-wider mb-4">
        <Download className="w-4 h-4" />
        EPS Preview Setup
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Ghostscript</span>
          {gsInstalled === null ? <Loader2 className="w-4 h-4 animate-spin" /> : gsInstalled ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
        </div>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>ImageMagick</span>
          {imInstalled === null ? <Loader2 className="w-4 h-4 animate-spin" /> : imInstalled ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
        </div>
      </div>

      {!isReady && (
        <button 
          onClick={handleInstall}
          disabled={installing}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7c4ae3] text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
        >
          {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {installing ? 'Installing...' : 'Download & Install EPS Support'}
        </button>
      )}

      {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
      
      {isReady && (
        <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
          <CheckCircle className="w-4 h-4" /> EPS Preview Ready ✔
        </div>
      )}
    </div>
  );
};
