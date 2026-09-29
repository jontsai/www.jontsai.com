import { useEffect, useState } from "react";
import { site } from "../config";
import { loadTwitter } from "../lib/twitter";
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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  async function load() {
    setStatus("loading");
    try {
      const twitter = await loadTwitter();
      await twitter.widgets.load(document.getElementById("main")!);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }
  return (
    <div>
      {status !== "ready" && (
        <button onClick={load} disabled={status === "loading"}>
          {status === "loading"
            ? "Loading posts…"
            : status === "error"
              ? "Retry interactive posts"
              : "Load interactive posts"}
        </button>
      )}
      {status === "error" && (
        <p role="status">
          X could not load interactive posts. The saved text and original links
          remain available above.
        </p>
      )}
    </div>
  );
}
