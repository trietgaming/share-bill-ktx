import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * Constant-time check for the `Authorization: Bearer <CRON_SECRET>` header
 * used by scheduled jobs (GitHub Actions -> our API routes). A plain `!==`
 * string comparison leaks timing information proportional to how many
 * leading bytes match, which is avoidable here for the cost of a Buffer diff.
 */
export function isValidCronSecret(
    authHeader: string | null,
    secret: string | undefined
): boolean {
    if (!authHeader || !secret) return false;

    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(authHeader);

    // Buffers must be equal length for timingSafeEqual. A length mismatch is
    // already a "no", but we still run a same-length comparison so this
    // branch takes comparable time to the equal-length path below.
    if (actual.length !== expected.length) {
        timingSafeEqual(expected, expected);
        return false;
    }

    return timingSafeEqual(actual, expected);
}
