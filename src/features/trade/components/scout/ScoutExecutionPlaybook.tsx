import React, { useState } from 'react';
import { Mail, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';

interface TimelineStep {
  week: string;
  focus: string;
  key_actions: string[];
}

interface ScoutExecutionPlaybookProps {
  playbook: {
    timeline: TimelineStep[];
    outreach_templates: {
      cold_email: string;
      linkedin: string;
      whatsapp: string;
    };
  };
}

type OutreachTab = 'cold_email' | 'linkedin' | 'whatsapp';

const TABS: { id: OutreachTab; label: string; icon: typeof Mail }[] = [
  { id: 'cold_email', label: 'Email', icon: Mail },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

export const ScoutExecutionPlaybook: React.FC<ScoutExecutionPlaybookProps> = ({ playbook }) => {
  const [activeTab, setActiveTab] = useState<OutreachTab>('cold_email');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const content = playbook?.outreach_templates?.[activeTab] ?? '';
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasTimeline = playbook?.timeline?.length > 0;
  const hasOutreach = !!(playbook?.outreach_templates?.cold_email || playbook?.outreach_templates?.linkedin);
  const currentTemplate = playbook?.outreach_templates?.[activeTab] ?? '';

  return (
    <div className="px-8 lg:px-16 py-16 bg-[#020617]">
      {/* Section header */}
      <div className="mb-10">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Execution Roadmap</div>
        <h2 className="text-2xl font-black tracking-tight text-white">90-Day Playbook</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">

        {/* Timeline */}
        {hasTimeline && (
          <div className="flex-1 min-w-0">
            <div className="relative space-y-8">
              {/* Vertical spine */}
              <div className="absolute left-[19px] top-8 bottom-8 w-px bg-white/5" />

              {playbook.timeline.map((step, idx) => (
                <div key={idx} className="relative flex gap-6 group">
                  {/* Node */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10
                    text-xs font-black font-mono transition-all duration-300
                    ${idx === 0
                      ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                      : 'bg-slate-900 border border-white/10 text-white/30 group-hover:border-blue-500/30 group-hover:text-white/60'
                    }
                  `}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5 flex-1 min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/60 mb-1">{step.week}</div>
                    <h4 className="text-base font-black text-white mb-3 group-hover:text-blue-300 transition-colors">{step.focus}</h4>
                    {step.key_actions?.length > 0 && (
                      <ul className="space-y-2">
                        {step.key_actions.map((action, i) => (
                          <li key={i} className="text-xs text-white/35 flex gap-2 leading-snug group-hover:text-white/50 transition-colors">
                            <span className="text-emerald-500/50 shrink-0 mt-0.5">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outreach Templates */}
        {hasOutreach && (
          <div className="lg:w-[420px] shrink-0">
            <div className="mb-6">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/60 mb-1">Outreach Templates</div>
              <h3 className="text-base font-black text-white">Buyer Communication</h3>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-white/5">
                {TABS.filter(t => !!playbook?.outreach_templates?.[t.id]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all
                      ${activeTab === tab.id
                        ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500'
                        : 'text-white/25 hover:text-white/50'}
                    `}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Template content */}
              <div className="relative">
                <pre className="p-5 text-[11px] text-white/50 leading-relaxed font-mono whitespace-pre-wrap h-[280px] overflow-y-auto bg-black/20">
                  {currentTemplate || '—'}
                </pre>

                {currentTemplate && (
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-[10px] font-bold text-white/50 hover:text-white hover:border-white/20 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
