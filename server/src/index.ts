import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocal = path.resolve(__dirname, "../../.env.local");
if (existsSync(envLocal)) {
  process.loadEnvFile(envLocal);
}

const { default: app } = await import("./app.js");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`PRD Builder server listening on http://localhost:${PORT}`);
});
