import { useEffect, useRef, useState, type FormEvent } from "react";
import { executeCommand } from "../lib/console";
import { browserEnvironment } from "../lib/console-browser";
export function WebConsole({ onClose }: { onClose: () => void }) {
  const [lines, setLines] = useState([
    'WebConsole by Jonathan Tsai. Type "help commands" to begin.',
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const pending = useRef<AbortController | null>(null);
  const output = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    return () => pending.current?.abort();
  }, []);
  useEffect(() => {
    output.current?.scrollTo(0, output.current.scrollHeight);
  }, [lines]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !input.trim()) return;
    const command = input;
    setInput("");
    setBusy(true);
    const nextHistory = [...history, command];
    setHistory(nextHistory);
    setPosition(nextHistory.length);
    setLines((old) => [...old, `>>> ${command}`]);
    try {
      const controller = new AbortController();
      pending.current = controller;
      const result = await executeCommand(
        command,
        history,
        browserEnvironment(controller.signal),
      );
      if (controller.signal.aborted) return;
      if (result.clear) {
        setLines([]);
        setMapUrl("");
      }
      if (result.output !== undefined)
        setLines((old) => [...old, result.output!]);
      if (result.mapUrl) setMapUrl(result.mapUrl);
      if (result.close) onClose();
    } catch {
      if (!pending.current?.signal.aborted)
        setLines((old) => [
          ...old,
          "Command failed. Try again, or type help commands.",
        ]);
    } finally {
      if (!pending.current?.signal.aborted) {
        setBusy(false);
        inputRef.current?.focus();
      }
      pending.current = null;
    }
  }
  return (
    <div className="console">
      <pre ref={output} role="log" aria-live="polite" aria-busy={busy}>
        {lines.join("\n")}
      </pre>
      {mapUrl && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer">
          Open location in Google Maps ↗
        </a>
      )}
      <form onSubmit={submit}>
        <label htmlFor="console-input">&gt;&gt;&gt;</label>
        <input
          ref={inputRef}
          id="console-input"
          aria-label="Console command"
          value={input}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (!["ArrowUp", "ArrowDown"].includes(e.key)) return;
            e.preventDefault();
            const next = Math.max(
              0,
              Math.min(
                history.length,
                position + (e.key === "ArrowUp" ? -1 : 1),
              ),
            );
            setPosition(next);
            setInput(history[next] || "");
          }}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Running…" : "Run"}
        </button>
      </form>
    </div>
  );
}
