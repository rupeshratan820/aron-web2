# Aron Website Architecture

Aron website is a static React + Vite application deployable to GitHub Pages. It uses Firebase client SDKs for Authentication and Realtime Database reads/writes. The bot remains the only service with Firebase Admin credentials.

## Firebase Auth

Configure Firebase Authentication with a custom Discord OIDC provider:

- Provider ID: `oidc.discord`
- Issuer: `https://discord.com`
- Client ID: the Discord application client ID
- Client secret: the Discord application client secret
- Flow: authorization code flow
- Scopes requested by the app: `openid identify`

In Firebase Console > Authentication > Settings > Authorized domains, add the bare site host that serves the app, for example `rupeshratan820.github.io`. Do not include `https://`, the repository path, a trailing slash, or a hash route.

In the Discord Developer Portal OAuth2 redirect list, use Firebase's auth handler URL for this project, for example `https://aron0-877c7.firebaseapp.com/__/auth/handler`, not the GitHub Pages URL. The same Discord app client ID and client secret must be saved in the Firebase OIDC provider.

The website never stores Discord client secrets. Login uses Firebase Auth redirect/popup and reads Discord identity from the authenticated provider profile.

## Database Additions

Existing bot paths are reused:

- `botData/users`
- `botData/cards`
- `botData/codes`
- `botData/guilds`
- `botData/meta/accountSecurity`
- `botData/meta/wishlistLeaderboard`

Website additions:

- `botData/webUsers/{discordId}`
- `botData/verificationTokens/{sha256Token}`
- `botData/verificationSessions/{discordId}`
- `botData/verificationAudit/{discordId}/{sha256Token}`

## Admin Access

The website admin panel reads `botData/meta/adminUserIds` and only shows `/admin`
to Discord identities in that list. Store this value as a keyed map, for example
`{ "123456789012345678": true }`; the code still reads the older array format
for migration safety, but Firebase rules expect the keyed map.

For first-time setup, set `WEBSITE_ADMIN_IDS` or `ADMIN_DISCORD_IDS` in the root
environment and run `npm run seed:admins`. The website can also use
`VITE_ADMIN_DISCORD_IDS` as a temporary visibility fallback while the database is
being seeded.

## Verification Flow

1. Player runs `a verify`.
2. Bot creates a cryptographically random token, stores only `sha256(token)` at `verificationTokens`, marks it as the active token in `verificationSessions/{discordId}`, and sends `/verify?token=rawToken`.
3. Website requires Discord login through Firebase Auth.
4. Website hashes the raw URL token and reads the matching token record.
5. Website rejects missing, expired, reused, or wrong-user tokens.
6. Website rejects stale links if a newer token was issued.
7. Website computes device and account-risk scoring and writes `meta/accountSecurity/userStatuses/{discordId}`.
8. Bot reads the same account-security path and treats the user as verified, quarantined, or blocked.

## Anti-Alt Logic

The static website stores only hashed device fingerprints. A fully reliable IP hash needs a trusted backend or edge worker because GitHub Pages cannot securely access or hash visitor IPs without exposing the hash salt. The current implementation scores:

- reused or mismatched verification token
- unregistered bot profile
- very new Discord accounts
- repeated device hash among recent verifications
- one-time token replay attempts

Statuses are `verified`, `quarantined`, and `blocked`; the UI also displays suspicious scores. Normal player commands require verification; `/register`, `/verify`, `/vote`, `/help`, and `/invite` remain available.

## Optimization

- Reads are path-scoped instead of loading the full database.
- Cards, guilds, stats, and dashboard reads are cached in memory.
- Large card views use limited first-page reads and client pagination/search.
- Realtime listeners are avoided by default to reduce bandwidth.
- Images are lazy loaded.

## GitHub Pages Limits

GitHub Pages cannot run a private Discord OAuth secret exchange, hide Firebase Admin credentials, enforce IP hashing, or perform trusted server validation. Use Firebase Auth OIDC plus strict Realtime Database rules for static-only hosting. For stronger anti-alt enforcement, add a Firebase Cloud Function or Cloudflare Worker later.
