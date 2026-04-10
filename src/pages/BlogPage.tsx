import React from 'react';
import { Typography, Container, Chip } from '@mui/material';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { blogArticles } from '@/features/blog/blogData';
import { SEOManager } from '@/components/SEOManager';
import { Calendar, User } from 'lucide-react';

export const BlogPage: React.FC = () => {
    return (
        <div className="py-8">
            <SEOManager
                title="Intelligence Journal | Macro Research & Analysis"
                description="Institutional-grade macro research, de-dollarization trackers, and India real-economy analysis."
                keywords={['Macro Research', 'India Economy', 'De-dollarization', 'Gold Ratio', 'Institutional Intelligence']}
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": "GraphiQuestor Intelligence Journal",
                    "description": "Institutional-grade macro research focusing on structural monetary shifts, sovereign risk, and emerging market credit cycles.",
                    "url": "https://graphiquestor.com/blog",
                    "publisher": {
                        "@type": "Organization",
                        "name": "GraphiQuestor",
                        "logo": "https://graphiquestor.com/logo.png"
                    },
                    "mainEntity": {
                        "@type": "ItemList",
                        "itemListElement": blogArticles.map((article, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "url": `https://graphiquestor.com/blog/${article.slug}`
                        }))
                    }
                }}
            />

            <Container maxWidth="lg">
                <div className="mb-12 text-center">
                    <Typography variant="h3" className="font-black tracking-heading mb-2">
                        Intelligence <span style={{ color: '#3b82f6' }}>Journal</span>
                    </Typography>
                    <Typography variant="body1" className="text-muted-foreground mx-auto mb-4" style={{ maxWidth: 600 }}>
                        Deep-dive analysis on the structural shifts reshaping the global monetary order and the physical economy.
                    </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {blogArticles.map((article) => (
                        <div key={article.id}>
                            <Link to={`/blog/${article.slug}`} className="block h-full">
                                <Card variant="elevated" className="h-full p-8 flex flex-col border-border/50 duration-300 hover:-translate-y-1 hover:border-primary">
                                    <div className="flex gap-1 mb-2">
                                        <Chip
                                            label={article.category}
                                            size="small"
                                            className="bg-blue-500/10 text-blue-500 font-extrabold text-xs rounded-sm"
                                        />
                                    </div>

                                    <Typography variant="h5" className="font-extrabold mb-2 leading-tight">
                                        {article.title}
                                    </Typography>

                                    <Typography variant="body2" className="text-muted-foreground mb-3 flex-grow">
                                        {article.description}
                                    </Typography>

                                    <div className="flex items-center gap-6 text-muted-foreground mt-auto">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <Typography variant="caption" className="font-semibold">{article.date}</Typography>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            <Typography variant="caption" className="font-semibold">{article.author}</Typography>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    );
};
