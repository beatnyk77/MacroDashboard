import React from 'react';
import { Mail, Linkedin, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export const ScoutExecutionPlaybook: React.FC<ScoutExecutionPlaybookProps> = ({ playbook }) => {
  return (
    <div className="px-8 lg:px-20 py-32 bg-[#020617]">
      <div className="max-w-[1300px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-24">
          
          {/* Timeline */}
          <div className="flex-1">
            <div className="mb-16">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-6">Strategic Roadmap</h2>
              <h3 className="text-5xl lg:text-6xl font-black tracking-tighter text-white font-syne">90-Day Execution</h3>
            </div>

            <div className="space-y-12 relative">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-white/5" />
              
              {playbook?.timeline?.map((step, idx) => (
                <div key={idx} className="relative flex gap-10 group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 border border-white/10 transition-all duration-500
                    ${idx === 0 ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] scale-110' : 'bg-slate-900 text-white/40 group-hover:border-blue-500/30'}
                  `}>
                    <span className="text-sm font-black font-mono">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="pt-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-2">{step.week}</div>
                    <h4 className="font-black text-white text-2xl mb-4 tracking-tight group-hover:text-blue-400 transition-colors">{step.focus}</h4>
                    <ul className="space-y-3">
                      {step.key_actions.map((action, i) => (
                        <li key={i} className="text-white/40 text-base flex gap-3 group-hover:text-white/60 transition-colors leading-snug">
                          <span className="text-emerald-500 font-black mt-1">→</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach */}
          <div className="lg:w-[450px]">
            <div className="mb-16">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-6">Communication Vectors</h2>
              <h3 className="text-5xl font-black tracking-tighter text-white font-syne">Global Outreach</h3>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] rounded-full" />
              
              <Tabs defaultValue="email" className="relative z-10">
                <TabsList className="grid grid-cols-3 gap-3 bg-white/[0.03] p-1.5 rounded-2xl mb-10 border border-white/5">
                  <TabsTrigger value="email" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300">
                    <Mail className="w-5 h-5" />
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300">
                    <Linkedin className="w-5 h-5" />
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl py-3 transition-all duration-300">
                    <MessageCircle className="w-5 h-5" />
                  </TabsTrigger>
                </TabsList>
                
                {['email', 'linkedin', 'whatsapp'].map((type) => (
                  <TabsContent key={type} value={type}>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-2">
                      {type === 'email' ? 'Executive Cold Outreach' : type === 'linkedin' ? 'Direct Platform Message' : 'Instant Channel Intro'}
                    </div>
                    <div className="bg-black/40 p-8 rounded-3xl border border-white/5 text-sm text-white/70 leading-relaxed font-mono whitespace-pre-wrap shadow-inner h-[400px] overflow-y-auto custom-scrollbar">
                      {playbook?.outreach_templates?.[type === 'email' ? 'cold_email' : type as keyof typeof playbook.outreach_templates]}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              
              <div className="mt-10 p-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300">
                <button className="w-full py-4 bg-slate-900 rounded-[calc(1rem-1px)] text-white font-black uppercase tracking-widest text-xs hover:bg-transparent transition-colors">
                  Copy Strategic Template
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
