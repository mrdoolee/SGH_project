import {
  CraStudent,
  DeskPosition,
  LayoutType,
  GridDimensions,
  GroupLayoutConfig,
  SeatingConstraints,
  SeatingResult,
} from '../types';

type PodShape = { podRows: number; podCols: number };

function getPodShape(layoutType: LayoutType, groupSize: 3 | 4 | 6): PodShape {
  if (layoutType === 'pods3') return { podRows: 1, podCols: 3 };
  if (layoutType === 'pods6') return { podRows: 2, podCols: 3 };
  if (layoutType === 'pods4') return { podRows: 2, podCols: 2 };
  // custom: derive a reasonable shape from the configured group size
  if (groupSize === 3) return { podRows: 1, podCols: 3 };
  if (groupSize === 6) return { podRows: 2, podCols: 3 };
  return { podRows: 2, podCols: 2 };
}

/**
 * Generates desk positions clustered into `numGroups` pods (모둠), each pod
 * holding `groupSize` desks. Pods are laid out in a near-square grid with
 * aisle gaps between pod blocks. Desks are enabled in pod order up to
 * `studentCount`; any remainder is left disabled for the teacher to adjust.
 */
export function generateDeskLayout(
  layoutType: LayoutType,
  groupLayout: GroupLayoutConfig,
  studentCount: number = 0
): { desks: DeskPosition[]; dimensions: GridDimensions } {
  const shape = getPodShape(layoutType, groupLayout.groupSize);
  const numGroups = Math.max(1, groupLayout.numGroups);
  const podGridCols = Math.max(1, Math.min(numGroups, groupLayout.podGridCols || Math.ceil(Math.sqrt(numGroups))));
  const podGridRows = Math.ceil(numGroups / podGridCols);

  const desks: DeskPosition[] = [];
  let deskIdx = 0;
  for (let podIndex = 0; podIndex < numGroups; podIndex++) {
    const podGridRow = Math.floor(podIndex / podGridCols);
    const podGridCol = podIndex % podGridCols;
    for (let pr = 0; pr < shape.podRows; pr++) {
      for (let pc = 0; pc < shape.podCols; pc++) {
        const row = podGridRow * shape.podRows + pr;
        const col = podGridCol * shape.podCols + pc;
        desks.push({
          id: `desk_${row}_${col}`,
          row,
          col,
          podId: podIndex,
          disabled: deskIdx >= studentCount,
        });
        deskIdx++;
      }
    }
  }

  const rows = podGridRows * shape.podRows;
  const cols = podGridCols * shape.podCols;
  const rowAisles: number[] = [];
  for (let pr = 1; pr < podGridRows; pr++) rowAisles.push(pr * shape.podRows - 1);
  const colAisles: number[] = [];
  for (let pc = 1; pc < podGridCols; pc++) colAisles.push(pc * shape.podCols - 1);

  return { desks, dimensions: { rows, cols, rowAisles, colAisles } };
}

/**
 * Two desks belong to the "same group" iff they share a podId. Physical
 * grid adjacency is irrelevant for study-group formation - only group
 * membership matters.
 */
export function inSameGroup(d1: DeskPosition, d2: DeskPosition): boolean {
  if (d1.id === d2.id) return false;
  return d1.podId !== undefined && d1.podId === d2.podId;
}

function groupDesksByPod(activeDesks: DeskPosition[]): Map<number, DeskPosition[]> {
  const map = new Map<number, DeskPosition[]>();
  activeDesks.forEach((d) => {
    if (d.podId === undefined) return;
    if (!map.has(d.podId)) map.set(d.podId, []);
    map.get(d.podId)!.push(d);
  });
  return map;
}

/**
 * Snake-order (draft-style) round robin: sorts students by `metric`
 * descending, then deals them into `numGroups` groups back-and-forth
 * (0..N-1, N-1..0, 0..N-1, ...) so each group receives a near-identical
 * spread of high/low values - the score/cooperation "tier" balancing.
 */
function distributeByTier(
  students: CraStudent[],
  metric: (s: CraStudent) => number,
  numGroups: number
): Map<string, number> {
  const sorted = [...students].sort((a, b) => metric(b) - metric(a));
  const groupOf = new Map<string, number>();
  let i = 0;
  let pass = 0;
  while (i < sorted.length) {
    const order: number[] = [];
    for (let g = 0; g < numGroups; g++) order.push(g);
    if (pass % 2 === 1) order.reverse();
    for (const g of order) {
      if (i >= sorted.length) break;
      groupOf.set(sorted[i].id, g);
      i++;
    }
    pass++;
  }
  return groupOf;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Converts a spread of per-group averages into a 0~100 balance score using
 * the coefficient of variation (stdev / mean): 0 spread -> 100, large
 * relative spread -> closer to 0.
 */
function balanceScoreFromGroupAverages(groupAverages: number[]): number {
  if (groupAverages.length < 2) return 100;
  const mean = average(groupAverages);
  if (mean === 0) return 100;
  const variance = average(groupAverages.map((v) => (v - mean) ** 2));
  const stdev = Math.sqrt(variance);
  const cv = stdev / Math.abs(mean);
  return Math.max(0, Math.round(100 * (1 - Math.min(1, cv))));
}

export function hasScoreData(students: CraStudent[]): boolean {
  return students.some((s) => typeof s.score === 'number' && !Number.isNaN(s.score));
}

/**
 * Checks if students array contains valid CRA relationship data
 */
export function hasCraData(students: CraStudent[]): boolean {
  if (!students || students.length === 0) return false;
  return students.some(
    (s) =>
      (s.totalNominated !== undefined && s.totalNominated > 0) ||
      (s.intimacyNominated !== undefined && s.intimacyNominated > 0) ||
      (s.cooperationNominated !== undefined && s.cooperationNominated > 0) ||
      (s.influenceNominated !== undefined && s.influenceNominated > 0) ||
      (s.intimacyGroup && s.intimacyGroup !== '모둠_1' && s.intimacyGroup !== '신규_전입')
  );
}

/**
 * Evaluates a candidate group arrangement against constraints, CRA
 * relationship principles (정서적 친밀감/기능적 협력/사회적 영향력), and
 * (when available) academic score balance across groups.
 */
export function evaluateArrangement(
  assignments: Record<string, string | null>,
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  pastAssignments?: Record<string, string | null>[]
): {
  scoreBalanceScore: number;
  cooperationBalanceScore: number;
  intimacyDispersionScore: number;
  influenceBalanceScore: number;
  constraintSatisfactionScore: number;
  overallScore: number;
} {
  const deskMap = new Map<string, DeskPosition>(desks.map((d) => [d.id, d]));
  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));

  const studentDeskMap = new Map<string, DeskPosition>();
  Object.entries(assignments).forEach(([deskId, sId]) => {
    if (sId && deskMap.has(deskId)) {
      studentDeskMap.set(sId, deskMap.get(deskId)!);
    }
  });

  // 1. Constraint satisfaction (fixed seats, must_together/separate, gender balance, avoid past groupmates)
  let constraintViolations = 0;
  let totalConstraints = 0;

  constraints.fixedSeats.forEach((fs) => {
    totalConstraints++;
    if (assignments[fs.deskId] !== fs.studentId) {
      constraintViolations++;
    }
  });

  constraints.pairConstraints.forEach((pc) => {
    totalConstraints++;
    const d1 = studentDeskMap.get(pc.student1Id);
    const d2 = studentDeskMap.get(pc.student2Id);
    if (d1 && d2) {
      const together = inSameGroup(d1, d2);
      if (pc.type === 'must_together' && !together) constraintViolations++;
      else if (pc.type === 'must_separate' && together) constraintViolations++;
    }
  });

  if (constraints.avoidPastNeighbors) {
    const pastPairSet = new Set<string>();

    students.forEach((s1) => {
      students.forEach((s2) => {
        if (s1.id < s2.id) {
          const s1Text = s1.pastSeatInfo || '';
          const s2Text = s2.pastSeatInfo || '';
          const mentionsEachOther =
            (s1Text !== '' && s1Text.includes(s2.name)) ||
            (s2Text !== '' && s2Text.includes(s1.name)) ||
            (s1Text !== '' && s1Text === s2Text);
          if (mentionsEachOther) pastPairSet.add(`${s1.id}_${s2.id}`);
        }
      });
    });

    if (pastAssignments && pastAssignments.length > 0) {
      pastAssignments.forEach((pastMap) => {
        const pastStudentToDesk = new Map<string, string>();
        Object.entries(pastMap).forEach(([dId, sId]) => {
          if (sId) pastStudentToDesk.set(sId, dId);
        });
        students.forEach((s1) => {
          students.forEach((s2) => {
            if (s1.id < s2.id) {
              const pastD1 = deskMap.get(pastStudentToDesk.get(s1.id) || '');
              const pastD2 = deskMap.get(pastStudentToDesk.get(s2.id) || '');
              if (pastD1 && pastD2 && inSameGroup(pastD1, pastD2)) {
                pastPairSet.add(`${s1.id}_${s2.id}`);
              }
            }
          });
        });
      });
    }

    pastPairSet.forEach((pair) => {
      totalConstraints++;
      const [s1Id, s2Id] = pair.split('_');
      const d1 = studentDeskMap.get(s1Id);
      const d2 = studentDeskMap.get(s2Id);
      if (d1 && d2 && inSameGroup(d1, d2)) constraintViolations++;
    });
  }

  // Gender balance across groups
  const podDesks = groupDesksByPod(desks.filter((d) => !d.disabled));
  let genderImbalancePenalty = 0;
  let genderChecks = 0;
  if (constraints.genderRule !== 'random') {
    podDesks.forEach((podDeskList) => {
      const podStudentIds = podDeskList
        .map((d) => assignments[d.id])
        .filter((id): id is string => !!id);
      if (podStudentIds.length === 0) return;
      genderChecks++;
      const maleCount = podStudentIds.filter((id) => studentMap.get(id)?.gender === 'M').length;
      const femaleCount = podStudentIds.length - maleCount;
      const imbalance = Math.abs(maleCount - femaleCount) / podStudentIds.length;
      genderImbalancePenalty += imbalance;
    });
  }
  const genderBalanceScore = genderChecks === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - genderImbalancePenalty / genderChecks)));
  if (genderChecks > 0) {
    totalConstraints += genderChecks;
    constraintViolations += genderImbalancePenalty;
  }

  const constraintSatisfactionScore = totalConstraints === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - constraintViolations / totalConstraints)));

  // 2. Score balance across groups (성적 분포 유사)
  const groupScoreAverages: number[] = [];
  podDesks.forEach((podDeskList) => {
    const scores = podDeskList
      .map((d) => assignments[d.id])
      .filter((id): id is string => !!id)
      .map((id) => studentMap.get(id)?.score)
      .filter((v): v is number => typeof v === 'number');
    if (scores.length > 0) groupScoreAverages.push(average(scores));
  });
  const scoreBalanceScore = balanceScoreFromGroupAverages(groupScoreAverages);

  // 3. Functional cooperation balance across groups (기능적 협력 - 협업 선호도 분산)
  const groupCooperationAverages: number[] = [];
  podDesks.forEach((podDeskList) => {
    const coopValues = podDeskList
      .map((d) => assignments[d.id])
      .filter((id): id is string => !!id)
      .map((id) => studentMap.get(id)?.cooperationWeighted)
      .filter((v): v is number => typeof v === 'number');
    if (coopValues.length > 0) groupCooperationAverages.push(average(coopValues));
  });
  const cooperationBalanceScore = balanceScoreFromGroupAverages(groupCooperationAverages);

  // 4. Emotional intimacy dispersion (정서적 친밀감 분산) - avoid whole cliques landing in one group
  let intimacyGroupPenalty = 0;
  let intimacyChecks = 0;
  students.forEach((s1) => {
    students.forEach((s2) => {
      if (s1.id < s2.id && s1.intimacyGroup && s1.intimacyGroup === s2.intimacyGroup) {
        intimacyChecks++;
        const d1 = studentDeskMap.get(s1.id);
        const d2 = studentDeskMap.get(s2.id);
        if (d1 && d2 && inSameGroup(d1, d2)) intimacyGroupPenalty += 1;
      }
    });
  });
  const intimacyDispersionScore = intimacyChecks === 0
    ? 100
    : Math.max(0, Math.round(100 * (1 - intimacyGroupPenalty / intimacyChecks)));

  // 5. Social influence balance (사회적 영향력 분산) - avoid high-influence students clustering in one group
  const highInfluenceStudents = students.filter(
    (s) => s.influenceWeighted >= 15 || s.influenceNominated >= 5
  );
  let influenceClashCount = 0;
  for (let i = 0; i < highInfluenceStudents.length; i++) {
    for (let j = i + 1; j < highInfluenceStudents.length; j++) {
      const d1 = studentDeskMap.get(highInfluenceStudents[i].id);
      const d2 = studentDeskMap.get(highInfluenceStudents[j].id);
      if (d1 && d2 && inSameGroup(d1, d2)) influenceClashCount++;
    }
  }
  const maxClashes = Math.max(1, (highInfluenceStudents.length * (highInfluenceStudents.length - 1)) / 2);
  const influenceBalanceScore = Math.max(0, Math.round(100 * (1 - influenceClashCount / maxClashes)));

  // Overall score: combine whichever data sources are actually available
  const craAvailable = hasCraData(students);
  const scoreAvailable = hasScoreData(students);
  const weights = constraints.algorithmWeights || {
    intimacyWeight: 30,
    cooperationWeight: 30,
    influenceWeight: 20,
    scoreBalanceWeight: 20,
  };

  const parts: { score: number; weight: number }[] = [];
  if (craAvailable) {
    parts.push({ score: intimacyDispersionScore, weight: weights.intimacyWeight });
    parts.push({ score: cooperationBalanceScore, weight: weights.cooperationWeight });
    parts.push({ score: influenceBalanceScore, weight: weights.influenceWeight });
  }
  if (scoreAvailable) {
    parts.push({ score: scoreBalanceScore, weight: weights.scoreBalanceWeight });
  }

  let overallScore: number;
  if (parts.length === 0) {
    // No preference data at all: only constraint/gender satisfaction matters
    overallScore = constraintSatisfactionScore;
  } else {
    const rawSumWeights = parts.reduce((sum, p) => sum + p.weight, 0);
    const effectiveParts = rawSumWeights === 0
      ? parts.map((p) => ({ ...p, weight: 1 }))
      : parts;
    const sumWeights = rawSumWeights === 0 ? effectiveParts.length : rawSumWeights;
    const weightedScore = effectiveParts.reduce((sum, p) => sum + p.score * p.weight, 0) / sumWeights;
    overallScore = Math.round(constraintSatisfactionScore * 0.3 + weightedScore * 0.7);
  }

  return {
    scoreBalanceScore,
    cooperationBalanceScore,
    intimacyDispersionScore,
    influenceBalanceScore,
    constraintSatisfactionScore,
    overallScore,
  };
}

/**
 * Computes each group's (podId) average score / cooperation weighted value,
 * for display in the teacher-facing result view.
 */
export function computeGroupAverages(
  assignments: Record<string, string | null>,
  desks: DeskPosition[],
  students: CraStudent[]
): Record<number, { score: number | null; cooperation: number | null }> {
  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));
  const podDesks = groupDesksByPod(desks.filter((d) => !d.disabled));
  const result: Record<number, { score: number | null; cooperation: number | null }> = {};

  podDesks.forEach((podDeskList, podId) => {
    const memberIds = podDeskList
      .map((d) => assignments[d.id])
      .filter((id): id is string => !!id);
    const scores = memberIds
      .map((id) => studentMap.get(id)?.score)
      .filter((v): v is number => typeof v === 'number');
    const coops = memberIds
      .map((id) => studentMap.get(id)?.cooperationWeighted)
      .filter((v): v is number => typeof v === 'number');
    result[podId] = {
      score: scores.length > 0 ? Math.round((average(scores) + Number.EPSILON) * 10) / 10 : null,
      cooperation: coops.length > 0 ? Math.round((average(coops) + Number.EPSILON) * 10) / 10 : null,
    };
  });

  return result;
}

export type PriorityMode = 'scoreBalance' | 'cooperation' | 'intimacy' | 'balanced';

// Candidate id -> the priorityMode generateCandidateArrangements seeded it with
// (see the opt_1..opt_4 construction below). Used to recover which metric a
// given result's tiers were drawn from, since SeatingResult doesn't store it.
export const CANDIDATE_PRIORITY_MODE: Record<string, PriorityMode> = {
  opt_1: 'cooperation',
  opt_2: 'scoreBalance',
  opt_3: 'intimacy',
  opt_4: 'balanced',
};

function pickSeedMetric(priorityMode: PriorityMode, scoreAvailable: boolean, craAvailable: boolean) {
  if (priorityMode === 'scoreBalance' && scoreAvailable) return (s: CraStudent) => s.score ?? 0;
  if (priorityMode === 'cooperation' && craAvailable) return (s: CraStudent) => s.cooperationWeighted ?? 0;
  if (priorityMode === 'intimacy' && craAvailable) return (s: CraStudent) => s.intimacyWeighted ?? 0;
  // 'balanced' (or a mode whose data source is missing): fall back to whatever
  // structural balance data is available, preferring academic score.
  if (scoreAvailable) return (s: CraStudent) => s.score ?? 0;
  if (craAvailable) return (s: CraStudent) => s.totalWeighted ?? 0;
  return null;
}

/**
 * Recovers each student's seeding tier (1-indexed) for a given candidate's
 * priorityMode - the same descending-rank / numGroups-wide bracket that
 * `distributeByTier` dealt them into when the arrangement was generated
 * (see its docstring). This is a display-only readout: it does not touch
 * assignments, so it stays correct even after manual seat swaps.
 */
export function computeStudentTiers(
  students: CraStudent[],
  constraints: SeatingConstraints,
  priorityMode: PriorityMode,
  numGroups: number
): Map<string, number> {
  const tierOf = new Map<string, number>();
  if (numGroups <= 0) return tierOf;

  const metricFn = pickSeedMetric(priorityMode, hasScoreData(students), hasCraData(students));
  if (!metricFn) return tierOf;

  const assignTiers = (pool: CraStudent[]) => {
    [...pool]
      .sort((a, b) => metricFn(b) - metricFn(a))
      .forEach((s, idx) => tierOf.set(s.id, Math.floor(idx / numGroups) + 1));
  };

  if (constraints.genderRule !== 'random') {
    assignTiers(students.filter((s) => s.gender === 'M'));
    assignTiers(students.filter((s) => s.gender === 'F'));
  } else {
    assignTiers(students);
  }

  return tierOf;
}

function assignToPod(
  assignment: Record<string, string | null>,
  podDesksMap: Map<number, DeskPosition[]>,
  podId: number,
  studentId: string
): boolean {
  const desksInPod = podDesksMap.get(podId);
  const freeDesk = desksInPod?.find((d) => assignment[d.id] === null);
  if (freeDesk) {
    assignment[freeDesk.id] = studentId;
    return true;
  }
  // Fallback: target pod is full, use the first pod with room
  for (const [, deskList] of podDesksMap) {
    const alt = deskList.find((d) => assignment[d.id] === null);
    if (alt) {
      assignment[alt.id] = studentId;
      return true;
    }
  }
  return false;
}

/**
 * Seeds a group assignment: fixed seats -> must_together pairs -> gender-aware
 * score/cooperation tier round robin -> any leftovers, then hill-climbs via
 * random pod-swaps to maximize the weighted evaluation objective.
 */
export function generateSingleArrangement(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  priorityMode: PriorityMode,
  pastAssignments?: Record<string, string | null>[]
): Record<string, string | null> {
  const activeDesks = desks.filter((d) => !d.disabled);
  const podDesksMap = groupDesksByPod(activeDesks);
  const numGroups = podDesksMap.size;
  const assignment: Record<string, string | null> = {};
  activeDesks.forEach((d) => {
    assignment[d.id] = null;
  });

  const assignedStudentIds = new Set<string>();

  // 1. Fixed seats
  constraints.fixedSeats.forEach((fs) => {
    if (activeDesks.some((d) => d.id === fs.deskId)) {
      assignment[fs.deskId] = fs.studentId;
      assignedStudentIds.add(fs.studentId);
    }
  });

  // 2. must_together pairs: seat both in the same pod
  const togetherPairs = constraints.pairConstraints.filter((pc) => pc.type === 'must_together');
  togetherPairs.forEach((pc) => {
    const s1Assigned = assignedStudentIds.has(pc.student1Id);
    const s2Assigned = assignedStudentIds.has(pc.student2Id);
    if (s1Assigned && s2Assigned) return;

    if (s1Assigned || s2Assigned) {
      const seatedId = s1Assigned ? pc.student1Id : pc.student2Id;
      const otherId = s1Assigned ? pc.student2Id : pc.student1Id;
      const seatedDeskId = Object.keys(assignment).find((dId) => assignment[dId] === seatedId);
      const seatedDesk = activeDesks.find((d) => d.id === seatedDeskId);
      if (seatedDesk?.podId !== undefined && assignToPod(assignment, podDesksMap, seatedDesk.podId, otherId)) {
        assignedStudentIds.add(otherId);
      }
      return;
    }

    for (const [podId, deskList] of podDesksMap) {
      const freeCount = deskList.filter((d) => assignment[d.id] === null).length;
      if (freeCount >= 2) {
        assignToPod(assignment, podDesksMap, podId, pc.student1Id);
        assignToPod(assignment, podDesksMap, podId, pc.student2Id);
        assignedStudentIds.add(pc.student1Id);
        assignedStudentIds.add(pc.student2Id);
        break;
      }
    }
  });

  // 3. Gender-aware score/cooperation tier round robin for everyone else
  const scoreAvailable = hasScoreData(students);
  const craAvailable = hasCraData(students);
  const metricFn = pickSeedMetric(priorityMode, scoreAvailable, craAvailable);
  const remainingStudents = students.filter((s) => !assignedStudentIds.has(s.id));
  const genderAware = constraints.genderRule !== 'random';

  const seedGroups = (pool: CraStudent[]) =>
    metricFn ? distributeByTier(pool, metricFn, numGroups) : distributeByTier(pool, () => Math.random(), numGroups);

  let groupOfMap: Map<string, number>;
  if (genderAware) {
    const males = remainingStudents.filter((s) => s.gender === 'M');
    const females = remainingStudents.filter((s) => s.gender === 'F');
    groupOfMap = new Map([...seedGroups(males), ...seedGroups(females)]);
  } else {
    groupOfMap = seedGroups(remainingStudents);
  }

  remainingStudents.forEach((s) => {
    const podId = groupOfMap.get(s.id);
    if (podId !== undefined && assignToPod(assignment, podDesksMap, podId, s.id)) {
      assignedStudentIds.add(s.id);
    }
  });

  // 4. Any leftovers (shouldn't normally happen) fill remaining empty desks
  const unplaced = students.filter((s) => !assignedStudentIds.has(s.id));
  const remainingDesks = activeDesks.filter((d) => assignment[d.id] === null);
  unplaced.forEach((st, idx) => {
    if (remainingDesks[idx]) assignment[remainingDesks[idx].id] = st.id;
  });

  optimizeArrangement(assignment, activeDesks, students, constraints, priorityMode, pastAssignments);
  return assignment;
}

/**
 * Hill-climbing heuristic: randomly swaps two students between desks
 * (i.e. between groups) and keeps the swap only if it improves the
 * weighted evaluation objective (optionally emphasized by priorityMode).
 */
function optimizeArrangement(
  assignment: Record<string, string | null>,
  activeDesks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  priorityMode: PriorityMode,
  pastAssignments?: Record<string, string | null>[]
) {
  const fixedDeskIds = new Set(constraints.fixedSeats.map((fs) => fs.deskId));
  const deskList = activeDesks.filter((d) => !fixedDeskIds.has(d.id));

  let bestEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);

  for (let iter = 0; iter < 150; iter++) {
    if (deskList.length < 2) break;
    const idx1 = Math.floor(Math.random() * deskList.length);
    let idx2 = Math.floor(Math.random() * deskList.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * deskList.length);

    const d1 = deskList[idx1];
    const d2 = deskList[idx2];
    if (d1.podId === d2.podId) continue; // swapping within the same group is a no-op

    const temp = assignment[d1.id];
    assignment[d1.id] = assignment[d2.id];
    assignment[d2.id] = temp;

    const newEval = evaluateArrangement(assignment, activeDesks, students, constraints, pastAssignments);

    let isBetter: boolean;
    if (priorityMode === 'scoreBalance') {
      isBetter = newEval.overallScore * 0.5 + newEval.scoreBalanceScore * 0.5 > bestEval.overallScore * 0.5 + bestEval.scoreBalanceScore * 0.5;
    } else if (priorityMode === 'cooperation') {
      isBetter = newEval.overallScore * 0.5 + newEval.cooperationBalanceScore * 0.5 > bestEval.overallScore * 0.5 + bestEval.cooperationBalanceScore * 0.5;
    } else if (priorityMode === 'intimacy') {
      isBetter = newEval.overallScore * 0.5 + newEval.intimacyDispersionScore * 0.5 > bestEval.overallScore * 0.5 + bestEval.intimacyDispersionScore * 0.5;
    } else {
      isBetter = newEval.overallScore > bestEval.overallScore;
    }

    if (isBetter) {
      bestEval = newEval;
    } else {
      assignment[d2.id] = assignment[d1.id];
      assignment[d1.id] = temp;
    }
  }
}

/**
 * Candidate 4 baseline: same tiered seeding as the other candidates, hill
 * climbed with the neutral 'balanced' objective. Kept as a distinct
 * function so callers that only need "one reasonable arrangement" (e.g. no
 * CRA / no score data at all) have a clear entry point.
 */
export function generateRandomArrangement(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  pastAssignments?: Record<string, string | null>[]
): Record<string, string | null> {
  return generateSingleArrangement(desks, students, constraints, 'balanced', pastAssignments);
}

/**
 * Generates candidate group arrangements. When neither CRA nor score data is
 * present, only a single constraint/gender-balanced candidate is offered.
 */
export function generateCandidateArrangements(
  desks: DeskPosition[],
  students: CraStudent[],
  constraints: SeatingConstraints,
  pastAssignments?: Record<string, string | null>[],
  dimensions?: GridDimensions
): SeatingResult[] {
  let activeDesks = desks.filter((d) => !d.disabled);
  if (students.length > 0 && activeDesks.length < students.length) {
    desks.forEach((d, idx) => {
      if (idx < students.length) d.disabled = false;
    });
    activeDesks = desks.filter((d) => !d.disabled);
  }

  // If total desk capacity (numGroups x groupSize) is still short of the
  // student count, grow existing pods round-robin instead of silently
  // dropping students from the arrangement.
  if (activeDesks.length < students.length) {
    const podIds = Array.from(
      new Set(desks.filter((d) => d.podId !== undefined).map((d) => d.podId!))
    ).sort((a, b) => a - b);
    const deficit = students.length - activeDesks.length;
    for (let i = 0; i < deficit; i++) {
      const targetPodId = podIds.length > 0 ? podIds[i % podIds.length] : 0;
      const podSampleDesk = desks.find((d) => d.podId === targetPodId);
      desks.push({
        id: `desk_overflow_${targetPodId}_${i}`,
        row: podSampleDesk ? podSampleDesk.row : 0,
        col: podSampleDesk ? podSampleDesk.col : 0,
        podId: targetPodId,
        disabled: false,
      });
    }
    activeDesks = desks.filter((d) => !d.disabled);
  }

  const opt4Assignments = generateSingleArrangement(desks, students, constraints, 'balanced', pastAssignments);
  const opt4Result: SeatingResult = {
    id: 'opt_4',
    title: '후보 4: 기본 균형 배치안',
    description: '성비, 고정 배치, 같이/따로 조건과 성적·협력 균형을 함께 고려한 배치안입니다.',
    date: new Date().toLocaleDateString('ko-KR'),
    assignments: opt4Assignments,
    metrics: evaluateArrangement(opt4Assignments, desks, students, constraints, pastAssignments),
    desks,
    dimensions,
    groupAverages: computeGroupAverages(opt4Assignments, desks, students),
  };

  const craAvailable = hasCraData(students);
  if (!craAvailable) {
    return [opt4Result];
  }

  const opt1Assignments = generateSingleArrangement(desks, students, constraints, 'cooperation', pastAssignments);
  const opt2Assignments = generateSingleArrangement(desks, students, constraints, 'scoreBalance', pastAssignments);
  const opt3Assignments = generateSingleArrangement(desks, students, constraints, 'intimacy', pastAssignments);

  return [
    {
      id: 'opt_1',
      title: '후보 1: 기능적 협력 균형형',
      description: '모둠활동 협업 선호도(가중점수)가 각 모둠에 고르게 분산되도록 우선한 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt1Assignments,
      metrics: evaluateArrangement(opt1Assignments, desks, students, constraints, pastAssignments),
      desks,
      dimensions,
      groupAverages: computeGroupAverages(opt1Assignments, desks, students),
    },
    {
      id: 'opt_2',
      title: '후보 2: 성적 균형 우선형',
      description: '모둠 간 평균 성적 차이가 최소화되도록 우선한 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt2Assignments,
      metrics: evaluateArrangement(opt2Assignments, desks, students, constraints, pastAssignments),
      desks,
      dimensions,
      groupAverages: computeGroupAverages(opt2Assignments, desks, students),
    },
    {
      id: 'opt_3',
      title: '후보 3: 정서적 친밀감 분산형',
      description: '기존 친밀 소집단이 한 모둠에 몰리지 않도록 분산시킨 배치안입니다.',
      date: new Date().toLocaleDateString('ko-KR'),
      assignments: opt3Assignments,
      metrics: evaluateArrangement(opt3Assignments, desks, students, constraints, pastAssignments),
      desks,
      dimensions,
      groupAverages: computeGroupAverages(opt3Assignments, desks, students),
    },
    opt4Result,
  ];
}
