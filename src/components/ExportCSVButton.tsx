import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/utils/exportCSV';

interface ExportCSVButtonProps {
    data: any[];
    filename: string;
    label?: string;
    className?: string;
}

export const ExportCSVButton: React.FC<ExportCSVButtonProps> = ({
    data,
    filename,
    label = "EXPORT CSV",
    className
}) => {
    const handleExport = () => {
        if (!data || data.length === 0) {
            console.warn("No data available to export.");
            return;
        }
        exportToCSV(data, filename);
    };

    return (
        <button
            onClick={handleExport}
            disabled={!data || data.length === 0}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/12 text-xs font-black text-muted-foreground transition-all",
                (!data || data.length === 0) 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:text-primary hover:bg-white/10 active:scale-95 cursor-pointer",
                className
            )}
            title="Export data to CSV"
        >
            <Download size={14} className={(!data || data.length === 0) ? "" : "text-blue-400"} />
            {label}
        </button>
    );
};
