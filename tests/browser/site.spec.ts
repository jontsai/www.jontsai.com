import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  // Test the site independently of embedded services and their availability.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) =>
    route.abort(),
  );
});
test("homepage is responsive, error-free, and all original navigation works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Hello, internet",
  );
  await expect(page.locator(".post-list li")).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about.html$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("About");
  await page.screenshot({
    path: `artifacts/about-${test.info().project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("keyboard help, focus restoration, console commands, and safe typing", async ({
  page,
}) => {
  await page.goto("/");
  const help = page.getByRole("button", { name: "Shortcuts ?" });
  await help.click();
  await expect(
    page.getByRole("dialog", { name: "Keyboard shortcuts" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
  await page.keyboard.press("?");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("`");
  await expect(page.getByRole("dialog", { name: "Web console" })).toBeVisible();
  const input = page.getByRole("textbox", { name: "Console command" });
  await input.fill("echo ga ? t `");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("ga ? t `");
  await input.fill("help commands");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("copyright");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("help commands");
  await input.fill("clear");
  await input.press("Enter");
  await expect(page.getByRole("log")).toHaveText("");
  await page.screenshot({
    path: `artifacts/console-${test.info().project.name}.png`,
  });
  await page.keyboard.press("Escape");
  await page.locator("body").click({ position: { x: 2, y: 2 } });
  await page.keyboard.press("g");
  await page.keyboard.press("a");
  await expect(page).toHaveURL(/\/about.html$/);
});
test("all five navigation sequences and timeout reset", async ({ page }) => {
  for (const [key, url] of [
    ["h", "/"],
    ["a", "/about.html"],
    ["b", "/blog"],
    ["c", "/code.html"],
    ["l", "/likes.html"],
  ]) {
    await page.goto("/");
    await page.keyboard.press("g");
    await page.keyboard.press(key);
    await expect(page).toHaveURL(new RegExp(url.replaceAll(".", "\\.") + "$"));
  }
  await page.goto("/");
  await page.keyboard.press("g");
  await page.waitForTimeout(1300);
  await page.keyboard.press("a");
  await expect(page).toHaveURL(/\/$/);
});
test("theme persists and contact shortcut is available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.keyboard.press("t");
  await expect(page.getByRole("dialog", { name: "Let’s talk" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Email hello@jontsai.com" }),
  ).toHaveAttribute("href", "mailto:hello@jontsai.com");
});
test("pagination goes back to the real first page; anchors and unknown routes work", async ({
  page,
}) => {
  await page.goto("/blog/page2/");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= window.innerWidth &&
        window.innerWidth <= 1500,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation", { name: "Blog pagination" })
    .getByRole("link", { name: "Previous" })
    .click();
  await expect(page).toHaveURL(/\/blog$/);
  await page.goto("/tags.html#programming-ref");
  await expect(page.locator("#programming-ref")).toBeVisible();
  const response = await page.goto("/not-a-real-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Nothing here",
  );
});
test("text and navigation remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(
    (process.env.PREVIEW_URL || "http://127.0.0.1:3147") + "/about.html",
  );
  await expect(page.getByRole("heading", { name: "Biography" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await context.close();
});

test("live-chat handoff releases the modal and comments keep the old thread identity", async ({
  page,
}) => {
  await page.goto("/");
  await page.route("**/integrations/olark.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.chatCalls=[];window.olark=(...args)=>window.chatCalls.push(args)",
    }),
  );
  await page.keyboard.press("t");
  await page
    .getByRole("button", { name: "Open live chat", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).chatCalls)).toContainEqual([
    "api.box.expand",
  ]);
  await page.goto("/2026/09/03/i-bought-jonts-ai-for-my-ai-doppelganger");
  await page.getByRole("button", { name: "Load comments" }).click();
  expect(
    await page.evaluate(() => {
      const context = { page: {} };
      (window as any).disqus_config.call(context);
      return context.page;
    }),
  ).toMatchObject({
    url: "http://www.jontsai.com/2026/09/03/i-bought-jonts-ai-for-my-ai-doppelganger",
  });
});

test("long article and code blocks never enlarge the mobile page viewport", async ({
  page,
}) => {
  await page.goto("/blog/page2/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  const code = page.locator("pre").first();
  expect(await code.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    test.info().project.name === "mobile",
  );
});
