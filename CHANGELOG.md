# Changelog

All notable changes to **ChatGenius AI - Smart Auto Reply** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] — 2026-07-03 — Security & UI Major Update

This is a major release that ships a complete UI redesign, a deep security audit
covering 21 + 16 issues, and several breaking changes to the license & permission
model. Existing users upgrading from 2.x will be guided through a one-time
re-authorization flow.

### Added
- **Privacy Policy** page published at https://chat.sopie.cc/privacy-policy/
- **`version_name`** field for human-readable version labels.
- **`author`** and **`homepage_url`** fields in `manifest.json`.
- **Migration helper** `migrateLicenseCodeToLocal()` that moves `licenseCode`
  from `chrome.storage.sync` to `chrome.storage.local` for existing Pro users.
- **`LICENSE_STRICT_SIGNATURE`** env var for toggling strict HMAC verification.
- **CSV formula injection guard** (`csvEscape`) in admin CSV export.
- **`ALLOWED_SETTING_KEYS`** whitelist for the admin system-settings endpoint.
- **`crypto.randomBytes`** for batch id generation (replaces `Math.random`).
- **Row-level locking** (`FOR UPDATE`) on order completion and license rebind
  to eliminate race conditions.
- **Heartbeat IP logging** for forensic analysis.
- **Force-logout IPC** message (`LICENSE_REVOKED`) so the content script can
  remove AI buttons immediately when a license is banned.
- **Onboarding checklist** for new Chrome Web Store submissions (screenshots,
  promotional tiles, demo video).

### Changed
- **`licenseCode` storage moved from `chrome.storage.sync` to
  `chrome.storage.local`** (BREAKING). Sensitive credentials no longer leave
  the local browser profile.
- **License verification is now fail-closed**: a server error during license
  check no longer grants Pro access. Affected users see a clear error banner.
- **WeChat Pay callback decryption** now slices the GCM auth tag from the
  decoded `Buffer` (16 bytes) instead of from the base64 string (12 bytes),
  fixing the silent decryption failures observed in production.
- **Invoice validation** now reverse-looks-up the `licenses` table when
  `orders.activation_code` is missing, eliminating the dead-lock introduced
  in 2.x.
- **Settings page (options.html) completely redesigned** with a Stripe +
  Linear mixed visual language: glass-morphism header, brand gradient tokens,
  unified form heights, spring animations, dark-mode-aware tokens, and
  `prefers-reduced-motion` support.
- **Guide page (guide.html) high-end visual overhaul** with brand color
  system, hero gradient text, step-flow cards, and provider cards with
  hover color bars.
- **Manifest description & localized strings** corrected to remove unsupported
  platform mentions (Telegram, Slack, Discord) — only WhatsApp, Messenger and
  Facebook are actually integrated.
- **`name` and `description` in `manifest.json` now use `__MSG_extName__` /
  `__MSG_extDesc__`**, finally honoring the `default_locale` declaration.
- **CSP tightened**: `style-src 'unsafe-inline'` removed from
  `content_security_policy.extension_pages`.
- **express `trust proxy`** set to `'loopback, linklocal, uniquelocal'` to
  fix `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` behind Nginx.
- **API 配置架构改为用户自定义 URL/Key/模型名**（来自 gitee 远程合并）：
  用户可直接填写任意 AI 服务商的 API URL、Key 和模型名，不再局限于预设
  provider 列表。`background.js` 的 `loadApiSettings` 优先使用用户自定义
  配置，仅当 `apiUrl` 和 `modelName` 都为空时才 fallback 到 models-config.json。
- **Onboarding 引导改为自定义模型表单**：首次使用时直接让用户填写 URL/Key/模型名。
- **Popup 显示已配置模型信息**：从 local storage 读取 modelName 显示。
- **API 状态栏 UI 优化 + 快捷键自定义录入 + 主题预览**。

### Fixed
- **P0-1**: Payment amount tampering — server now ignores client-supplied
  `amount`/`subject` and uses an env-configured price whitelist.
- **P0-2**: WeChat Pay callback now verifies `appid`, `mchid`, and amount
  (in fen) before acknowledging.
- **P1-1**: HMAC signature verification now supports a strict mode.
- **P1-2**: Invoice ownership check no longer dead-locks when
  `orders.activation_code` is not populated by the payment callback.
- **P1-3**: All email-template interpolations now pass through `escapeHtml()`.
- **P1-4**: `/validate` endpoint applies a 3 req/min rate limit when no
  signature is provided; signed requests bypass the limit.
- **P1-5**: `query-order` validates `orderNo` against `^[A-Za-z0-9\-]{1,64}$`.
- **P1-6**: `verify-token` catch branch now returns `allowed: false`
  (fail-closed) instead of `true`.
- **P1-7**: Heartbeat records the requesting IP and fingerprint.
- **P1-8**: `licenseCode` no longer leaks via Chrome Sync.
- **P2-1** … **P2-9**: CSV injection, setting-key whitelist, refund message,
  crypto-strong batch ids, `.env` write try-catch, 7-day session TTL,
  order-completion transaction, reactivate expiry check, query-order format
  whitelist.
- **C1**: `options.js` now reads/writes `licenseCode` from
  `chrome.storage.local` (regression introduced by P1-8 in `background.js`).
- **C2**: Invoice validation reverse-queries the `licenses` table.
- **C3**: WeChat `decryptGCM` auth tag now sliced from `Buffer` (16 bytes),
  not from the base64 string.
- **C4**: Content script listens for `LICENSE_REVOKED` and removes AI buttons.
- **H1–H6, M1–M6**: 12 additional bugs from the second-pass deep audit.
- **502 Bad Gateway**: `pm2 save` + `pm2 startup` now persist the
  `chatgenius` process across server reboots.

### Security
- Removed `LICENSE_HMAC_SECRET` from the client bundle (the client-side secret
  was publicly recoverable and provided no real security; replay protection
  now relies solely on the server-side 5-minute timestamp window).
- All payment logs now include request parameters, full SDK response, and
  error details for audit traceability.

### Removed
- **PayPal button and "I have an activation code" option** from the payment
  page — only Alipay and WeChat Pay are now displayed.
- Removed redundant `'unsafe-inline'` from `style-src` in the extension CSP.
  (Chrome MV3 ignores this directive for `extension_pages` anyway, but the
  explicit removal signals professional CSP hygiene.)

---

## [2.3.0] — 2026-06-XX — UI Refactor (internal, never published to Web Store)

### Added
- Brand-violet design tokens unified across `options.html`, `guide.html` and
  the landing page.
- 14 AI providers grouped by region (International / China) in the provider
  selector.
- Onboarding flow for first-time users (3 steps: template → API key → done).

### Changed
- Settings page container widened to 1180px, typography scale upgraded.

### Fixed
- Alipay SDK v3 compatibility via `pageExec` migration.

---

## [2.2.0] — 2026-05-XX — Public Release

### Added
- Activation-code anti-piracy system (device fingerprint binding, monthly
  unbind limit, IP ban after 5 consecutive failures).
- Alipay & WeChat Pay integration with HMAC-signed callbacks.
- Admin dashboard with order management, refund, batch license generation,
  CSV export, and after-sales QQ group configuration.
- Invoice application flow with unified social credit code validation.

### Changed
- Switched license storage from server-side session to signed activation codes
  (no login system required).

---

## Versioning Policy

This project follows Semantic Versioning:

| Bump type | Trigger |
|---|---|
| **Major** (3.0.0 → 4.0.0) | Breaking changes, P0 security fixes, complete UI redesigns |
| **Minor** (3.0.0 → 3.1.0) | New features, P1/P2 security fixes, large-scope UI optimizations |
| **Patch** (3.1.0 → 3.1.1) | Bug fixes, copy edits, small UI tweaks |

Each release is tagged in git as `v<version>` (e.g. `v3.0.0`) and the
extension zip is rebuilt via `build.ps1`.
