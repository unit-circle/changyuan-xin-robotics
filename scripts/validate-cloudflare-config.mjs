import { readFile } from "node:fs/promises";
import process from "node:process";

const configUrl = new URL("../wrangler.jsonc", import.meta.url);
const config = await readFile(configUrl, "utf8");
const problems = [];

if (config.includes("00000000-0000-4000-8000-000000000000")) {
  problems.push(
    "D1 database_id is still the placeholder. Run `npm run cf:d1:create`, then copy the returned database_id into wrangler.jsonc.",
  );
}

if (!config.includes('"pattern": "changyuanxin.dpdns.org"')) {
  problems.push(
    "The expected custom domain changyuanxin.dpdns.org is missing from wrangler.jsonc.",
  );
}

if (!config.includes('"bucket_name": "changyuan-xin-portfolio-uploads"')) {
  problems.push(
    "The expected R2 bucket changyuan-xin-portfolio-uploads is missing from wrangler.jsonc.",
  );
}

if (!config.includes('"ADMIN_EMAILS": "unitcirclexin@gmail.com"')) {
  problems.push(
    "The administrator allowlist must contain unitcirclexin@gmail.com.",
  );
}

if (problems.length > 0) {
  console.error("\nCloudflare deployment configuration is not ready:\n");
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("\nSee CLOUDFLARE_DEPLOYMENT.md for the exact setup steps.\n");
  process.exit(1);
}

console.log(
  "Cloudflare configuration check passed: domain, D1, R2, and administrator allowlist are ready.",
);
