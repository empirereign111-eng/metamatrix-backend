import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export const Pricing = () => {
  const { token } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePlanRequest = async (planName: string, planDuration: string) => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoadingPlan(planName);
    setToastMessage(null);

    const message = `I want to purchase ${planName} (${planDuration})`;
    const whatsappUrl = `https://wa.me/8801861656627?text=${encodeURIComponent(message)}`;

    try {
      const response = await fetch('/api/request-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planName })
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        throw new Error('Invalid response');
      }
      
      if (response.ok) {
        window.open(whatsappUrl, '_blank');
        setToastMessage(`Request initiated for ${planName}. Please complete your purchase on WhatsApp.`);
      } else {
        setToastMessage(data.error || 'Failed to request plan');
      }
    } catch (error) {
      setToastMessage('An error occurred while requesting the plan.');
    } finally {
      setLoadingPlan(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const plans = [
    {
      name: 'Basic',
      price: '৳0',
      duration: 'Forever',
      features: [
        'Daily limit: 10 files',
        'Access to core features',
        'Requires API key',
        'More API keys = better performance'
      ],
      buttonText: 'Get Started'
    },
    {
      name: 'Starter Access',
      price: '৳199',
      duration: '1 Month',
      features: [
        'Monthly limit: 2000 files',
        'Requires API key',
        'Add multiple API keys for smoother performance'
      ],
      buttonText: 'Choose Plan'
    },
    {
      name: 'Growth Access',
      price: '৳499',
      duration: '3 Months',
      features: [
        'Total limit: 7000 files',
        'Requires API key',
        'Better performance with multiple API keys',
        'Optimized for regular users'
      ],
      recommended: true,
      buttonText: 'Choose Plan'
    },
    {
      name: 'Pro Access',
      price: '৳799',
      duration: '6 Months',
      features: [
        'Total limit: 15000 files',
        'Requires API key',
        'Stable performance for heavy usage'
      ],
      buttonText: 'Choose Plan'
    },
    {
      name: 'Elite Access',
      price: '৳1099',
      duration: '1 Year',
      features: [
        'Unlimited usage',
        'Requires API key',
        'Maximum performance potential'
      ],
      buttonText: 'Choose Plan'
    }
  ];

  return (
    <section id="pricing" className="py-24 px-4 max-w-7xl mx-auto w-full relative">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Power Level</span>
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Flexible tiers designed for your metadata automation needs.
        </p>
      </div>

      {toastMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg shadow-purple-500/20 text-sm font-medium animate-fadeIn">
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`relative p-6 rounded-3xl bg-[#1A0B2E]/50 border backdrop-blur-sm flex flex-col ${
              plan.recommended 
                ? 'border-purple-400 shadow-[0_0_30px_-10px_rgba(168,85,247,0.4)]' 
                : 'border-white/10 hover:border-purple-500/50 transition-colors'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/25">
                  <Star className="w-3 h-3 fill-current" />
                  Recommended
                </span>
              </div>
            )}

            <div className="mb-6 h-[100px]">
              <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
              </div>
              <p className="text-sm text-purple-300 font-medium">{plan.duration}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlanRequest(plan.name, plan.duration)}
              disabled={loadingPlan === plan.name}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                plan.recommended
                  ? 'bg-[#25D366] text-white hover:bg-[#1DA851] hover:shadow-lg hover:shadow-[#25D366]/25'
                  : 'bg-white/5 text-white hover:bg-[#25D366] border border-white/10 hover:border-[#25D366]'
              } disabled:opacity-50`}
            >
              <WhatsAppIcon className="w-5 h-5" />
              {loadingPlan === plan.name ? 'Requesting...' : (plan as any).buttonText || 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
