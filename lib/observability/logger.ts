import * as Sentry from "@sentry/nextjs";

type Attributes = Record<string, string | number | boolean | undefined>;

// Sentry rejects undefined attribute values.
const clean = (attributes: Attributes = {}): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
};

// Prefer this over `console.*`: the console integration forwards those too, but
// only as a bare string with no attributes to filter on. Service, session and
// device attributes come from the global scope set in instrumentation-client.ts.
export const logger = {
  debug: (message: string, attributes?: Attributes) =>
    Sentry.logger.debug(message, clean(attributes)),
  info: (message: string, attributes?: Attributes) => Sentry.logger.info(message, clean(attributes)),
  warn: (message: string, attributes?: Attributes) => Sentry.logger.warn(message, clean(attributes)),
  error: (message: string, attributes?: Attributes) =>
    Sentry.logger.error(message, clean(attributes)),
};
