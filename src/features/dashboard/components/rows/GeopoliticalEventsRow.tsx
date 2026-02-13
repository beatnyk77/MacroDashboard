import React, { Suspense } from 'react';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EventsMap } from '@/features/dashboard/components/maps/EventsMap';
import { SectionHeader } from '@/components/SectionHeader';

export const GeopoliticalEventsRow: React.FC = () => {
    return (
        <div className="space-y-12">
            <SectionHeader
                title="Geopolitical Event Matrix"
                subtitle="Live satellite & news feed tracking of global conflict markers"
                sectionId="geo-matrix"
            />
            <SectionErrorBoundary name="Geopolitical Map Row">
                <Suspense fallback={<div className="h-[600px] w-full animate-pulse bg-white/5 rounded-3xl" />}>
                    <EventsMap className="h-[600px] w-full" />
                </Suspense>
            </SectionErrorBoundary>
        </div>
    );
};
