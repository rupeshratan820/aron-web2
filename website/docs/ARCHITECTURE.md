# Aron Website Architecture

Aron website is a static React + Vite application deployable to GitHub Pages. It uses Firebase client SDKs for Authentication and Realtime Database reads/writes. The bot remains the only service with Firebase Admin credentials.

## Firebase Auth

Configure Firebase Authentication with a custom Discord OIDC provider. Use provider id `oidc.discord`, scope `identify`, and the GitHub Pages callback domain in Firebase authorized domains.

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
- `botData/verificationAudit/{discordId}/{sha256Token}`

## Verification Flow

1. Player runs `a verify`.
2. Bot creates a cryptographically random token, stores only `sha256(token)` at `verificationTokens`, and sends `/verify?token=rawToken`.
3. Website requires Discord login through Firebase Auth.
4. Website hashes the raw URL token and reads the matching token record.
5. Website rejects missing, expired, reused, or wrong-user tokens.
6. Website computes lightweight device-risk scoring and writes `meta/accountSecurity/userStatuses/{discordId}`.
7. Bot reads the same account-security path and treats the user as verified, quarantined, or blocked.

## Anti-Alt Logic

The static website stores only hashed device fingerprints. A fully reliable IP hash needs a trusted backend or edge worker because GitHub Pages cannot securely access or hash visitor IPs without exposing the hash salt. The current implementation scores:

- reused or mismatched verification token
- unregistered bot profile
- repeated device hash among recent verifications
- one-time token replay attempts

Statuses are `verified`, `quarantined`, and `blocked`; the UI also displays suspicious scores.

## Optimization

- Reads are path-scoped instead of loading the full database.
- Cards, guilds, stats, and dashboard reads are cached in memory.
- Large card views use limited first-page reads and client pagination/search.
- Realtime listeners are avoided by default to reduce bandwidth.
- Images are lazy loaded.

## GitHub Pages Limits

GitHub Pages cannot run a private Discord OAuth secret exchange, hide Firebase Admin credentials, enforce IP hashing, or perform trusted server validation. Use Firebase Auth OIDC plus strict Realtime Database rules for static-only hosting. For stronger anti-alt enforcement, add a Firebase Cloud Function or Cloudflare Worker later.
