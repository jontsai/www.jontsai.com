import { site } from "../config";
import { loadTwitter } from "./twitter";
export type MountWidget = (
  container: HTMLElement,
  ready: () => void,
  failed: () => void,
) => () => void;
export const mountTimeline: MountWidget = (container, ready, failed) => {
  let active = true;
  // Keep provider-owned DOM separate from React and detach it on timeout/unmount.
  const mount = document.createElement("div");
  container.append(mount);
  loadTwitter()
    .then(async (twitter) => {
      if (!active) return;
      const frame = await twitter.widgets.createTimeline(
        { sourceType: "profile", screenName: site.author.twitter },
        mount,
        {
          theme: document.documentElement.dataset.theme || "dark",
          height: 420,
          dnt: true,
          chrome: "nofooter noborders",
          ariaPolite: "polite",
        },
      );
      if (!active) return;
      if (frame && frame.getBoundingClientRect().height > 0) ready();
      else failed();
    })
    .catch(() => {
      if (active) failed();
    });
  return () => {
    active = false;
    mount.remove();
  };
};
export const mountClarity: MountWidget = (container, ready, failed) => {
  const frame = document.createElement("iframe");
  const width = Math.max(
    180,
    Math.floor(container.getBoundingClientRect().width),
  );
  frame.title = "Book a call with Jonathan on Clarity";
  frame.className = "clarity-widget";
  frame.referrerPolicy = "no-referrer";
  frame.style.height = "280px";
  frame.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
  );
  const url = new URL("https://clarity.fm/widget");
  url.search = new URLSearchParams({
    source: "blog",
    id: site.integrations.clarity,
    width: String(width),
  }).toString();
  url.hash = `id=site-clarity&${encodeURIComponent(location.origin)}`;
  frame.src = url.href;
  const onMessage = (event: MessageEvent) => {
    if (
      event.origin !== "https://clarity.fm" ||
      event.source !== frame.contentWindow ||
      typeof event.data !== "string"
    )
      return;
    // Clarity's loader message protocol, scoped to this frame (not global listeners).
    if (event.data === "site-clarity:show") ready();
    const height = event.data.match(/^site-clarity:setHeight,(\d+(?:\.\d+)?)$/);
    if (height)
      frame.style.height = `${Math.max(100, Math.min(1200, Number(height[1])))}px`;
    // Use the provider's booking page instead of its obsolete parent-page modal loader.
    if (event.data === `site-clarity:modal:open,${site.integrations.clarity}`)
      location.assign(`${site.integrations.clarityProfile}/precall`);
  };
  window.addEventListener("message", onMessage);
  frame.onerror = failed;
  container.append(frame);
  return () => {
    window.removeEventListener("message", onMessage);
    frame.remove();
  };
};
