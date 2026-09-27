import { useEffect, useState } from "react";
import { site } from "../config";
import type { Article } from "../lib/types";
export function Comments({ post }: { post: Article }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    // The legacy integration keyed threads by the HTTP production URL. Keep that
    // identity even though the new canonical URL and embed transport use HTTPS.
    const win = window as typeof window & { disqus_config?: () => void };
    win.disqus_config = function (this: {
      page: { url: string; identifier?: string; title: string };
    }) {
      this.page.url = `http://www.jontsai.com${post.url}`;
      this.page.title = post.title;
      if (post.disqusIdentifier) this.page.identifier = post.disqusIdentifier;
    };
    const script = document.createElement("script");
    script.src = `https://${site.integrations.disqus}.disqus.com/embed.js`;
    script.async = true;
    document.body.append(script);
    return () => {
      script.remove();
      delete win.disqus_config;
    };
  }, [loaded, post]);
  return (
    <section className="comments" aria-label="Comments">
      <h2>Conversation</h2>
      <p>Comments are hosted by Disqus.</p>
      {!loaded && (
        <button onClick={() => setLoaded(true)}>Load comments</button>
      )}
      <div id="disqus_thread" />
      <noscript>
        <a href={`https://${site.integrations.disqus}.disqus.com/`}>
          Read comments on Disqus
        </a>
      </noscript>
    </section>
  );
}
export function TweetEmbeds() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.append(script);
    return () => script.remove();
  }, [loaded]);
  return !loaded ? (
    <button onClick={() => setLoaded(true)}>Load interactive tweets</button>
  ) : null;
}
