import pino from "pino";
import { join } from "path";
import { getLogDir } from "../fs/index.js";

const logPath = join(getLogDir(), "log.json");
const dest = pino.destination(logPath);

const logger = pino(dest);

export { logger };