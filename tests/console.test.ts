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
  publicIp: async () => "203.0.113.42",
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

test("every advertised command and alias has working behavior and per-command help", async () => {
  const cases: Record<string, [string, RegExp | "clear" | "close"]> = {
    "!": ["!", /prior text/],
    agent: ["agent", /Test browser/],
    clear: ["clear", "clear"],
    cls: ["cls", "clear"],
    copyright: ["copyright", /2013–2026 Jonathan Tsai <hello@jontsai.com>/],
    credits: ["credits", /TypeScript, React, Next.js, and nextjs-htk/],
    curl: ["curl /robots.txt", /^OK$/],
    echo: ["echo preserved  spaces", /^preserved  spaces$/],
    exit: ["exit", "close"],
    quit: ["quit", "close"],
    help: ["help", /curl <URL>/],
    history: ["history", /0: echo prior text/],
    ip: ["ip", /Public IP: 203\.0\.113\.42/],
    license: ["license", /Permission is hereby granted/],
    "license()": ["license()", /THE SOFTWARE IS PROVIDED/],
    location: ["location", /Location: 0, 0/],
    print: ["print <script>literal<\/script>", /^<script>literal<\/script>$/],
    referrer: ["referrer", /No referrer/],
    time: ["time", /GMT/],
    utc: ["utc", /Thu, 01 Jan 2026 00:00:00 GMT/],
  };
  assert.deepEqual(Object.keys(cases).sort(), commandNames);
  for (const name of commandNames) {
    const [input, expected] = cases[name];
    const result = await executeCommand(input, ["echo prior text"], env);
    if (expected === "clear" || expected === "close")
      assert.equal(result[expected], true, name);
    else assert.match(result.output || "", expected, name);
    assert.doesNotMatch(
      (await executeCommand(`help ${name}`, [], env)).output!,
      /No help for/,
      name,
    );
  }
});
test("IP failures are actionable and no lookup happens for help or unrelated commands", async () => {
  let calls = 0;
  const offline = {
    ...env,
    publicIp: async () => {
      calls++;
      throw new Error("Offline");
    },
  };
  await executeCommand("help ip", [], offline);
  await executeCommand("echo hi", [], offline);
  assert.equal(calls, 0);
  assert.match(
    (await executeCommand("ip", [], offline)).output!,
    /lookup failed.*try ip again/,
  );
  assert.equal(calls, 1);
  assert.match(
    (
      await executeCommand("ip", [], {
        ...env,
        publicIp: async () => "2001:db8::1",
      })
    ).output!,
    /2001:db8::1/,
  );
});
test("curl reports HTTP/network failures, accepts quoted URLs, and rejects credentials/mixed content", async () => {
  assert.equal(
    (await executeCommand('curl "/robots.txt"', [], env)).output,
    "OK",
  );
  for (const input of ["curl", "curl /a /b"])
    assert.match((await executeCommand(input, [], env)).output!, /Usage/);
  assert.match(
    (await executeCommand("curl http://example.com", [], env)).output!,
    /insecure HTTP/,
  );
  assert.match(
    (await executeCommand("curl https://user:pass@example.com", [], env))
      .output!,
    /credentials/,
  );
  for (const [message, expected] of [
    ["HTTP 404", /HTTP 404/],
    ["Network failure", /CORS/],
  ] as const)
    assert.match(
      (
        await executeCommand("curl /missing", [], {
          ...env,
          fetchText: async () => {
            throw new Error(message);
          },
        })
      ).output!,
      expected,
    );
});
test("location distinguishes browser denial and timeout; referrer/history reflect supplied session", async () => {
  for (const [code, expected] of [
    [1, /permission denied/],
    [3, /timed out/],
  ] as const)
    assert.match(
      (
        await executeCommand("location", [], {
          ...env,
          locate: async () => {
            throw { code };
          },
        })
      ).output!,
      expected,
    );
  assert.equal(
    (
      await executeCommand("referrer", [], {
        ...env,
        referrer: "https://example.org/",
      })
    ).output,
    "https://example.org/",
  );
  assert.equal(
    (await executeCommand("!", ["echo hi", "history", "!"], env)).output,
    "0: echo hi\n1: history\n2: !",
  );
  assert.deepEqual(await executeCommand("   ", [], env), {});
});
