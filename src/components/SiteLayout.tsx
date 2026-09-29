import Head from "next/head";
import { useTheme } from "@hacktoolkit/nextjs-htk/context";
import { type ReactNode } from "react";
import { footerNavigation, navigation, site } from "../config";
import { Sidebar } from "./Sidebar";
import { InteractiveTools } from "./InteractiveTools";
export function SiteLayout({
  title,
  description = site.description,
  canonical = "/",
  children,
  articleDate,
}: {
  title: string;
  description?: string;
  canonical?: string;
  children: ReactNode;
  articleDate?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const pageTitle = `${title} - ${site.name}`;
  const url = `${site.url}${canonical}`;
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <meta name="author" content={site.name} />
        {process.env.NEXT_PUBLIC_SITE_MODE !== "production" && (
          <meta name="robots" content="noindex, nofollow" />
        )}
        <link rel="canonical" href={url} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta
          property="og:type"
          content={articleDate ? "article" : "website"}
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@jontsai" />
        {articleDate && (
          <meta property="article:published_time" content={articleDate} />
        )}
        <link rel="icon" href="/img/favicon.ico" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Jonathan Tsai RSS"
          href="/rss.xml"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="Jonathan Tsai Atom"
          href="/atom.xml"
        />
        <meta
          name="google-site-verification"
          content="DYas6jJv3Pypwbo3Z_pAinZ8AOty5k-dCfCHJ5RateU"
        />
        <meta name="msvalidate.01" content="083FDC17F2126892E9A310CDA4132FF0" />
        <meta
          name="p:domain_verify"
          content="6cfa374ebd343958cafc091aabbbaf16"
        />
        <meta name="yandex-verification" content="59488bc9c0ce36f3" />
        {articleDate && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                headline: title,
                description,
                datePublished: articleDate,
                url,
                author: {
                  "@type": "Person",
                  name: site.name,
                  url: `${site.url}/about.html`,
                },
              }).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </Head>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-shell">
        <header className="site-header">
          <a href="/" className="identity" aria-label="Jonathan Tsai, home">
            <img
              className="portrait"
              src="/img/portrait.jpg"
              width="128"
              height="128"
              alt=""
            />
            <span className="wordmark" aria-hidden="true">
              jon<span className="full-name">athan</span>tsai
            </span>
          </a>
          <div className="site-intro">
            <p>{site.quote}</p> <span>({site.quoteSource})</span>
          </div>
          <div className="navigation-bar">
            <div className="header-actions">
              <button
                className="theme-button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "☀" : "☾"}
              </button>
            </div>
            <nav
              id="main-nav"
              className="navigation"
              aria-label="Main navigation"
            >
              {navigation.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  aria-current={
                    (
                      item.url === "/"
                        ? canonical === "/"
                        : canonical.startsWith(item.url)
                    )
                      ? "page"
                      : undefined
                  }
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <div className="command-bar">
          <span className="session-label">
            <span aria-hidden="true">❯</span> welcome to my corner of the
            internet
          </span>
          <InteractiveTools />
        </div>
        <div className="page-grid">
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <Sidebar />
        </div>
        <footer className="site-footer">
          <div className="footer-row">
            <a className="footer-brand" href="/">
              Jonathan Tsai
            </a>
            <nav aria-label="Site index">
              {footerNavigation.map((item) => (
                <a key={item.url} href={item.url}>
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
          <div className="footer-row">
            <p>© Jonathan Tsai 2012–{new Date().getFullYear()}</p>
            <nav aria-label="Social links">
              {site.social.map((item) => (
                <a key={item.title} href={item.url}>
                  {item.title}
                </a>
              ))}
            </nav>
          </div>
          <div className="footer-row fine-print">
            <p>
              Built with <a href="https://nextjs.org">Next.js</a> +{" "}
              <a href="https://github.com/hacktoolkit/nextjs-htk">nextjs-htk</a>
              .
            </p>
            <a href="/sitemap.xml">Sitemap</a>
          </div>
        </footer>
      </div>
    </>
  );
}
