import { useEffect, useRef, useState } from "react";
import type { MountWidget } from "../lib/sidebar-widgets";
export function LazyWidget({
  title,
  buttonLabel,
  fallbackUrl,
  fallbackLabel,
  mount,
}: {
  title: string;
  buttonLabel: string;
  fallbackUrl: string;
  fallbackLabel: string;
  mount: MountWidget;
}) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!attempt || !container.current) return;
    let active = true;
    let cleanup = () => {};
    const fail = () => {
      if (active) {
        active = false;
        clearTimeout(timer);
        cleanup();
        setStatus("error");
      }
    };
    const timer = window.setTimeout(fail, 12000);
    cleanup = mount(
      container.current,
      () => {
        if (active) {
          clearTimeout(timer);
          setStatus("ready");
        }
      },
      fail,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [attempt, mount]);
  function load() {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }
  return (
    <section className="provider-widget" aria-label={title}>
      <h3>{title}</h3>
      {status !== "ready" && (
        <button onClick={load} disabled={status === "loading"}>
          {status === "loading"
            ? "Loading…"
            : status === "error"
              ? `Retry ${title}`
              : buttonLabel}
        </button>
      )}
      <p role="status">
        {status === "loading"
          ? `Loading ${title}…`
          : status === "error"
            ? `${title} couldn't load here. Open it directly or retry.`
            : ""}
      </p>
      <div ref={container} className="provider-content" />
      <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">
        {fallbackLabel} ↗
      </a>
      {status === "ready" && (
        <button className="widget-reload" onClick={load}>
          Reload {title}
        </button>
      )}
    </section>
  );
}
