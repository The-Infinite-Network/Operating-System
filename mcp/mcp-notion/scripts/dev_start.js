import net from "net";
import { spawn } from "child_process";
import { execSync } from "child_process";
import { createRequire } from "module";
import path from "path";

const DEFAULT_PORT = parseInt(process.env.PORT || "3002", 10);
const FALLBACK_PORTS = [DEFAULT_PORT, DEFAULT_PORT + 1, DEFAULT_PORT + 2];

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

function getPortPid(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { stdio: ["ignore", "pipe", "ignore"] })
        .toString();
      const line = out.split("\n").find((l) => l.includes(`:${port}`));
      if (!line) return null;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      return pid || null;
    }
    const out = execSync(`lsof -i :${port} -sTCP:LISTEN -t`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString();
    const pid = out.split("\n")[0].trim();
    return pid || null;
  } catch {
    return null;
  }
}

async function resolvePort() {
  for (const port of FALLBACK_PORTS) {
    const ok = await isPortAvailable(port);
    if (ok) return port;
  }
  return null;
}

async function main() {
  const resolved = await resolvePort();
  if (!resolved) {
    const pid = getPortPid(DEFAULT_PORT);
    console.error(`[PORT] ${DEFAULT_PORT} is occupied${pid ? ` by PID ${pid}` : ""}.`);
    console.error("[PORT] Free it or set PORT to an open value.");
    process.exit(1);
  }

  if (resolved !== DEFAULT_PORT) {
    const pid = getPortPid(DEFAULT_PORT);
    console.warn(`[PORT] ${DEFAULT_PORT} is in use${pid ? ` (PID ${pid})` : ""}. Using ${resolved}.`);
  }

  console.log(`[PORT] MCP Notion server starting on ${resolved}.`);

  const require = createRequire(import.meta.url);
  const tsxPkgPath = require.resolve("tsx/package.json");
  const tsxPkg = require("tsx/package.json");
  const tsxCli = path.resolve(path.dirname(tsxPkgPath), tsxPkg.bin);

  const child = spawn(process.execPath, [tsxCli, "src/index.ts"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(resolved) },
  });

  child.on("exit", (code) => process.exit(code || 0));
}

main();
