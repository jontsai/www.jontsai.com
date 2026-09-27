import test from "node:test";
import assert from "node:assert/strict";
import {
  commandNames,
  executeCommand,
  type ConsoleEnvironment,
} from "../src/lib/console";
const env: ConsoleEnvironment = {
  now: () => new Date("2026-01-01T00:00:00Z"),
  agent: "Test browser",
  referrer: "",
  origin: "https://example.com",
  fetchText: async () => "OK",
  locate: async () => ({ latitude: 0, longitude: 0 }),
};
test("console restores the complete legacy command set", () => {
  assert.deepEqual(commandNames, [
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
  ]);
});
test("command aliases, history repeat and empty history work without recursion", async () => {
  assert.equal(
    (await executeCommand("echo hello internet", [], env)).output,
    "hello internet",
  );
  assert.deepEqual(await executeCommand("cls", [], env), { clear: true });
  assert.deepEqual(await executeCommand("quit", [], env), { close: true });
  assert.equal(
    (await executeCommand("!", [], env)).output,
    "No previous command.",
  );
  assert.equal(
    (await executeCommand("!", ["echo hi", "!", "!"], env)).output,
    "hi",
  );
  assert.match(
    (await executeCommand("unknown", [], env)).output!,
    /command not found/,
  );
});
test("curl stays browser-native and non-HTTP schemes cannot run", async () => {
  let called = false;
  const result = await executeCommand("curl javascript:alert(1)", [], {
    ...env,
    fetchText: async () => {
      called = true;
      return "";
    },
  });
  assert.equal(called, false);
  assert.match(result.output!, /Only HTTP/);
  assert.equal(
    (await executeCommand("curl /about.html", [], env)).output,
    "OK",
  );
});
test("geolocation denies gracefully and only runs for the explicit location command", async () => {
  assert.match(
    (
      await executeCommand("location", [], {
        ...env,
        locate: async () => {
          throw new Error("denied");
        },
      })
    ).output!,
    /permission denied/,
  );
  assert.equal(
    (await executeCommand("location", [], env)).mapUrl,
    "https://maps.google.com/maps?q=0,0",
  );
});
