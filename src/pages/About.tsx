import React from 'react';
import { Target, Zap, Shield, Sparkles, MessageCircle, Layers, Fingerprint, BarChart } from 'lucide-react';

export const About = () => {
  return (
    <section id="about" className="py-24 px-4 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          The Hub of <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Intelligent Workflows</span>
        </h2>
        <p className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
          Welcome to a smarter way to manage your visual assets. We leverage cutting-edge AI to automate the tedious tasks of metadata generation. Our platform guarantees speed, absolute automation, and unmatched simplicity—so you can focus on creativity, not data entry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        <div className="p-8 rounded-3xl bg-[#1A0B2E]/50 border border-purple-500/20 backdrop-blur-sm">
          <div className="mb-6 inline-flex p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Target className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
          <p className="text-slate-400 leading-relaxed">
            To drastically simplify the image workflow for creators and digital businesses. We aim to boost your productivity by completely eliminating manual tagging and metadata formatting.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#1A0B2E]/50 border border-pink-500/20 backdrop-blur-sm">
          <div className="mb-6 inline-flex p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <Sparkles className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
          <p className="text-slate-400 leading-relaxed">
            To construct the most powerful, highly accessible AI utility for visual data analysis. We envision a world where digital asset management operates seamlessly at light-speed.
          </p>
        </div>
      </div>

      <div className="mb-24">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-white mb-4">Core Values</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">Innovation</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Constantly pushing the boundaries of what AI can achieve in workflow automation, ensuring you always have the most advanced tools.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <Shield className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">Trust</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Reliability built directly into our infrastructure. Your data and processing requirements are handled with the highest level of stability.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <Fingerprint className="w-8 h-8 text-purple-400 mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">Quality</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Refusing to compromise on the final output. Every piece of generated metadata meets stringent SEO and context standards.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
        <div className="order-2 lg:order-1">
          <h3 className="text-3xl font-bold text-white mb-8">Platform Features</h3>
          <ul className="space-y-6">
            <li className="flex items-center gap-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Smart metadata generation</h4>
                <p className="text-slate-400 text-sm">Context-aware algorithms that understand visual elements.</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Bulk image handling</h4>
                <p className="text-slate-400 text-sm">Process thousands of photos without bottlenecks.</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">SEO-focused output</h4>
                <p className="text-slate-400 text-sm">Optimized titles and keywords designed for discoverability.</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Desktop-based workflow</h4>
                <p className="text-slate-400 text-sm">A seamless environment tailored for professional desktop setups.</p>
              </div>
            </li>
            <li className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-lg">Performance tracking</h4>
                <p className="text-slate-400 text-sm">Monitor your workflow metrics and AI consumption effortlessly.</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="order-1 lg:order-2 p-8 rounded-3xl bg-gradient-to-br from-purple-900/40 to-[#0F051D] border border-purple-500/30 flex flex-col items-center justify-center text-center shadow-[0_0_50px_-15px_rgba(168,85,247,0.3)] min-h-[400px]">
          <MessageCircle className="w-16 h-16 text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <h3 className="text-2xl font-bold text-white mb-2">Need a tailored solution?</h3>
          <p className="text-slate-400 mb-8 max-w-sm">
            Reach out to our business support team. We're ready to discuss your specific infrastructure scaling.
          </p>
          
          <div className="p-6 bg-black/30 rounded-2xl border border-white/5 w-full max-w-sm">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Business Support (WhatsApp)</span>
            <span className="block text-2xl font-bold text-white mb-6">01861656627</span>
            <a 
              href="https://wa.me/01861656627" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
