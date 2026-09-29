import { site } from "../config";
import { consoleLicense } from "./console-license";
export interface ConsoleEnvironment {
  now: () => Date;
  agent: string;
  referrer: string;
  origin: string;
  fetchText: (url: string) => Promise<string>;
  publicIp: () => Promise<string>;
  locate: () => Promise<{ latitude: number; longitude: number }>;
}
export interface CommandResult {
  output?: string;
  clear?: boolean;
  close?: boolean;
  mapUrl?: string;
}
interface Context {
  text: string;
  history: string[];
  env: ConsoleEnvironment;
}
interface Command {
  name: string;
  aliases?: string[];
  usage: string;
  description: string;
  run: (context: Context) => CommandResult | Promise<CommandResult>;
}
const commands: Command[] = [
  {
    name: "help",
    usage: "help [commands | command]",
    description: "List commands or show usage and examples for one command.",
    run: ({ text }) => {
      if (text && text !== "commands") {
        const command = findCommand(text);
        return {
          output: command
            ? `${command.usage}\n${command.description}${command.aliases ? `\nAliases: ${command.aliases.join(", ")}` : ""}`
            : `No help for: ${text}. Type help commands.`,
        };
      }
      return {
        output: `WebConsole — a browser terminal, not a system shell.\n${commands.map((c) => `${c.usage.padEnd(30)} ${c.description}`).join("\n")}\nAliases: ${commands.flatMap((c) => c.aliases || []).join(", ")}\nUse ↑/↓ for history, ! to repeat, and Esc to close.`,
      };
    },
  },
  {
    name: "echo",
    aliases: ["print"],
    usage: "echo <text>",
    description: "Print text literally; no JavaScript or shell evaluation.",
    run: ({ text }) => ({ output: text }),
  },
  {
    name: "clear",
    aliases: ["cls"],
    usage: "clear",
    description: "Clear the screen and map link; keep command history.",
    run: () => ({ clear: true }),
  },
  {
    name: "exit",
    aliases: ["quit"],
    usage: "exit",
    description: "Close the console.",
    run: () => ({ close: true }),
  },
  {
    name: "history",
    usage: "history",
    description: "Show this console session's numbered commands.",
    run: ({ history }) => ({
      output: history.length
        ? history.map((value, index) => `${index}: ${value}`).join("\n")
        : "No command history yet.",
    }),
  },
  {
    name: "!",
    usage: "!",
    description: "Repeat the most recent non-repeat command.",
    run: ({ history, env }) => {
      const previous = [...history]
        .reverse()
        .find((value) => value.trim() && value.trim().split(/\s+/)[0] !== "!");
      return previous
        ? executeCommand(previous, history, env)
        : { output: "No previous command." };
    },
  },
  {
    name: "time",
    usage: "time",
    description: "Show your browser's local date, time, and time zone.",
    run: ({ env }) => ({ output: env.now().toString() }),
  },
  {
    name: "utc",
    usage: "utc",
    description: "Show the current date and time in UTC.",
    run: ({ env }) => ({ output: env.now().toUTCString() }),
  },
  {
    name: "agent",
    usage: "agent",
    description: "Show your browser's user-agent string.",
    run: ({ env }) => ({ output: env.agent || "User agent unavailable." }),
  },
  {
    name: "referrer",
    usage: "referrer",
    description: "Show the referring page when provided by your browser.",
    run: ({ env }) => ({
      output:
        env.referrer ||
        "No referrer (direct visit or withheld by browser policy).",
    }),
  },
  {
    name: "copyright",
    usage: "copyright",
    description: "Show author and current copyright information.",
    run: ({ env }) => ({
      output: `Copyright 2013–${env.now().getUTCFullYear()} Jonathan Tsai <${site.email}>`,
    }),
  },
  {
    name: "credits",
    usage: "credits",
    description: "Show the console's origins and implementation credits.",
    run: () => ({
      output:
        "Created by Jonathan Tsai. Inspired by Python, Unix, MUDs, and countless other terminals.\nOriginal WebConsole (2013); rebuilt with TypeScript, React, Next.js, and nextjs-htk. No YUI required.",
    }),
  },
  {
    name: "license",
    aliases: ["license()"],
    usage: "license",
    description:
      "Read the original WebConsole's MIT license, available offline.",
    run: () => ({ output: consoleLicense }),
  },
  {
    name: "ip",
    usage: "ip",
    description:
      "Look up your public IPv4/IPv6 address via ipify (only when requested).",
    run: async ({ env }) => {
      try {
        return {
          output: `Public IP: ${await env.publicIp()}\nThis is your network's public address, not a private LAN address.`,
        };
      } catch {
        return {
          output:
            "Public IP lookup failed. Check your connection or content blocker, then try ip again.",
        };
      }
    },
  },
  {
    name: "location",
    usage: "location",
    description:
      "Request browser location permission and show coordinates with a map link.",
    run: async ({ env }) => {
      try {
        const p = await env.locate();
        return {
          output: `Location: ${p.latitude}, ${p.longitude}`,
          mapUrl: `https://maps.google.com/maps?q=${p.latitude},${p.longitude}`,
        };
      } catch (error) {
        const code = (error as { code?: number })?.code;
        return {
          output:
            code === 1
              ? "Location permission denied. Allow location for this site in browser settings to retry."
              : code === 3
                ? "Location request timed out. Try location again."
                : "Location unavailable or permission denied. This command requires HTTPS and browser location access.",
        };
      }
    },
  },
  {
    name: "curl",
    usage: "curl <URL>",
    description:
      "GET text, e.g. curl /robots.txt. External URLs require CORS; HTTP is blocked on HTTPS pages. No cookies sent.",
    run: async ({ text, env }) => {
      if (!text)
        return { output: "Usage: curl <URL> (example: curl /robots.txt)" };
      const address = text.replace(/^(["'])(.*)\1$/, "$2");
      if (/\s/.test(address))
        return { output: "Usage: curl <URL>; encode spaces as %20." };
      let url: URL;
      try {
        url = new URL(address, env.origin);
      } catch {
        return { output: "Invalid URL. Try curl /robots.txt." };
      }
      if (!["https:", "http:"].includes(url.protocol))
        return { output: "Only HTTP(S) URLs are supported." };
      if (url.username || url.password)
        return { output: "URLs containing credentials are not supported." };
      if (env.origin.startsWith("https:") && url.protocol === "http:")
        return {
          output:
            "HTTPS pages cannot fetch insecure HTTP URLs. Use an https:// URL.",
        };
      try {
        return {
          output: (await env.fetchText(url.href)) || "(Empty response)",
        };
      } catch (error) {
        return {
          output:
            error instanceof Error && /^HTTP \d{3}$/.test(error.message)
              ? `Request failed: ${error.message}`
              : "Request failed or timed out. Check the URL/connection; external servers must allow browser requests (CORS). Try curl /robots.txt.",
        };
      }
    },
  },
];
function findCommand(name: string) {
  return commands.find(
    (command) => command.name === name || command.aliases?.includes(name),
  );
}
export const commandNames = commands
  .flatMap((command) => [command.name, ...(command.aliases || [])])
  .sort();
/** History contains completed commands; the UI appends the submitted command afterward. */
export async function executeCommand(
  input: string,
  history: string[],
  env: ConsoleEnvironment,
): Promise<CommandResult> {
  const match = input.trimStart().match(/^(\S+)(?:\s([\s\S]*))?$/);
  if (!match) return {};
  const [, name, rawText = ""] = match;
  const command = findCommand(name);
  if (!command)
    return { output: `${name}: command not found. Type help commands.` };
  return command.run({
    text: name === "echo" || name === "print" ? rawText : rawText.trim(),
    history,
    env,
  });
}
