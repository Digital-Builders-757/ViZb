import * as Sentry from "@sentry/nextjs"

import { getBaseSentryOptions, shouldEnableSentry } from "@/lib/sentry/common"

const dsn = process.env.SENTRY_DSN

if (shouldEnableSentry(dsn)) {
  Sentry.init(getBaseSentryOptions(dsn))
}
