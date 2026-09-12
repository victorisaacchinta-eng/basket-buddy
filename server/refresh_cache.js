// Basket Buddy — background refresh job
// This is the piece that actually talks to webcmd. In a real deployment this
// runs on a schedule (every 15-30 min per city), NOT on every visitor request.
// Right now it runs once, manually, when you call it or hit /api/refresh.

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ---- EDIT THESE to match your current live sessions ----
// Check with: webcmd --profile <platform> session list -f json
const SESSIONS = {
  amazon: { profile: "amazon", session: "amazon-main-3q" },
  blinkit: { profile: "blinkit", session: "blinkit-main-m9" },
  zepto: { profile: "zepto", session: "zepto-main-b5" },
};

const PRODUCTS = ["milk", "rice", "shampoo", "charger", "notebook"];
const SCRIPTS_DIR = path.join(__dirname, "..", "benchmark_scripts");
const CACHE_FILE = path.join(__dirname, "cache.json");

function runOne(platform, product) {
  const { profile, session } = SESSIONS[platform];
  const scriptFile = path.join(SCRIPTS_DIR, `${platform}_${product}.js`);
  if (!fs.existsSync(scriptFile)) {
    console.log(`skip: ${scriptFile} not found (run the benchmark generator first)`);
    return null;
  }
  try {
    const out = execSync(
      `webcmd --profile ${profile} --session ${session} browser run --file "${scriptFile}"`,
      { encoding: "utf8", timeout: 30000 }
    );
    const parsed = JSON.parse(out);
    if (!parsed.ok) {
      console.log(`FAILED ${platform}/${product}: ${parsed.error?.code || "unknown"}`);
      return null;
    }
    return JSON.parse(parsed.result);
  } catch (e) {
    console.log(`ERROR ${platform}/${product}: ${e.message.slice(0, 120)}`);
    return null;
  }
}

function main() {
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {};

  for (const product of PRODUCTS) {
    cache[product] = cache[product] || {};
    for (const platform of Object.keys(SESSIONS)) {
      console.log(`refreshing ${platform} / ${product}...`);
      const items = runOne(platform, product);
      if (items && items.length) {
        cache[product][platform] = items;
        console.log(`  ok, ${items.length} item(s)`);
      } else {
        console.log(`  kept previous cached value (refresh failed)`);
      }
    }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`Cache written: ${CACHE_FILE}`);
}

main();
