import { useState } from "react";
import { site } from "../config";
type Olark = (command: string, ...args: unknown[]) => void;
export function ContactPanel({ onChatOpen }: { onChatOpen: () => void }) {
  const [status, setStatus] = useState("");
  function openChat() {
    const show = () => {
      const olark = (window as typeof window & { olark?: Olark }).olark;
      if (olark) {
        onChatOpen();
        olark("load");
        olark("api.box.show");
        olark("api.box.expand");
        setStatus(
          "Chat requested. If it is unavailable, you can email me below.",
        );
      }
    };
    if ((window as typeof window & { olark?: Olark }).olark) return show();
    setStatus("Opening chat…");
    const script = document.createElement("script");
    script.src = "/integrations/olark.js";
    script.onload = show;
    script.onerror = () => setStatus("Chat could not load. Please use email.");
    document.body.append(script);
  }
  return (
    <>
      <p>Say hello, ask a question, or get in touch.</p>
      <p>
        <button onClick={openChat}>Open live chat</button>
      </p>
      <p role="status">{status}</p>
      <p>
        <a className="button" href={`mailto:${site.email}`}>
          Email {site.email}
        </a>
      </p>
      <p>
        <a
          href={`https://www.olark.com/site/${site.integrations.olark}/contact`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the original chat contact page ↗
        </a>
      </p>
    </>
  );
}
