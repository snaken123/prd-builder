import type { IncomingMessage, ServerResponse } from "http";
import app from "../server/src/app.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
