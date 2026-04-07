# Auth error UX plan (implemented)

## Principles

- No raw Supabase strings in the UI — copy comes from `mapAuthError` or intentional client validation text.
- One alert primitive: `AuthAlert` (variants `error` | `warning` | `success` | `info`).
- Every server-side failure exposes a **next step** (link or button).
- Visual language aligns with neon / glass (hairline border, glow, `rounded-xl`), with `motion-safe` / `motion-reduce` transitions on the alert shell.

## Error → title / message / actions

Implementation lives in `lib/auth/auth-error-map.ts`. Contexts: `signup` | `login` | `reset` | `verify`.

| Code | Context | Title (typical) | Primary action | Secondary |
| --- | --- | --- | --- | --- |
| `account_exists` | signup | Account already exists | Go to Sign In → `/login` | Forgot password → `/auth/forgot-password` |
| `invalid_email` | signup, login, reset | Check your email | — | — |
| `weak_password` | signup | Choose a stronger password | — | — |
| `rate_limited` | * | Slow down a moment | Back to Home → `/` (signup/login) | — |
| `network_error` | * | Connection problem | Try again (handler) / Home | Reload / Home |
| `invalid_credentials` | login | Wrong email or password | Reset password | Create account |
| `email_not_verified` | login | Confirm your email first | Resend help → `/auth/sign-up-success` | Try another email → `/login` |
| `verify_send_failed` | verify | Couldn’t resend the email | Back to Sign Up | Contact support (mailto) |
| `unknown_error` | * | Something went wrong | Try again | Back to Home |

Client validation on `/signup` uses a **warning** `AuthAlert` (“Fix a few things”) plus per-field messages.

## Screenshots (regenerate anytime)

Captured by Playwright (`Auth error screenshots` in `tests/e2e/auth-errors.spec.ts`):

| Asset | Description |
| --- | --- |
| [signup-desktop.png](./auth-error-ux/signup-desktop.png) | Sign-up, duplicate-email state (mocked API), desktop |
| [login-mobile.png](./auth-error-ux/login-mobile.png) | Sign-in, invalid credentials (mocked API), narrow viewport |

```bash
npm run test:e2e
```

## PR checklist

- [ ] Branch: `polish/auth-error-ux` → target `develop`
- [ ] `npm run ci && npm run test:e2e` green
- [ ] Screenshots updated if auth layout or copy contract changes
- [ ] `docs/contracts/auth_errors.md` updated if routes or sources change
