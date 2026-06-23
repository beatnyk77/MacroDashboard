import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BrandConfig } from '@/config/brandConfig';
import { toAbsoluteUrl, toCanonicalPath } from '@/lib/urlPath';

export type SEOManagerMode = 'layout' | 'page';

interface SEOManagerProps {
    /** `layout` = canonical + robots only; `page` = full meta (default when title set). */
    mode?: SEOManagerMode;
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    ogType?: 'website' | 'article';
    ogLocale?: string;
    /** Explicit canonical override — full URL or path. Wins over auto-generated. */
    canonical?: string;
    /** @deprecated Use `canonical` */
    canonicalUrl?: string;
    publishedTime?: string;
    jsonLd?: Record<string, any> | any[];
    robots?: string;
    isApp?: boolean;
    geoRegion?: string;
    targetCountry?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
    mode,
    title,
    description,
    keywords,
    ogImage = BrandConfig.seo.ogImage,
    ogType = 'website',
    ogLocale = 'en_US',
    canonical,
    canonicalUrl,
    publishedTime,
    jsonLd,
    robots = 'index, follow',
    isApp = false,
    geoRegion = 'GLOBAL',
    targetCountry = 'GLOBAL',
}) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const isEmbedded = searchParams.get('embed') === 'true';
    const isLayoutMode = mode === 'layout' || (title === undefined && description === undefined);
    const shouldApplyTitleTemplate =
        !!title &&
        title !== BrandConfig.seo.defaultTitle &&
        !title.includes(BrandConfig.name);
    const fullTitle = isLayoutMode
        ? undefined
        : shouldApplyTitleTemplate
            ? BrandConfig.seo.titleTemplate.replace('%s', title!)
            : title!;

    const explicitCanonical = canonical ?? canonicalUrl;
    const resolvedCanonical = explicitCanonical
        ? toAbsoluteUrl(explicitCanonical)
        : toAbsoluteUrl(toCanonicalPath(location.pathname));

    const resolvedRobots = isEmbedded && !robots.includes('noindex')
        ? 'noindex, follow'
        : robots;

    return (
        <Helmet defer={false}>
            {!isLayoutMode && (
            <>
            {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema, index) => (
                <script key={`json-ld-${index}`} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}

            {isApp && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "@id": `${BrandConfig.baseUrl}/#software`,
                        "name": `${BrandConfig.name} Macro Intelligence Terminal`,
                        "operatingSystem": "All",
                        "applicationCategory": "FinanceApplication",
                        "description": description,
                        "url": `${BrandConfig.baseUrl}/`,
                        "author": {
                            "@id": `${BrandConfig.baseUrl}/#organization`
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD",
                            "availability": "https://schema.org/InStock"
                        },
                        "featureList": [
                            "Real-time Global Liquidity Tracking",
                            "Sovereign Stress Monitoring",
                            "India/China Macro Intelligence",
                            "Institutional Data Visualization"
                        ]
                    })}
                </script>
            )}

            <title>{fullTitle}</title>
            <meta name="description" content={description!} />
            {keywords && <meta name="keywords" content={keywords.join(', ')} />}

            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description!} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={resolvedCanonical} />
            <meta property="og:site_name" content={BrandConfig.seo.siteName} />
            <meta property="og:locale" content={ogLocale} />

            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description!} />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:image" content={ogImage} />
            <meta name="twitter:site" content={BrandConfig.twitter} />
            <meta name="twitter:creator" content={BrandConfig.twitter} />

            {ogType === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}

            <meta name="geo.region" content={geoRegion} />
            <meta name="target_country" content={targetCountry} />
            </>
            )}

            <link rel="canonical" href={resolvedCanonical} />
            <meta name="robots" content={resolvedRobots} />
        </Helmet>
    );
};