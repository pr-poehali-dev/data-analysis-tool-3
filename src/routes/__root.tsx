import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import {AppSessionProvider} from "@/components/AppSessionProvider";
import {getSiteHost} from "@/lib/request-host";
import NotFound from "@/pages/NotFound";
import appCss from "@/index.css?url";

const SITE_URL = "https://sovetpay.ru";
const TITLE = "SovetPay — Аренда жилья через рекомендации";
const DESCRIPTION = "SovetPay — платформа аренды жилья через рекомендации. Безопасно, быстро и выгодно.";
const OG_DESCRIPTION = "Платформа аренды жилья через рекомендации. Безопасно, быстро и выгодно.";
const OG_IMAGE =
    "https://cdn.poehali.dev/projects/98f29e7d-3c71-4ce1-9618-2738c542d164/bucket/54f5768a-4a72-415b-be6d-324618d95f3d.png";

const METRIKA = `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=108352535', 'ym');

ym(108352535, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;

// Foreign domains are sent to the main one (the preview and local dev stay as is).
const DOMAIN_REDIRECT = `if (location.hostname !== 'sovetpay.ru' && location.hostname !== 'www.sovetpay.ru' && !location.hostname.includes('preview.poehali.dev') && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    location.replace('${SITE_URL}' + location.pathname + location.search + location.hash);
}`;

const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SovetPay",
    url: `${SITE_URL}/`,
    description: "Платформа аренды жилья через рекомендации",
    inLanguage: "ru",
    potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/feed?q={search_term_string}`,
        "query-input": "required name=search_term_string",
    },
};

export const Route = createRootRoute({
    loader: () => ({host: getSiteHost()}),
    head: ({loaderData, matches}) => {
        const host = loaderData?.host ?? "";
        const pathname = matches[matches.length - 1]?.pathname ?? "/";
        const indexable = (host === "sovetpay.ru" || host === "www.sovetpay.ru") && !pathname.startsWith("/admin");
        return {
            meta: [
                {charSet: "utf-8"},
                {name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"},
                {name: "yandex-verification", content: "7af69eed7acd80fe"},
                {name: "google-site-verification", content: "toA_K-hIu2k8BAv-U3DrDAcj5pVRe-dAakOiSUUAcA0"},
                {title: TITLE},
                {name: "description", content: DESCRIPTION},
                {
                    name: "keywords",
                    content:
                        "аренда жилья, снять квартиру, рекомендации, найти квартиру, аренда через знакомых, вознаграждение за рекомендацию",
                },
                {name: "author", content: "SovetPay"},
                {name: "robots", content: indexable ? "index, follow" : "noindex, nofollow", id: "robots-meta"},
                {name: "theme-color", content: "#ffffff"},
                {property: "og:type", content: "website"},
                {property: "og:site_name", content: "SovetPay"},
                {property: "og:url", content: `${SITE_URL}/`},
                {property: "og:title", content: TITLE},
                {property: "og:description", content: OG_DESCRIPTION},
                {property: "og:image", content: OG_IMAGE},
                {property: "og:image:width", content: "512"},
                {property: "og:image:height", content: "512"},
                {property: "og:image:alt", content: "SovetPay — платформа аренды жилья"},
                {property: "og:locale", content: "ru_RU"},
                {name: "twitter:card", content: "summary_large_image"},
                {name: "twitter:title", content: TITLE},
                {name: "twitter:description", content: OG_DESCRIPTION},
                {name: "twitter:image", content: OG_IMAGE},
                {"script:ld+json": JSON_LD},
                ...PLATFORM_META,
            ],
            links: [
                {rel: "stylesheet", href: appCss},
                {rel: "canonical", href: `${SITE_URL}/`},
                {rel: "icon", type: "image/png", href: OG_IMAGE},
                {rel: "apple-touch-icon", href: OG_IMAGE},
                {rel: "manifest", href: "/manifest.json"},
                {rel: "preconnect", href: "https://fonts.googleapis.com"},
                {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
                {
                    rel: "stylesheet",
                    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&subset=cyrillic,latin&display=swap",
                },
            ],
            // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
            scripts: [
                ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
                ...PLATFORM_SCRIPTS,
                {src: "https://cdn.poehali.dev/intertnal/js/inspector-min.js"},
                {children: DOMAIN_REDIRECT},
                {children: METRIKA},
            ],
        };
    },
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    return (
        <RootDocument>
            <TooltipProvider>
                <Toaster/>
                <Sonner/>
                <AppSessionProvider>
                    <Outlet/>
                </AppSessionProvider>
            </TooltipProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        <noscript>
            <div><img src="https://mc.yandex.ru/watch/108352535" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
        </noscript>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}