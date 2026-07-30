import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import test, { after, before } from "node:test";

const port = 4300 + (process.pid % 500);
const origin = `http://127.0.0.1:${port}`;
let server;

before(async () => {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npm run dev -- --port ${port}`]
      : ["run", "dev", "--", "--port", String(port)];
  server = spawn(
    command,
    args,
    {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, NO_COLOR: "1" },
      shell: false,
      stdio: "ignore",
      windowsHide: true,
    },
  );

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The development worker is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Timed out while starting the local website test server");
});

after(() => {
  if (!server?.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    server.kill("SIGTERM");
  }
});

async function render(pathname = "/") {
  return fetch(`${origin}${pathname}`, {
    headers: { accept: "text/html" },
  });
}

test("server-renders the academic homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Changyuan Xin.+Robotics Research Portfolio<\/title>/i);
  assert.match(html, /Creative Robotics Researcher/);
  assert.match(html, /Multi-Robot Collaborative Assembly/);
  assert.match(html, /Coursework presented as/);
  assert.match(html, /Interactive CV/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /\.vinext[/\\]fonts|data-vinext-fonts/i);
});

const publicRoutes = [
  ["/research", "Research portfolio"],
  [
    "/research/multi-robot-aero-engine-assembly",
    "Multi-Robot Collaborative Assembly",
  ],
  ["/coursework", "Coursework as"],
  ["/coursework/robotics", "Robotics"],
  ["/publications", "Research outputs"],
  ["/cv", "Interactive CV"],
  ["/resources", "Materials designed to be"],
];

for (const [pathname, expected] of publicRoutes) {
  test(`server-renders ${pathname}`, async () => {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    assert.match(await response.text(), new RegExp(expected, "i"));
  });
}

test("server-renders functional private access", async () => {
  const response = await render("/private");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Authorized access/);
  assert.match(html, /Authorization code/);
  assert.match(html, /verified securely on the server/);
});

test("serves dynamic crawler metadata", async () => {
  const [sitemap, robots] = await Promise.all([
    render("/sitemap.xml"),
    render("/robots.txt"),
  ]);
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /\/research\/multi-robot-aero-engine-assembly/);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \/admin/);
});

test("renders the branded not-found page", async () => {
  const response = await render("/this-page-does-not-exist");
  assert.equal(response.status, 404);
  assert.match(await response.text(), /not been mapped yet/i);
});
