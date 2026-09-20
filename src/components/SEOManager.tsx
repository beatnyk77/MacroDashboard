import React, { useEffect } from 'react';
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
    lastModified?: string;
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
    lastModified,
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

    // index.html is also the SPA fallback, so it contains homepage metadata for
    // the first paint. Remove that fallback from hydrated routes and then write
    // one authoritative head set. This keeps client navigation and prerendered
    // HTML aligned even when Helmet leaves static tags in place.
    useEffect(() => {
        const syncHead = () => {
        const selectors = [
            'link[rel="canonical"]',
            'meta[name="description"]',
            'meta[property="og:title"]',
            'meta[property="og:description"]',
            'meta[property="og:type"]',
            'meta[property="og:url"]',
            'meta[property="og:image"]',
            'meta[property="og:site_name"]',
            'meta[property="og:locale"]',
            'meta[name="twitter:title"]',
            'meta[name="twitter:description"]',
            'meta[name="twitter:card"]',
            'meta[name="twitter:image"]',
            'meta[name="twitter:site"]',
            'meta[name="twitter:creator"]',
            'meta[name="geo.region"]',
            'meta[name="target_country"]',
        ];

        selectors.forEach((selector) => {
            document.head
                .querySelectorAll(`${selector}[data-default-seo="true"]`)
                .forEach((element) => element.remove());
        });

        if (isLayoutMode) return;

        const ensureElement = (
            selector: string,
            tagName: 'link' | 'meta',
            attributes: Record<string, string>,
        ) => {
            document.head.querySelectorAll(selector).forEach((element, index) => {
                if (index > 0) element.remove();
            });
            let element = document.head.querySelector(selector) as HTMLElement | null;
            if (!element) {
                element = document.createElement(tagName);
                document.head.appendChild(element);
            }
            Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
            element.setAttribute('data-rh', 'true');
        };

        const metaEntries: Array<[
            string,
            'name' | 'property',
            string,
            string | undefined,
        ]> = [
            ['meta[name="description"]', 'name', 'description', description],
            ['meta[property="og:title"]', 'property', 'og:title', fullTitle],
            ['meta[property="og:description"]', 'property', 'og:description', description],
            ['meta[property="og:type"]', 'property', 'og:type', ogType],
            ['meta[property="og:url"]', 'property', 'og:url', resolvedCanonical],
            ['meta[property="og:image"]', 'property', 'og:image', ogImage],
            ['meta[property="og:site_name"]', 'property', 'og:site_name', BrandConfig.seo.siteName],
            ['meta[property="og:locale"]', 'property', 'og:locale', ogLocale],
            ['meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle],
            ['meta[name="twitter:description"]', 'name', 'twitter:description', description],
            ['meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image'],
            ['meta[name="twitter:image"]', 'name', 'twitter:image', ogImage],
            ['meta[name="twitter:site"]', 'name', 'twitter:site', BrandConfig.twitter],
            ['meta[name="twitter:creator"]', 'name', 'twitter:creator', BrandConfig.twitter],
            ['meta[name="geo.region"]', 'name', 'geo.region', geoRegion],
            ['meta[name="target_country"]', 'name', 'target_country', targetCountry],
        ];

        metaEntries.forEach(([selector, attribute, key, value]) => {
            if (!value) return;
            ensureElement(selector, 'meta', { [attribute]: key, content: value });
        });

        ensureElement('link[rel="canonical"]', 'link', {
            rel: 'canonical',
            href: resolvedCanonical,
        });

        document.head.querySelectorAll('meta[name="robots"]').forEach((element, index) => {
            if (index > 0) element.remove();
        });
        const robotsMeta = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
        if (robotsMeta) {
            robotsMeta.setAttribute('content', resolvedRobots);
            robotsMeta.setAttribute('data-rh', 'true');
        }

        if (fullTitle) document.title = fullTitle;
        };

        syncHead();
        // Helmet can reconcile its managed nodes after this effect. A second
        // pass ensures those reconciliations cannot restore duplicate fallback
        // tags or remove the route description.
        const timer = window.setTimeout(syncHead, 100);
        if (isLayoutMode) return () => window.clearTimeout(timer);

        const observer = new MutationObserver(() => {
            const descriptionNode = document.head.querySelector('meta[name="description"]');
            const canonicalNode = document.head.querySelector('link[rel="canonical"]');
            if (descriptionNode?.getAttribute('content') !== description || canonicalNode?.getAttribute('href') !== resolvedCanonical) {
                syncHead();
            }
        });
        observer.observe(document.head, { childList: true });

        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
        };
    }, [
        description,
        fullTitle,
        geoRegion,
        isLayoutMode,
        ogImage,
        ogLocale,
        ogType,
        resolvedCanonical,
        resolvedRobots,
        targetCountry,
    ]);

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
            
            {lastModified && (
                <>
                    <meta name="last-modified" content={lastModified} />
                    <meta property="article:modified_time" content={lastModified} />
                </>
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
