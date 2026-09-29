import { test, expect } from "@playwright/test";
test.skip(
  ({ isMobile }) => isMobile,
  "Sidebar widgets are desktop-only; mobile retains footer/profile navigation.",
);
test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) =>
    route.abort(),
  );
});
const twitterScript = `window.twttr={widgets:{load:async()=>{},createTimeline:async(source,container,options)=>{
 window.timelineOptions=options;
 const frame=document.createElement('iframe');frame.title='Tweets by jontsai';frame.style.height='300px';container.append(frame);return frame;
}}};`;
const clarityPage = `<html><body>Example Clarity widget<button id="request-call">Request a Call</button><script>
const target=decodeURIComponent(location.hash.split('&')[1]);
parent.postMessage('site-clarity:show',target);
parent.postMessage('site-clarity:setHeight,240',target);
document.getElementById('request-call').onclick=()=>parent.postMessage('site-clarity:modal:open,41158',target);
</script></body></html>`;
test("widgets mount independently, reload, and use authenticated frame messages for booking", async ({
  page,
}) => {
  let scripts = 0;
  await page.route("https://platform.twitter.com/widgets.js", (route) => {
    scripts++;
    return route.fulfill({
      contentType: "application/javascript",
      body: twitterScript,
    });
  });
  await page.route("https://clarity.fm/widget?*", (route) =>
    route.fulfill({ contentType: "text/html", body: clarityPage }),
  );
  await page.route("https://clarity.fm/jontsai/precall", (route) =>
    route.fulfill({ contentType: "text/html", body: "Booking page" }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load call widget", exact: true })
    .click();
  const frame = page.locator(".clarity-widget");
  await expect(
    page.getByRole("button", { name: "Reload Clarity", exact: true }),
  ).toBeVisible();
  await expect(frame).toHaveCSS("height", "240px");
  await page
    .getByRole("button", { name: "Load timeline", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reload Tweets", exact: true }),
  ).toBeVisible();
  await expect(frame).toBeVisible();
  await page
    .getByRole("button", { name: "Reload Clarity", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reload Clarity", exact: true }),
  ).toBeVisible();
  await expect(page.getByTitle("Tweets by jontsai")).toBeVisible();
  await page
    .getByRole("button", { name: "Reload Tweets", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reload Tweets", exact: true }),
  ).toBeVisible();
  expect(scripts).toBe(1);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { timelineOptions: { dnt: boolean } })
          .timelineOptions.dnt,
    ),
  ).toBe(true);
  await page.evaluate(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://evil.example",
        data: "site-clarity:setHeight,999",
      }),
    ),
  );
  await expect(frame).toHaveCSS("height", "240px");
  await page
    .frameLocator(".clarity-widget")
    .getByRole("button", { name: "Request a Call" })
    .click();
  await expect(page).toHaveURL("https://clarity.fm/jontsai/precall");
});
test("blocked timeline script shows a useful fallback and retry can recover", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load timeline", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "Tweets", exact: true })
      .getByRole("status"),
  ).toContainText("Tweets couldn't load here");
  await expect(
    page.getByRole("link", { name: "Open @jontsai on X" }),
  ).toHaveAttribute("href", "https://twitter.com/jontsai");
  await page.route("https://platform.twitter.com/widgets.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: twitterScript,
    }),
  );
  await page.getByRole("button", { name: "Retry Tweets", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reload Tweets", exact: true }),
  ).toBeVisible();
});
test("provider silence times out without leaving a blank frame or breaking the other widget", async ({
  page,
}) => {
  await page.clock.install();
  await page.route("https://platform.twitter.com/widgets.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: "window.twttr={widgets:{createTimeline:()=>new Promise(()=>{}),load:async()=>{}}};",
    }),
  );
  await page.route("https://clarity.fm/widget?*", (route) =>
    route.fulfill({ contentType: "text/html", body: "No widget handshake" }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load timeline", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load call widget", exact: true })
    .click();
  await page.clock.runFor(12500);
  await expect(
    page.getByRole("button", { name: "Retry Tweets", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry Clarity", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".provider-content iframe")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Book a call on Clarity" }),
  ).toBeVisible();
});
