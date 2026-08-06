export type Gender = 'M' | 'F';

export interface CraStudent {
  id: string;
  studentNumber?: string; // 학번 (예: 10101 또는 1)
  name: string;
  gender: Gender;
  score?: number; // 성적 (선택 입력)
  pastSeatInfo?: string; // 이전 자리배치 기록 (예: 1열 2행 / 홍길동)
  notes?: string; // 비고 및 특이사항 (청력, 특별 지도 등)
  // [0_전체_통합]
  totalNominated: number;
  totalWeighted: number;
  totalMediator: number;
  totalGroup: string;
  // [1_정서적_친밀감]
  intimacyNominated: number;
  intimacyWeighted: number;
  intimacyMediator: number;
  intimacyGroup: string;
  // [2_기능적_협력] - 모둠활동 협업 선호도/역량 proxy로 사용
  cooperationNominated: number;
  cooperationWeighted: number;
  cooperationMediator: number;
  cooperationGroup: string;
  // [3_사회적_영향력]
  influenceNominated: number;
  influenceWeighted: number;
  influenceMediator: number;
  influenceGroup: string;
}

export type LayoutType = 'pods3' | 'pods4' | 'pods6' | 'custom';

export interface DeskPosition {
  id: string; // e.g. "desk_0_0"
  row: number;
  col: number;
  podId?: number; // 그룹(모둠) ID
  disabled: boolean; // if true, seat is unoccupied / empty
}

export interface GridDimensions {
  rows: number;
  cols: number;
  rowAisles?: number[]; // indices of rows after which an aisle gap is inserted
  colAisles?: number[]; // indices of cols after which an aisle gap is inserted
}

export interface GroupLayoutConfig {
  groupSize: 3 | 4 | 6; // 모둠당 인원수 프리셋
  numGroups: number; // 교사가 직접 지정하는 모둠 수
  podGridCols?: number; // 모둠을 가로로 몇 열로 배치할지 (미지정 시 자동 정사각형에 가깝게 배치)
}

export interface SavedLayoutPreset {
  id: string;
  name: string;
  type: LayoutType;
  dimensions: GridDimensions;
  desks: DeskPosition[];
}

export type GenderRule = 'even_distribution' | 'random';

export interface FixedSeatConstraint {
  studentId: string;
  deskId: string;
}

export interface PairConstraint {
  student1Id: string;
  student2Id: string;
  type: 'must_together' | 'must_separate';
}

export interface AlgorithmWeights {
  intimacyWeight: number; // 정서적 친밀감 분산 비중 (%)
  cooperationWeight: number; // 기능적 협력(협업 선호도) 균등 비중 (%)
  influenceWeight: number; // 사회적 영향력 균등 비중 (%)
  scoreBalanceWeight: number; // 성적 균형 비중 (%)
}

export interface SeatingConstraints {
  genderRule: GenderRule;
  fixedSeats: FixedSeatConstraint[];
  pairConstraints: PairConstraint[];
  avoidPastNeighbors: boolean;
  separateIntimacyCliques: boolean;
  separateHighInfluence: boolean;
  algorithmWeights?: AlgorithmWeights;
  pastSeatingFileContent?: Record<string, string>; // past assignments map (studentId -> neighborId or deskId)
}

export interface SeatingResult {
  id: string;
  title: string;
  description: string;
  date: string;
  // Map deskId -> studentId (or null if empty)
  assignments: Record<string, string | null>;
  desks?: DeskPosition[];
  dimensions?: GridDimensions;
  metrics: {
    scoreBalanceScore: number; // 0~100, 성적 분산 없음
    cooperationBalanceScore: number; // 0~100, 협력 가중점수 분산
    intimacyDispersionScore: number; // 0~100
    influenceBalanceScore: number; // 0~100
    constraintSatisfactionScore: number; // 0~100
    overallScore: number; // 0~100
  };
  groupAverages?: Record<number, { score: number | null; cooperation: number | null }>; // podId -> 모둠 평균
}

export type ViewPerspective = 'student' | 'teacher'; // student: top=board, teacher: bottom=board

