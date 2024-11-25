import { createConsola } from "consola";
import { env } from "@/utils/env";

export const logger = createConsola({
  fancy: env.getBoolSafe("LOG_FANCY", true),
  formatOptions: {
    date: true,
    colors: true,
    compact: false,
  },
  level: env.getIntSafe("LOG_LEVEL", 999),
});
