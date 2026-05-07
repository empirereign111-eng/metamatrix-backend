import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Image as ImageIcon, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center w-full">
      <div className="px-4 max-w-7xl mx-auto w-full pt-16 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="h-3 w-3" />
            Smart image workflow platform
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto"
        >
          Automate your metadata with <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI precision</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto"
        >
          Supercharge your image processing workflow. Generate SEO-optimized titles, descriptions, and tags in seconds using advanced AI models.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            to="/login"
            className="px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-purple-500/20 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Start Now
          </Link>
          <Link 
            to="/pricing"
            className="px-8 py-4 rounded-xl text-base font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all w-full sm:w-auto"
          >
            Explore Plans
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
        >
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Process hundreds of images in minutes with parallel AI execution." },
            { icon: ImageIcon, title: "Image Optimization", desc: "Auto-detect subjects, styles, and context from any image." },
            { icon: Code2, title: "Perfect Metadata", desc: "Export to CSV, XLSX, JSON, or Adobe XMP automatically." }
          ].map((feature, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="bg-purple-500/10 p-3 rounded-xl mb-4">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
