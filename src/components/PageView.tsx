import { footerNavigation, navigation } from "../config";
import type { PageData } from "../lib/types";
import { SiteLayout } from "./SiteLayout";
import { PostList, PostTags } from "./PostList";
import { Taxonomy } from "./Taxonomy";
import { Comments, TweetEmbeds } from "./ExternalEmbeds";
const Content = ({ html }: { html: string }) => (
  <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
);
export function PageView({
  route,
  content,
  posts,
  post,
  previous,
  next,
  totalPages,
}: PageData) {
  const isHome = route.kind === "home";
  return (
    <SiteLayout
      title={route.title}
      canonical={route.canonical}
      description={post?.description || content?.description}
      articleDate={post?.date}
    >
      <header className={`page-heading ${isHome ? "home-heading" : ""}`}>
        <div className="window-title" aria-hidden="true">
          <span>jontsai@www:~{route.canonical}</span>
          <span className="window-controls">─ □ ×</span>
        </div>
        <h1>{route.title}</h1>
        {(content?.tagline || post?.tagline) && (
          <p className="terminal-line">
            <span>$</span> {content?.tagline || post?.tagline}
          </p>
        )}
        {post && (
          <div className="post-meta">
            <time dateTime={post.date}>
              {new Date(`${post.date}T00:00:00Z`).toLocaleDateString("en-US", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <PostTags post={post} />
          </div>
        )}
      </header>
      {content && <Content html={content.html} />}
      {isHome && (
        <section className="recent-posts">
          <div className="section-heading">
            <h2>Recent Blog Posts</h2>
            <a href="/archive.html">All writing →</a>
          </div>
          <PostList posts={posts} />
        </section>
      )}
      {route.source === "tweets.html" && <TweetEmbeds />}
      {post && (
        <>
          <article>
            <Content html={post.html} />
          </article>
          <div className="share-links">
            <span>Share this post</span>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://www.jontsai.com" + post.url)}&text=${encodeURIComponent(post.title)}`}
            >
              Share on X ↗
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.jontsai.com" + post.url)}`}
            >
              Facebook ↗
            </a>
          </div>
          <nav className="pagination" aria-label="Post navigation">
            {previous ? (
              <a href={previous.url} title={previous.title}>
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <a href="/archive.html">Archive</a>
            {next ? (
              <a href={next.url} title={next.title}>
                Next →
              </a>
            ) : (
              <span />
            )}
          </nav>
          <Comments post={post} />
        </>
      )}
      {route.kind === "blog" && (
        <>
          <p className="muted">
            The full feed. Prefer a quick overview?{" "}
            <a href="/archive.html">Browse the archive →</a>
          </p>
          {posts.map((item) => (
            <article className="blog-entry" key={item.url}>
              <header>
                <time dateTime={item.date}>{item.date}</time>
                <h2>
                  <a href={item.url}>{item.title}</a>
                </h2>
                <PostTags post={item} />
              </header>
              <Content html={item.html} />
              <a className="read-post" href={item.url}>
                Permalink & comments →
              </a>
            </article>
          ))}
          <nav className="pagination" aria-label="Blog pagination">
            {route.page! > 1 ? (
              <a
                href={
                  route.page === 2 ? "/blog" : `/blog/page${route.page! - 1}`
                }
              >
                ← Previous
              </a>
            ) : (
              <span />
            )}
            <span>
              Page {route.page} of {totalPages}
            </span>
            {route.page! < totalPages ? (
              <a href={`/blog/page${route.page! + 1}`}>Next →</a>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}
      {route.kind === "archive" &&
        [...new Set(posts.map((p) => p.date.slice(0, 4)))].map((year) => (
          <section key={year}>
            <h2 id={year}>{year}</h2>
            <PostList posts={posts.filter((p) => p.date.startsWith(year))} />
          </section>
        ))}
      {(route.kind === "tags" || route.kind === "categories") && (
        <Taxonomy posts={posts} kind={route.kind} />
      )}
      {route.kind === "pages" && (
        <ul className="page-directory">
          {[
            ...navigation,
            ...footerNavigation,
            { title: "Posts on X", url: "/tweets.html" },
            { title: "RSS feed", url: "/rss.xml" },
            { title: "Atom feed", url: "/atom.xml" },
            { title: "Sitemap", url: "/sitemap.xml" },
          ].map((item) => (
            <li key={item.url}>
              <a href={item.url}>{item.title} →</a>
            </li>
          ))}
        </ul>
      )}
    </SiteLayout>
  );
}
