import React from 'react';
import { FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { analyzeSEO } from '../utils/seoAnalyzer';

interface Props {
  title: string;
  description: string;
  tags: string;
  category: string;
}

export const SEOAnalyzer: React.FC<Props> = ({ title, description, tags, category }) => {
  const analysis = analyzeSEO(title, description, tags, category);

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-[#0B0314]/80 backdrop-blur-md border border-[#8B5CF6]/30 rounded-xl p-4 mt-3 w-full max-h-[400px] overflow-y-auto flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0B0314]/90 backdrop-blur-md pb-3 z-10 border-b border-[#8B5CF6]/20">
        <div className="flex items-center gap-2 text-[#22D3EE] font-bold text-sm uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          SEO Analysis
        </div>
        <div className={`text-2xl font-black ${getScoreColor(analysis.score, 100)} drop-shadow-md`}>
          {analysis.score}<span className="text-sm text-slate-500 font-medium">/100</span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        <div className="bg-[#1A0B2E]/50 p-2 rounded-lg border border-[#8B5CF6]/20 text-center shadow-inner">
          <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Title</p>
          <p className={`text-sm font-black ${getScoreColor(analysis.titleScore, 30)}`}>{analysis.titleScore}</p>
        </div>
        <div className="bg-[#1A0B2E]/50 p-2 rounded-lg border border-[#8B5CF6]/20 text-center shadow-inner">
          <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Tags</p>
          <p className={`text-sm font-black ${getScoreColor(analysis.tagScore, 30)}`}>{analysis.tagScore}</p>
        </div>
        <div className="bg-[#1A0B2E]/50 p-2 rounded-lg border border-[#8B5CF6]/20 text-center shadow-inner">
          <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Cat</p>
          <p className={`text-sm font-black ${getScoreColor(analysis.categoryScore, 20)}`}>{analysis.categoryScore}</p>
        </div>
        <div className="bg-[#1A0B2E]/50 p-2 rounded-lg border border-[#8B5CF6]/20 text-center shadow-inner">
          <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Intent</p>
          <p className={`text-sm font-black ${getScoreColor(analysis.intentScore, 20)}`}>{analysis.intentScore}</p>
        </div>
      </div>
      
      {analysis.weakWords.length > 0 && (
        <div className="space-y-2 mb-5 bg-rose-500/5 border border-rose-500/20 rounded-lg p-3">
          <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
            <AlertCircle className="w-3.5 h-3.5" /> Weak words detected:
          </p>
          <div className="space-y-2">
            {analysis.weakWords.map((w, i) => (
              <div key={i} className="text-[11px] text-[#CBD5F5] pl-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{w.word}</span> 
                <span className="text-slate-500 hidden sm:inline">→</span>
                <div className="flex flex-wrap gap-1.5">
                  {w.alternatives.map((alt, j) => (
                    <span key={j} className="px-1.5 py-0.5 bg-[#8B5CF6]/10 rounded text-[10px] border border-[#8B5CF6]/30 text-[#C4B5FD]">{alt}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(analysis.issues.length > 0 || analysis.suggestions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.issues.length > 0 && (
            <div className="space-y-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <Info className="w-3.5 h-3.5" /> Issues to fix:
              </p>
              <div className="space-y-1.5">
                {analysis.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-[#CBD5F5] text-[11px] leading-relaxed">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.suggestions.length > 0 && (
            <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> Optimization Tips:
              </p>
              <div className="space-y-1.5">
                {analysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-[#CBD5F5] text-[11px] leading-relaxed">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
