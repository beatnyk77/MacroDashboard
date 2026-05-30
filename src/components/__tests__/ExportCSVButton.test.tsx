import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportCSVButton } from '../ExportCSVButton';
import { exportToCSV } from '@/utils/exportCSV';

// Mock the exportToCSV utility
vi.mock('@/utils/exportCSV', () => ({
    exportToCSV: vi.fn(),
}));

describe('ExportCSVButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders correctly with default label', () => {
        render(<ExportCSVButton data={[{ a: 1 }]} filename="test" />);
        expect(screen.getByText('EXPORT CSV')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
        render(<ExportCSVButton data={[{ a: 1 }]} filename="test" label="DOWNLOAD ME" />);
        expect(screen.getByText('DOWNLOAD ME')).toBeInTheDocument();
    });

    it('calls exportToCSV with data and filename when clicked', () => {
        const testData = [{ id: 1, name: 'Test' }];
        render(<ExportCSVButton data={testData} filename="test_file" />);
        
        const button = screen.getByRole('button');
        fireEvent.click(button);
        
        expect(exportToCSV).toHaveBeenCalledWith(testData, 'test_file');
    });

    it('is disabled and does not call exportToCSV if data is empty', () => {
        render(<ExportCSVButton data={[]} filename="empty_test" />);
        
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(exportToCSV).not.toHaveBeenCalled();
    });

    it('is disabled and does not call exportToCSV if data is null', () => {
        // @ts-expect-error intentionally passing null to test disabled state
        render(<ExportCSVButton data={null} filename="null_test" />);
        
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        
        fireEvent.click(button);
        expect(exportToCSV).not.toHaveBeenCalled();
    });
});
