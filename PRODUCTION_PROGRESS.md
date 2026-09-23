# Production readiness checkpoints

Work one issue at a time. Verify, commit, and publish each completed change before starting the next issue. Target: an Android product suitable for Google Play. The current repository is a web prototype, not a native Android blocker.

## 2026-09-23: Honor approved social-session duration

- Carry the approved duration into the active session and display its remaining time.
- Close the simulated social session at its deadline. Recheck on focus and visibility changes, using elapsed time rather than counting timer callbacks.
- Missing/invalid grants expire immediately; grants are capped at the existing 600-second maximum.
- Preserve the separate direct-access purpose-check behavior.
- Five regression tests pass: `node --experimental-strip-types --test src/utils/accessDeadline.test.ts` (Node 22.17.1).
- TypeScript check passes: `npm run lint`. Vite production client build passes.
- Standard dependency installation encounters an existing Vite/esbuild peer conflict; verification used `npm install --package-lock=false --ignore-scripts --legacy-peer-deps`. No manifest or lockfile was changed.
- The combined build's server bundling step hits a filesystem access error in this Windows environment. Full build verification remains outstanding.
- Native app blocking, persistent cooldowns, and device-level enforcement are not implemented by this fix.

## Next issue

First publish this completed checkpoint: local Git push could not authenticate, and the GitHub connector's create-tree operation returned HTTP 403 (`Resource not accessible by integration`). The work is committed locally; no remote commit was created. After GitHub write access is configured, run `git push origin main` and verify the remote SHA before starting another issue.

Authenticate backend API requests and isolate session history/audit updates by user. The current global in-memory history and unprotected AI endpoints must be addressed before a public production release.
