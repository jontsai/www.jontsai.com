import { site } from "../config";
import { LazyWidget } from "./LazyWidget";
import { mountClarity, mountTimeline } from "../lib/sidebar-widgets";
export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Elsewhere">
      <div className="sidebar-card">
        <h2>
          <span aria-hidden="true">./</span>elsewhere
        </h2>
        <p>Find me on the network.</p>
        <LazyWidget
          title="Tweets"
          buttonLabel="Load timeline"
          fallbackUrl="https://twitter.com/jontsai"
          fallbackLabel="Open @jontsai on X"
          mount={mountTimeline}
        />
        <a href="/tweets.html">Favorite tweets →</a>
        <LazyWidget
          title="Clarity"
          buttonLabel="Load call widget"
          fallbackUrl={site.integrations.clarityProfile}
          fallbackLabel="Book a call on Clarity"
          mount={mountClarity}
        />
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
