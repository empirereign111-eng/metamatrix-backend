import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Database, Info, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Models = () => {
  const models = [
    {
      name: "Gemini 3.1 Pro",
      recommended: false,
      bestFor: "Works on Free API (high errors). Recommended on Paid API.",
      safeMode: "1 generation per request",
      turboMode: "2 generations per request",
      icon: <Cpu className="w-6 h-6 text-emerald-400" />,
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "Gemini 3 Flash",
      recommended: false,
      bestFor: "Balanced speed and performance",
      safeMode: "2 generations per request",
      turboMode: "3 generations per request",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-400 to-amber-500"
    },
    {
      name: "Gemini 3.1 Flash Lite Preview",
      recommended: false, 
      bestFor: "Stability bulk process with fast speed less time.",
      safeMode: "2 generations per request",
      turboMode: "3 generations per request",
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      color: "from-blue-400 to-cyan-500",
      badge: "Stable Performance"
    },
    {
      name: "Gemini 1.5 Flash / 2.5 Flash",
      recommended: true,
      bestFor: "Recommended if processing many files.",
      safeMode: "3 generations per request",
      turboMode: "4 generations per request (Fastest)",
      icon: <Database className="w-6 h-6 text-purple-400" />,
      color: "from-purple-400 to-fuchsia-500",
      badge: "Recommended & Fastest"
    },
    {
      name: "Grok AI",
      recommended: false,
      bestFor: "Advanced AI usage (paid only)",
      safeMode: "2 generations per request",
      turboMode: "3 generations per request",
      icon: <Cpu className="w-6 h-6 text-indigo-400" />,
      color: "from-indigo-400 to-violet-500",
      badge: "Paid API Required"
    },
    {
      name: "Mixtral AI",
      recommended: false,
      bestFor: "Free usage with decent performance",
      safeMode: "2 generations per request",
      turboMode: "3 generations per request",
      icon: <Zap className="w-6 h-6 text-orange-400" />,
      color: "from-orange-400 to-red-500",
      badge: "Free API Supported"
    }
  ];

  return (
    <div className="min-h-screen bg-[#020005]">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-pink-600/5 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
              Model Guide & Usage Limits
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Choose the right model based on speed, stability, and number of files <br className="hidden md:block"/> (batch processing).
            </p>
          </motion.div>
        </div>

        {/* Process Mode Explanation */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.1 }}
             className="bg-[#05000A] border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center space-x-3 mb-4">
                 <ShieldCheck className="w-8 h-8 text-emerald-400" />
                 <h2 className="text-2xl font-bold text-white">Safe Mode</h2>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                  <span>Lower API usage</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                  <span>More stable</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                  <span>Fewer errors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                  <span className="text-emerald-400 font-medium">Recommended for reliability</span>
                </li>
              </ul>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="bg-[#05000A] border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/40 transition-colors"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center space-x-3 mb-4">
                 <Zap className="w-8 h-8 text-orange-400" />
                 <h2 className="text-2xl font-bold text-white">Turbo Mode</h2>
              </div>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" />
                  <span>Faster processing</span>
                </li>
                <li className="flex items-start">
                  <Zap className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" />
                  <span>More outputs per request</span>
                </li>
                <li className="flex items-start">
                  <ShieldAlert className="w-5 h-5 text-red-400 mr-2 shrink-0 mt-0.5" />
                  <span>May hit API limits</span>
                </li>
                <li className="flex items-start">
                  <ShieldAlert className="w-5 h-5 text-red-400 mr-2 shrink-0 mt-0.5" />
                  <span className="text-orange-400 font-medium">Can cause errors with many files</span>
                </li>
              </ul>
           </motion.div>
        </div>

        {/* Models Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-[#05000A] p-6 rounded-[20px] border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${model.color} bg-opacity-10`}>
                    {model.icon}
                  </div>
                  {model.badge && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {model.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{model.name}</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{model.bestFor}</p>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Safe Mode</p>
                    <p className="text-sm text-emerald-400 font-medium">{model.safeMode}</p>
                  </div>
                  
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Turbo Mode</p>
                    <p className="text-sm text-orange-400 font-medium">{model.turboMode}</p>
                  </div>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[22px] opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500 -z-10"></div>
            </motion.div>
          ))}
        </div>

        {/* API Notice block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
           <div className="flex items-start space-x-4">
             <Info className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
             <div>
               <h3 className="text-purple-300 font-semibold mb-1">API Usage Notice (Free APIs)</h3>
               <p className="text-slate-300 text-sm">
                 If you are using free API keys, the more API keys you add, the better performance you will get. However, it is highly recommended to use API keys from <span className="font-bold text-purple-400">different Gmail accounts</span>. Try to avoid using multiple API keys generated from the same Gmail account to prevent rate limits and ensure smooth processing.
               </p>
             </div>
           </div>
        </motion.div>

      </div>
    </div>
  );
};
