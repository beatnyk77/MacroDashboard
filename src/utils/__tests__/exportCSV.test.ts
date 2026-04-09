import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV } from '../exportCSV';

describe('exportToCSV', () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset console.warn mock
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock URL.createObjectURL
        mockCreateObjectURL = vi.fn(() => 'blob:test-url');
        window.URL.createObjectURL = mockCreateObjectURL as any;

        // Mock document methods
        mockAppendChild = vi.fn();
        mockRemoveChild = vi.fn();
        document.body.appendChild = mockAppendChild as any;
        document.body.removeChild = mockRemoveChild as any;
    });

    it('warns and returns if data is empty', () => {
        exportToCSV([], 'test');
        expect(console.warn).toHaveBeenCalledWith('No data to export');
        expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('warns and returns if data is null', () => {
        exportToCSV(null as any, 'test');
        expect(console.warn).toHaveBeenCalledWith('No data to export');
        expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('creates and triggers download for valid data', () => {
        // Mock anchor element
        const mockClick = vi.fn();
        const mockSetAttribute = vi.fn();
        const mockAnchor = {
            click: mockClick,
            setAttribute: mockSetAttribute,
            style: { visibility: '' }
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

        const data = [
            { a: 1, b: 'hello' },
            { a: 2, b: 'world' }
        ];

        exportToCSV(data, 'testfile');

        expect(mockCreateObjectURL).toHaveBeenCalledOnce();
        
        // Verify createElement ('a')
        expect(document.createElement).toHaveBeenCalledWith('a');

        // Verify attributes
        expect(mockSetAttribute).toHaveBeenCalledWith('href', 'blob:test-url');
        expect(mockSetAttribute).toHaveBeenCalledWith('download', expect.stringMatching(/^testfile_\d{4}-\d{2}-\d{2}\.csv$/));

        // Verify DOM manipulation
        expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockClick).toHaveBeenCalledOnce();
        expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
    });

    it('handles commas in strings and objects', () => {
        const mockClick = vi.fn();
        const mockSetAttribute = vi.fn();
        vi.spyOn(document, 'createElement').mockReturnValue({ click: mockClick, setAttribute: mockSetAttribute, style: {} } as any);
        
        window.URL.createObjectURL = vi.fn(() => 'blob:test') as any;

        const data = [
            { id: 1, text: 'hello, world', obj: { key: 'value' } }
        ];

        exportToCSV(data, 'testfile');
        
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockClick).toHaveBeenCalledOnce();
    });
});
