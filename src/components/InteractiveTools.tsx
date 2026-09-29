import { useCallback, useEffect, useState } from "react";
import { navigation } from "../config";
import { ContactPanel } from "./ContactPanel";
import { Modal } from "./Modal";
import { WebConsole } from "./WebConsole";
export function InteractiveTools() {
  const [panel, setPanel] = useState<"help" | "console" | "contact" | null>(
    null,
  );
  const close = useCallback(() => setPanel(null), []);
  useEffect(() => {
    let pendingGo = 0;
    function handle(event: KeyboardEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.isComposing ||
        event.repeat
      )
        return;
      const target = event.target as HTMLElement;
      const typing = target.closest(
        'input, textarea, select, [contenteditable="true"], [role="textbox"]',
      );
      if (event.key === "Escape") {
        pendingGo = 0;
        close();
        return;
      }
      if (typing) return;
      if (event.key === "`" || event.key === "~") {
        event.preventDefault();
        setPanel((p) => (p === "console" ? null : "console"));
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setPanel((p) => (p === "help" ? null : "help"));
        return;
      }
      if (panel) return;
      const key = event.key.toLowerCase();
      if (pendingGo && Date.now() - pendingGo < 1200) {
        pendingGo = 0;
        const destination = navigation.find((n) => n.key === key);
        if (destination) {
          event.preventDefault();
          location.assign(destination.url);
          return;
        }
      }
      pendingGo = key === "g" ? Date.now() : 0;
      if (key === "t") {
        event.preventDefault();
        setPanel("contact");
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [panel, close]);
  return (
    <>
      <div className="tool-buttons" aria-label="Site tools">
        <button onClick={() => setPanel("help")} aria-keyshortcuts="?">
          Shortcuts <kbd>?</kbd>
        </button>
        <button onClick={() => setPanel("console")}>
          Console <kbd>`</kbd>
        </button>
        <button onClick={() => setPanel("contact")}>
          Contact <kbd>T</kbd>
        </button>
      </div>
      {panel && (
        <Modal
          title={
            panel === "help"
              ? "Keyboard shortcuts"
              : panel === "console"
                ? "Web console"
                : "Let’s talk"
          }
          onClose={close}
          wide={panel === "console"}
        >
          {panel === "help" ? (
            <>
              <p>
                Two keys, one destination. Press <kbd>G</kbd>, then:
              </p>
              <dl className="shortcut-list">
                {navigation.map((item) => (
                  <div key={item.key}>
                    <dt>
                      <kbd>{item.key.toUpperCase()}</kbd>
                    </dt>
                    <dd>{item.title}</dd>
                  </div>
                ))}
                <div>
                  <dt>
                    <kbd>?</kbd>
                  </dt>
                  <dd>Shortcut help</dd>
                </div>
                <div>
                  <dt>
                    <kbd>`</kbd>
                  </dt>
                  <dd>Web console</dd>
                </div>
                <div>
                  <dt>
                    <kbd>T</kbd>
                  </dt>
                  <dd>Contact / chat</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>Close dialog</dd>
                </div>
              </dl>
              <p className="muted">
                Shortcuts pause while you type in a field.
              </p>
            </>
          ) : panel === "console" ? (
            <WebConsole onClose={close} />
          ) : (
            <ContactPanel onChatOpen={close} />
          )}
        </Modal>
      )}
    </>
  );
}
