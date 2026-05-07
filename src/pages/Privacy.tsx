import React from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, Lock, HardDrive, Cookie, Share2, UserCheck, History, ScrollText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy = () => {
  const sections = [
    {
      title: "1. Introduction",
      icon: Shield,
      content: "At MetaMatrix, your privacy is not just a policy—it's a core design principle. We are committed to protecting your personal data and providing transparency about how we handle information in our AI ecosystems."
    },
    {
      title: "2. Information Collected",
      icon: Eye,
      content: "We collect account data (email, authentication tokens), usage data (generated metadata, processing logs), and technical telemetry (IP address, browser version, device identifiers) to ensure stable service delivery."
    },
    {
      title: "3. How Data is Used",
      icon: ScrollText,
      content: "Data is utilized strictly to provide our core AI services, resolve technical issues, enforce usage limits, and maintain platform security. We do not use your private data to train public AI models without explicit consent."
    },
    {
      title: "4. File Handling",
      icon: HardDrive,
      content: "Files uploaded for processing are handled in secure, temporary buffers. While metadata generated is stored in your workspace, original files are typically discarded after processing unless your specific plan requires cloud archival."
    },
    {
      title: "5. Cookies & Local Storage",
      icon: Cookie,
      content: "We use secure local storage and essential cookies to maintain your session state, remember your theme preferences, and provide consistent authentication across the platform."
    },
    {
      title: "6. Data Security",
      icon: Lock,
      content: "All data transmissions are encrypted via industry-standard protocols. We utilize token-based authentication and restricted database access levels to prevent unauthorized entry to your workspace."
    },
    {
      title: "7. Data Sharing",
      icon: Share2,
      content: "MetaMatrix does not sell user data to third parties. Information is only shared when legally mandated by law enforcement or when necessary to process payments through our secure financial partners."
    },
    {
      title: "8. User Rights",
      icon: UserCheck,
      content: "You retain full ownership of your data. You may request account deletion, export your generated records, or stop using the service at any time. We respond to all data access requests within standard legal timeframes."
    },
    {
      title: "9. Retention Policy",
      icon: History,
      content: "System logs are maintained for monitoring and security audits. Inactive account data is periodically purged according to our maintenance schedule to ensure we only keep what is necessary."
    },
    {
      title: "10. Changes to Policy",
      icon: Shield,
      content: "This Privacy Policy may be updated to reflect changes in our technology or legal environment. We will notify you of any material changes through platform announcements."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0314] text-[#F1F5F9] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors mb-12 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Lock className="w-3 h-3" />
            Privacy Framework
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white via-emerald-200 to-slate-400 text-transparent bg-clip-text">
            Privacy Policy
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Your trust is our most valuable asset. We build our platform with transparency 
            at the forefront, ensuring your digital footprint is protected by world-class security.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1A0B2E]/50 border border-white/5 rounded-2xl p-8 hover:border-emerald-500/20 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                  {section.icon && <section.icon className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-white">
                    {section.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-6">
            <Link 
              to="/terms"
              className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
            >
              Terms of Service
            </Link>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            <Link 
              to="/login"
              className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
            >
              System Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
