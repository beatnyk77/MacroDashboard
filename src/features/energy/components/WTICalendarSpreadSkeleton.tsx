import React from 'react';
import { Fuel, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const WTICalendarSpreadSkeleton: React.FC = () => {
    return (
        <Card className="bg-background/40 border-border backdrop-blur-xl overflow-hidden rounded-xl animate-pulse">
            {/* Header / Meta Bar */}
            <div className="flex flex-wrap items-center justify-between px-8 py-3 bg-white/[0.02] border-b border-border gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Activity size={10} className="text-white/10" />
                        <div className="h-2 w-24 bg-white/5 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-white/5 rounded-full" />
                    <div className="h-4 w-24 bg-white/5 rounded" />
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                        <div className="h-2 w-12 bg-white/5 rounded" />
                        <div className="h-3 w-20 bg-white/10 rounded" />
                    </div>
                    <div className="h-8 w-24 bg-white/5 rounded-lg" />
                </div>
            </div>

            <CardHeader className="p-8 pb-0 border-b border-border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/5">
                            <Fuel className="w-5 h-5 text-white/10" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-6 w-64 bg-white/10 rounded" />
                            <div className="h-3 w-48 bg-white/5 rounded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right space-y-1">
                            <div className="h-2 w-16 bg-white/5 rounded ml-auto" />
                            <div className="h-8 w-24 bg-white/10 rounded" />
                        </div>
                        <div className="h-16 w-32 bg-white/5 rounded-xl" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 rounded-xl bg-white/[0.02] border border-border space-y-4">
                            <div className="h-2 w-24 bg-white/5 rounded" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex justify-between items-end border-b border-border pb-2">
                                        <div className="h-3 w-20 bg-white/5 rounded" />
                                        <div className="h-4 w-12 bg-white/10 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 rounded-xl bg-white/5 border border-border h-24" />
                    </div>
                    <div className="lg:col-span-3 h-[400px] bg-white/[0.02] rounded-xl flex items-center justify-center">
                        <Activity className="w-8 h-8 text-white/5 animate-pulse" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
