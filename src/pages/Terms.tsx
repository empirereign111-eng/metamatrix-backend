import React from 'react';
import { motion } from 'motion/react';
import { Shield, Scale, ScrollText, AlertCircle, Lock, Cpu, Database, CreditCard, UserCheck, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms = () => {
  const sections = [
    {
      title: "1. Service Description",
      icon: Cpu,
      content: "MetaMatrix provides an advanced AI-powered platform for data analysis, pattern recognition, and workflow automation. Our services are provided 'as is' and 'as available', leveraging state-of-the-art machine learning models to assist you in your projects."
    },
    {
      title: "2. User Responsibilities",
      icon: UserCheck,
      content: "By using MetaMatrix, you agree to provide accurate information and maintain the security of your account. You are responsible for all activities that occur under your account and must notify us immediately of any unauthorized use."
    },
    {
      title: "3. Usage Limits",
      icon: Scale,
      content: "To ensure fair access for all users, we may implement usage limits on API calls, storage, and processing power. Attempting to bypass these limits or reverse-engineer our proprietary systems is strictly prohibited."
    },
    {
      title: "4. Subscription & Plan Rules",
      icon: CreditCard,
      content: "Subscriptions are billed according to the plan selected. You may change or cancel your plan at any time, with changes taking effect at the start of the next billing cycle. No refunds are provided for partial subscription periods."
    },
    {
      title: "5. Account Security",
      icon: Lock,
      content: "You are responsible for safeguarding your login credentials. We recommend using strong, unique passwords and avoiding sharing access with third parties. MetaMatrix is not liable for losses resulting from negligent account management."
    },
    {
      title: "6. AI Output Disclaimer",
      icon: AlertCircle,
      content: "MetaMatrix utilizes artificial intelligence to generate insights and automate tasks. While we strive for high accuracy, AI outputs should be verified by humans. We are not responsible for decisions made based solely on AI-generated data."
    },
    {
      title: "7. Data Handling & Privacy",
      icon: Database,
      content: "Your data privacy is paramount. We process information in accordance with our Privacy Policy. By using our service, you grant us the limited rights necessary to process your data for the sole purpose of providing and improving our services."
    },
    {
      section: "8. Abuse Policy",
      icon: Shield,
      content: "Illegal activities, harassment, or transmitting malicious code are strictly forbidden. We reserve the right to investigate and take action against any behavior that violates our community standards or compromises platform integrity."
    },
    {
      title: "9. Suspension & Termination",
      icon: RefreshCcw,
      content: "We range from temporary suspension to permanent account termination for violations of these terms. Users may also terminate their accounts at any time through the workspace settings."
    },
    {
      title: "10. Changes to Terms",
      icon: ScrollText,
      content: "MetaMatrix may update these terms periodically. Significant changes will be communicated via email or platform notifications. Continued use of the platform after updates constitutes acceptance of the new terms."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0314] text-[#F1F5F9] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
            <ScrollText className="w-3 h-3" />
            Legal Documentation
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-slate-400 text-transparent bg-clip-text">
            Terms & Conditions
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Please read these terms carefully before using the MetaMatrix platform. 
            By accessing our services, you agree to be bound by these legal requirements.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1A0B2E]/50 border border-white/5 rounded-2xl p-8 hover:border-purple-500/20 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                  {section.icon && <section.icon className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-3 text-white">
                    {section.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all text-purple-300"
          >
            Return to Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
