export interface TwitterWidgets {
  widgets: {
    createTimeline: (
      source: { sourceType: "profile"; screenName: string },
      container: HTMLElement,
      options: Record<string, string | number | boolean>,
    ) => Promise<HTMLElement | undefined>;
    load: (container?: HTMLElement) => Promise<unknown>;
  };
}
let pending: Promise<TwitterWidgets> | undefined;
export function loadTwitter(): Promise<TwitterWidgets> {
  const win = window as typeof window & { twttr?: TwitterWidgets };
  if (win.twttr?.widgets) return Promise.resolve(win.twttr);
  if (pending) return pending;
  pending = new Promise<TwitterWidgets>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      pending = undefined;
      reject(new Error("X widgets unavailable"));
    };
    const timeout = window.setTimeout(fail, 10000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      if (win.twttr?.widgets) resolve(win.twttr);
      else fail();
    };
    document.head.append(script);
  });
  return pending;
}
