import React from 'react';
import { Card } from '@/components/ui/card';
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
    <div className="px-8 lg:px-12 py-20 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Timeline */}
          <div className="flex-1">
            <h2 className="text-3xl font-black tracking-tight font-syne text-slate-900 mb-8">90-Day Execution Roadmap</h2>
            <div className="space-y-8 relative">
              {/* Vertical Line */}
              <div className="absolute left-[21px] top-4 bottom-4 w-px bg-slate-100" />
              
              {playbook.timeline.map((step, idx) => (
                <div key={idx} className="relative flex gap-8 group">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white transition-colors
                    ${idx === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400'}
                  `}>
                    <span className="text-xs font-black">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{step.week}</div>
                    <h4 className="font-bold text-slate-900 text-lg mb-2">{step.focus}</h4>
                    <ul className="space-y-2">
                      {step.key_actions.map((action, i) => (
                        <li key={i} className="text-sm text-slate-500 flex gap-2">
                          <span className="text-blue-400">→</span>
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
          <div className="lg:w-1/3">
            <h2 className="text-3xl font-black tracking-tight font-syne text-slate-900 mb-8">Global Outreach</h2>
            <Card className="bg-slate-50 border-slate-200 rounded-3xl p-6 overflow-hidden">
              <Tabs defaultValue="email">
                <TabsList className="grid grid-cols-3 gap-2 bg-transparent p-0 mb-6">
                  <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-2">
                    <Mail className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="linkedin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-2">
                    <Linkedin className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl py-2">
                    <MessageCircle className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Executive Cold Outreach</div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                    {playbook.outreach_templates.cold_email}
                  </div>
                </TabsContent>
                
                <TabsContent value="linkedin">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">LinkedIn Direct Message</div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                    {playbook.outreach_templates.linkedin}
                  </div>
                </TabsContent>
                
                <TabsContent value="whatsapp">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Intro</div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                    {playbook.outreach_templates.whatsapp}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8 p-4 bg-blue-600 rounded-2xl text-white text-center">
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Ready to Deploy?</div>
                <button className="text-sm font-bold hover:underline transition-all">Copy Selected Template</button>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};
