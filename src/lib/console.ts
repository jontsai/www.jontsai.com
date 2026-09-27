export const commandNames = [
  "!",
  "agent",
  "clear",
  "cls",
  "copyright",
  "credits",
  "curl",
  "echo",
  "exit",
  "help",
  "history",
  "ip",
  "license",
  "license()",
  "location",
  "print",
  "quit",
  "referrer",
  "time",
  "utc",
];
export interface ConsoleEnvironment {
  now: () => Date;
  agent: string;
  referrer: string;
  origin: string;
  fetchText: (url: string) => Promise<string>;
  locate: () => Promise<{ latitude: number; longitude: number }>;
}
export interface CommandResult {
  output?: string;
  clear?: boolean;
  close?: boolean;
  mapUrl?: string;
}
export async function executeCommand(
  input: string,
  history: string[],
  env: ConsoleEnvironment,
): Promise<CommandResult> {
  const [command, ...args] = input.trim().split(/\s+/);
  switch (command) {
    case "":
      return {};
    case "help":
      return {
        output: !args.length
          ? 'Type "help commands" to see a list of commands.'
          : args[0] === "commands"
            ? `Commands: ${commandNames.join(", ")}`
            : `No help for: ${args.join(" ")}`,
      };
    case "echo":
    case "print":
      return { output: args.join(" ") };
    case "clear":
    case "cls":
      return { clear: true };
    case "exit":
    case "quit":
      return { close: true };
    case "history":
      return {
        output: history.map((value, index) => `${index}: ${value}`).join("\n"),
      };
    case "!": {
      const previous = [...history]
        .reverse()
        .find((value) => value.trim() !== "!");
      return previous
        ? executeCommand(previous, [], env)
        : { output: "No previous command." };
    }
    case "time":
      return { output: env.now().toLocaleString() };
    case "utc":
      return { output: env.now().toUTCString() };
    case "agent":
      return { output: env.agent };
    case "referrer":
      return { output: env.referrer || "(No referrer)" };
    case "copyright":
      return {
        output: "Copyright 2013 by Jonathan Tsai <akajontsai-devel@yahoo.com>",
      };
    case "credits":
      return {
        output:
          "Created by Jonathan Tsai. Inspired by Python, Unix, MUDs, and countless other terminals.",
      };
    case "license":
      return { output: "Type license() to see the full license text" };
    case "license()":
      return {
        output:
          "MIT licensed: https://github.com/jontsai/jekyll-theme-hacking-in-the-dark/blob/master/LICENSE",
      };
    case "ip":
      return {
        output:
          "Your IP address as detected by JavaScript: unknown (not exposed by modern browsers).",
      };
    case "location": {
      try {
        const p = await env.locate();
        return {
          output: `GPS: ${p.latitude}, ${p.longitude}`,
          mapUrl: `https://maps.google.com/maps?q=${p.latitude},${p.longitude}`,
        };
      } catch {
        return { output: "Location unavailable or permission denied." };
      }
    }
    case "curl": {
      if (args.length !== 1) return { output: "Usage: curl <URL>" };
      try {
        const url = new URL(args[0], env.origin);
        if (!["https:", "http:"].includes(url.protocol))
          return { output: "Only HTTP(S) URLs are supported." };
        return { output: await env.fetchText(url.href) };
      } catch {
        return {
          output:
            "Request failed. The remote server may not allow browser requests (CORS).",
        };
      }
    }
    default:
      return { output: `${command}: command not found` };
  }
}
