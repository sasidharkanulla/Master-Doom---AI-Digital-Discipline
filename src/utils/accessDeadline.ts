// Use a monotonic clock so changing the system time cannot extend active access.
export function createAccessDeadline(grantedSeconds: number, startedAt: number) {
  const duration = Number.isFinite(grantedSeconds)
    ? Math.min(600, Math.max(0, Math.floor(grantedSeconds)))
    : 0;
  const expiresAt = startedAt + duration * 1000;
  return {
    read(now: number) {
      const remainingMs = Math.max(0, expiresAt - now);
      return {
        remainingSeconds: Math.ceil(remainingMs / 1000),
        expired: remainingMs === 0
      };
    }
  };
}
