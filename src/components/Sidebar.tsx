import { useEffect, useRef, useState } from "react";
import { site } from "../config";
export function Sidebar() {
  const [widget, setWidget] = useState<"twitter" | "clarity" | null>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!widget) return;
    const script = document.createElement("script");
    script.src =
      widget === "twitter"
        ? "https://platform.twitter.com/widgets.js"
        : "https://clarity.fm/assets/widget_loader.js";
    script.async = true;
    container.current?.append(script);
    return () => script.remove();
  }, [widget]);
  return (
    <aside className="sidebar" aria-label="Elsewhere">
      <div className="sidebar-card">
        <img
          className="portrait"
          src="/img/portrait.jpg"
          width="64"
          height="64"
          alt="Jonathan Tsai"
        />
        <span className="eyebrow">Around the web</span>
        <h2>Let’s connect.</h2>
        <p>Code, conversations, and things worth sharing.</p>
        <a href="https://twitter.com/jontsai">Tweets by @jontsai ↗</a>
        <a href="/tweets.html">Favorite tweets →</a>
        <a href="https://clarity.fm/jontsai">Book a call on Clarity ↗</a>
        <div className="widget-controls">
          <button onClick={() => setWidget("twitter")}>Load timeline</button>
          <button onClick={() => setWidget("clarity")}>Load call widget</button>
        </div>
        <div ref={container}>
          {widget === "twitter" && (
            <a className="twitter-timeline" href="https://twitter.com/jontsai">
              Tweets by jontsai
            </a>
          )}
          {widget === "clarity" && (
            <iframe
              title="Book a call with Jonathan"
              className="clarity-widget"
              data-c-id={site.integrations.clarity}
              data-c-width="178"
            />
          )}
        </div>
        <a href="http://kebu.me/donate" className="donation">
          Make a Donation ↗
        </a>
      </div>
      <div className="sidebar-note">
        <span className="status-dot" /> Keyboard friendly
        <p>
          Try <kbd>?</kbd> for shortcuts
          <br />
          or <kbd>`</kbd> for the console.
        </p>
      </div>
    </aside>
  );
}
