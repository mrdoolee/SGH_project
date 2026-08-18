import { CraStudent, Gender, SeatingResult } from '../types';

export interface AssignmentResolution {
  assignments: Record<string, string | null>;
  matchedByRoster: number;
  matchedById: number;
  matchedByLegacyGuess: number;
  unmatched: number;
}

// Student IDs are minted fresh (with Date.now()) every time a basic student list is
// uploaded, so a desk->studentId assignment map saved in one session almost never
// matches student IDs in a later session/upload, even for the same class roster.
// This resolves a saved/uploaded assignment map against the CURRENTLY loaded students,
// preferring the embedded name/studentNumber snapshot (studentRoster) when present,
// falling back to a direct ID match (same-session case), and finally to a best-effort
// guess from the legacy `s_basic_<idx>_...` / `s_cra_<idx>_...` upload-order ID pattern
// for backups saved before studentRoster existed.
export function resolveAssignmentsToCurrentStudents(
  result: Pick<SeatingResult, 'assignments' | 'studentRoster'>,
  currentStudents: CraStudent[]
): AssignmentResolution {
  const rosterMap = new Map<string, { name: string; studentNumber?: string }>(
    (result.studentRoster || []).map((r) => [r.id, { name: r.name, studentNumber: r.studentNumber }])
  );

  let matchedByRoster = 0;
  let matchedById = 0;
  let matchedByLegacyGuess = 0;
  let unmatched = 0;

  const resolveOne = (oldId: string): string | null => {
    const info = rosterMap.get(oldId);
    if (info) {
      const byNumber = info.studentNumber
        ? currentStudents.find((s) => s.studentNumber === info.studentNumber)
        : undefined;
      const match = byNumber || currentStudents.find((s) => s.name === info.name);
      if (match) {
        matchedByRoster++;
        return match.id;
      }
    }
    if (currentStudents.some((s) => s.id === oldId)) {
      matchedById++;
      return oldId;
    }
    if (!info) {
      const legacyIdx = oldId.match(/^s_(?:basic|cra)_(\d+)_/)?.[1];
      if (legacyIdx !== undefined) {
        const guess = currentStudents[Number(legacyIdx)];
        if (guess) {
          matchedByLegacyGuess++;
          return guess.id;
        }
      }
    }
    unmatched++;
    return null;
  };

  const assignments: Record<string, string | null> = {};
  Object.entries(result.assignments || {}).forEach(([deskId, oldId]) => {
    assignments[deskId] = oldId ? resolveOne(oldId) : null;
  });

  return { assignments, matchedByRoster, matchedById, matchedByLegacyGuess, unmatched };
}

// A minimal student shape sufficient for rendering a seating chart (grid cell or print
// list), used when a restored backup references a student that isn't part of the
// currently-loaded roster. Real CraStudent objects satisfy this shape as well.
export interface DisplayStudent {
  id: string;
  name: string;
  studentNumber?: string;
  gender?: Gender;
}

export interface DisplayResolution {
  assignments: Record<string, string | null>;
  studentMap: Map<string, DisplayStudent>;
  matchedReal: number;
  matchedFromSnapshotOnly: number;
  unmatched: number;
}

// For read-only display (the restored seating chart / print), a backup doesn't need a
// matching student loaded in the app at all — it already carries each seat's name via
// studentRoster. This resolves each seat to a REAL currently-loaded student when one
// matches (by studentNumber/name/id, same priority as above), and otherwise falls back
// to a lightweight "snapshot" student built straight from the backup's own roster entry,
// so the chart still renders correctly with zero student data loaded in the app.
export function resolveDisplayAssignments(
  result: Pick<SeatingResult, 'assignments' | 'studentRoster'>,
  currentStudents: CraStudent[]
): DisplayResolution {
  const rosterMap = new Map<string, { name: string; studentNumber?: string; gender?: Gender }>(
    (result.studentRoster || []).map((r) => [r.id, { name: r.name, studentNumber: r.studentNumber, gender: r.gender }])
  );

  const studentMap = new Map<string, DisplayStudent>(currentStudents.map((s) => [s.id, s]));

  let matchedReal = 0;
  let matchedFromSnapshotOnly = 0;
  let unmatched = 0;

  const resolveOne = (oldId: string): string | null => {
    const info = rosterMap.get(oldId);
    if (info) {
      const byNumber = info.studentNumber
        ? currentStudents.find((s) => s.studentNumber === info.studentNumber)
        : undefined;
      const realMatch = byNumber || currentStudents.find((s) => s.name === info.name);
      if (realMatch) {
        matchedReal++;
        return realMatch.id;
      }
    }
    if (currentStudents.some((s) => s.id === oldId)) {
      matchedReal++;
      return oldId;
    }
    if (info) {
      // No matching real student loaded — display straight from the backup's snapshot.
      const snapId = `__snapshot_${oldId}`;
      if (!studentMap.has(snapId)) {
        studentMap.set(snapId, { id: snapId, name: info.name, studentNumber: info.studentNumber, gender: info.gender });
      }
      matchedFromSnapshotOnly++;
      return snapId;
    }
    const legacyIdx = oldId.match(/^s_(?:basic|cra)_(\d+)_/)?.[1];
    if (legacyIdx !== undefined) {
      const guess = currentStudents[Number(legacyIdx)];
      if (guess) {
        matchedReal++;
        return guess.id;
      }
    }
    unmatched++;
    return null;
  };

  const assignments: Record<string, string | null> = {};
  Object.entries(result.assignments || {}).forEach(([deskId, oldId]) => {
    assignments[deskId] = oldId ? resolveOne(oldId) : null;
  });

  return { assignments, studentMap, matchedReal, matchedFromSnapshotOnly, unmatched };
}
