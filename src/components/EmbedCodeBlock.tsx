import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Code, Check, Copy } from 'lucide-react';
import { BrandConfig } from '@/config/brandConfig';

interface EmbedCodeBlockProps {
    /** Tool path, e.g. "/tools/net-liquidity-gauge" */
    path: string;
    /** Default iframe height in px */
    height?: number;
}

/**
 * "Get Embed Code" toggle + copyable iframe snippet for embeddable tools.
 * The generated snippet carries ?embed=true (chromeless render, noindex)
 * and utm_source=embed so GA attributes traffic from third-party embeds.
 */
export const EmbedCodeBlock: React.FC<EmbedCodeBlockProps> = ({ path, height = 500 }) => {
    const [showEmbed, setShowEmbed] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const snippet = `<iframe src="${BrandConfig.baseUrl}${path}?embed=true&utm_source=embed" width="100%" height="${height}" frameborder="0" title="${BrandConfig.name} widget"></iframe>`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (e.g. non-secure context) — user can select manually
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
            <Button
                variant="outlined"
                size="small"
                startIcon={<Code size={14} />}
                onClick={() => setShowEmbed(!showEmbed)}
                sx={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.1)', textTransform: 'none', borderRadius: 2 }}
            >
                {showEmbed ? 'Hide Embed Code' : 'Get Embed Code'}
            </Button>

            {showEmbed && (
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'black', border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '440px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                            IFRAME EMBED SNIPPET
                        </Typography>
                        <Button
                            size="small"
                            onClick={handleCopy}
                            startIcon={copied ? <Check size={12} /> : <Copy size={12} />}
                            sx={{ color: copied ? '#10b981' : 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '11px', minWidth: 0 }}
                        >
                            {copied ? 'Copied' : 'Copy'}
                        </Button>
                    </Box>
                    <Box component="pre" sx={{ m: 0, p: 1, fontSize: '10px', color: '#10b981', overflowX: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {snippet}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
