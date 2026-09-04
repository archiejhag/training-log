/* Pure merge logic for cloud sync. No network, no dates from `Date.now()` —
   given a local and a remote snapshot, decide what the merged result is and
   which local records are newer than what's stored remotely.

   Conflict rule: last-write-wins per record, compared by an ISO-8601
   `updatedAt` stamp. ISO-8601 strings from `Date.toISOString()` are always
   UTC ("...Z") and sort lexicographically in the same order as
   chronologically, so plain string comparison is exact — no Date parsing,
   no timezone bugs. A record with no `updatedAt` (pre-sync data) sorts as
   the oldest possible value and loses to anything dated. */

const NEVER = '';

/**
 * Merge one user's day records.
 * @param {Record<string, {updatedAt?: string}>} localDays
 * @param {Record<string, {updatedAt?: string}>} remoteDays
 * @returns {{
 *   merged: Record<string, object>,
 *   toPush: string[],   // date keys where the merged (= local) version is
 *                        // newer than remote and should be upserted
 * }}
 */
export function mergeDays(localDays, remoteDays) {
  const merged = { ...localDays };
  const toPush = [];

  const keys = new Set([
    ...Object.keys(localDays ?? {}),
    ...Object.keys(remoteDays ?? {}),
  ]);

  for (const key of keys) {
    const local = localDays?.[key];
    const remote = remoteDays?.[key];

    if (!remote) {
      toPush.push(key); // only exists locally
      continue;
    }
    if (!local) {
      merged[key] = remote; // only exists remotely
      continue;
    }

    const localTime = local.updatedAt ?? NEVER;
    const remoteTime = remote.updatedAt ?? NEVER;

    if (localTime > remoteTime) {
      toPush.push(key); // local wins, and remote needs to catch up
    } else if (remoteTime > localTime) {
      merged[key] = remote; // remote wins
    }
    // equal timestamps: already in sync, nothing to do either way
  }

  return { merged, toPush };
}

/**
 * Merge the single whole-object prefs record.
 * @param {{updatedAt?: string}|null} localPrefs
 * @param {{updatedAt?: string}|null} remotePrefs
 * @returns {{ merged: object, push: boolean }}
 */
export function mergePrefs(localPrefs, remotePrefs) {
  if (!remotePrefs) return { merged: localPrefs ?? {}, push: true };
  if (!localPrefs) return { merged: remotePrefs, push: false };

  const localTime = localPrefs.updatedAt ?? NEVER;
  const remoteTime = remotePrefs.updatedAt ?? NEVER;

  if (localTime >= remoteTime) {
    return { merged: localPrefs, push: localTime > remoteTime };
  }
  return { merged: remotePrefs, push: false };
}
