import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ScrollText, ShieldCheck, Scale, Cpu, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B0314]/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#1A0B2E] border border-purple-500/30 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl relative z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Terms of Service</h3>
                  <p className="text-xs text-slate-400">Effective as of May 5, 2026</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-purple-600/30 scrollbar-track-transparent">
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400 uppercase text-[10px] font-black tracking-widest">
                  <Cpu className="w-3 h-3" />
                  Core Agreement
                </div>
                <h4 className="text-lg font-bold text-white">Platform Usage & AI Services</h4>
                <p className="text-slate-400 leading-relaxed text-sm">
                  MetaMatrix provides high-performance AI tools for analysis and automation. By creating an account, you agree to use these services legally and responsibly. AI outputs are probabilistic and should be reviewed for accuracy before being used in critical decision-making.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 uppercase text-[10px] font-black tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  Security & Privacy
                </div>
                <h4 className="text-lg font-bold text-white">Account Responsibility</h4>
                <p className="text-slate-400 leading-relaxed text-sm">
                  User accounts are private. Sharing credentials or exploiting the system's infrastructure will lead to immediate suspension. We process your data to provide AI logic as outlined in our security protocol.
                </p>
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 uppercase text-[10px] font-black tracking-widest">
                  <AlertTriangle className="w-3 h-3" />
                  Limitation of Liability
                </div>
                <h4 className="text-lg font-bold text-white">Service Availability</h4>
                <p className="text-slate-400 leading-relaxed text-sm">
                  We strive for 99.9% uptime but do not guarantee uninterrupted service. MetaMatrix is not liable for data loss or business interruptions caused by platform downtime or model latency.
                </p>
              </section>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-xs text-purple-300 leading-relaxed italic">
                  Note: This is a summary of our primary terms. For the complete legal text including section-by-section breakdown, please visit our full documentation.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-white text-sm"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
