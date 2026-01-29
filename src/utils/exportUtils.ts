import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportSectionToPNG = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Retina quality
            backgroundColor: '#020617', // Match theme background
            useCORS: true,
            logging: false,
        } as any);

        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error exporting to PNG:', error);
    }
};

export const exportSectionToPDF = async (elementId: string, fileName: string, title?: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#020617',
            useCORS: true,
            logging: false,
        } as any);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width / 2, canvas.height / 2 + 40] // Add space for footer
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Add Footer Metadata
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        pdf.text(`GraphiQuestor Intelligence | Generated: ${date}`, 20, pdfHeight + 20);
        if (title) {
            pdf.text(title, pdfWidth - 20, pdfHeight + 20, { align: 'right' });
        }

        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
    }
};
