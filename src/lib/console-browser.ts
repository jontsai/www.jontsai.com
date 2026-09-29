import type { ConsoleEnvironment } from "./console";
export const PUBLIC_IP_URL = "https://api64.ipify.org?format=json";
const MAX_RESPONSE = 100_000;
/** A network adapter, invoked by commands only; never contacts services on page load. */
export function browserEnvironment(signal: AbortSignal): ConsoleEnvironment {
  async function fetchText(url: string) {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) return "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return text + decoder.decode();
        text += decoder.decode(value, { stream: true });
        if (text.length > MAX_RESPONSE)
          return (
            text.slice(0, MAX_RESPONSE) +
            "\n[Output truncated at 100,000 characters]"
          );
      }
    } finally {
      await reader.cancel();
    }
  }
  return {
    now: () => new Date(),
    agent: navigator.userAgent,
    referrer: document.referrer,
    origin: location.origin,
    fetchText,
    publicIp: async () => {
      const { ip } = JSON.parse(await fetchText(PUBLIC_IP_URL));
      if (typeof ip !== "string") throw new Error("Invalid IP response");
      // URL parsing validates bracketed IPv6; strict dotted-quad checks reject HTML/errors.
      const ipv4 =
        /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
        ip.split(".").every((part) => Number(part) <= 255);
      let ipv6 = false;
      if (ip.includes(":")) {
        try {
          ipv6 = new URL(`https://[${ip}]/`).hostname.startsWith("[");
        } catch {
          /* Invalid address. */
        }
      }
      if (!ipv4 && !ipv6) throw new Error("Invalid IP response");
      return ip;
    },
    locate: () =>
      new Promise((resolve, reject) => {
        if (signal.aborted) return reject(signal.reason);
        if (!navigator.geolocation)
          return reject(new Error("Geolocation unavailable"));
        const abort = () => reject(signal.reason);
        signal.addEventListener("abort", abort, { once: true });
        navigator.geolocation.getCurrentPosition(
          (p) => {
            signal.removeEventListener("abort", abort);
            resolve(p.coords);
          },
          (error) => {
            signal.removeEventListener("abort", abort);
            reject(error);
          },
          { timeout: 10000, maximumAge: 0 },
        );
      }),
  };
}
