import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  CraStudent,
  DeskPosition,
  GridDimensions,
  SeatingResult,
  ViewPerspective,
  SeatingConstraints,
} from '../types';
import {
  Sparkles,
  Printer,
  Save,
  Eye,
  RefreshCw,
  Download,
  Dices,
  CheckCircle2,
  HelpCircle,
  Info,
  Shuffle,
  Grid,
  Edit3,
} from 'lucide-react';
import {
  generateRandomArrangement,
  generateSingleArrangement,
  evaluateArrangement,
  computeGroupAverages,
  computeStudentTiers,
  CANDIDATE_PRIORITY_MODE,
} from '../utils/groupAlgorithm';
import { printSeatingChart } from '../utils/printUtils';

interface ResultViewProps {
  candidates: SeatingResult[];
  selectedCandidateId: string;
  setSelectedCandidateId: (id: string) => void;
  desks: DeskPosition[];
  students: CraStudent[];
  dimensions: GridDimensions;
  perspective: ViewPerspective;
  setPerspective: (p: ViewPerspective) => void;
  constraints: SeatingConstraints;
  onSaveToHistory: (result: SeatingResult) => void;
  onUpdateCandidateAssignments: (
    candidateId: string,
    newAssignments: Record<string, string | null>
  ) => void;
  onUpdateCandidate: (candidateId: string, updatedCandidate: SeatingResult) => void;
  pastAssignments: Record<string, string | null>[];
}

const POD_COLORS = [
  { border: 'border-indigo-500', bg: 'bg-indigo-500/10', badge: 'bg-indigo-500 text-white' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500 text-white' },
  { border: 'border-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-500 text-slate-950' },
  { border: 'border-purple-500', bg: 'bg-purple-500/10', badge: 'bg-purple-500 text-white' },
  { border: 'border-rose-500', bg: 'bg-rose-500/10', badge: 'bg-rose-500 text-white' },
  { border: 'border-cyan-500', bg: 'bg-cyan-500/10', badge: 'bg-cyan-500 text-slate-950' },
  { border: 'border-lime-500', bg: 'bg-lime-500/10', badge: 'bg-lime-500 text-slate-950' },
  { border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/10', badge: 'bg-fuchsia-500 text-white' },
];

const getPodColor = (podId: number | undefined) =>
  POD_COLORS[podId !== undefined ? podId % POD_COLORS.length : 0];

// Tier chips are a screen-only readout of each student's ranking bracket (Tier 1 = top of
// the metric the current candidate was seeded by) - never shown on the printed 모둠 배치표.
const TIER_BADGE_COLORS = [
  'bg-amber-400 text-slate-950',
  'bg-sky-400 text-slate-950',
  'bg-violet-400 text-slate-950',
  'bg-slate-400 text-slate-950',
];
const getTierColor = (tier: number) => TIER_BADGE_COLORS[Math.min(tier, TIER_BADGE_COLORS.length) - 1];
const TIER_METRIC_LABEL: Record<string, string> = {
  scoreBalance: '성적',
  cooperation: '협력 선호도',
  intimacy: '친밀감',
  balanced: '균형(성적/협력)',
};

export const ResultView: React.FC<ResultViewProps> = ({
  candidates,
  selectedCandidateId,
  setSelectedCandidateId,
  desks,
  students,
  dimensions,
  perspective,
  setPerspective,
  constraints,
  onSaveToHistory,
  onUpdateCandidateAssignments,
  onUpdateCandidate,
  pastAssignments,
}) => {
  const currentCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));

  // Swap state for manual drag/click adjustment
  const [selectedDeskForSwap, setSelectedDeskForSwap] = useState<string | null>(null);
  const [highlightedGroup, setHighlightedGroup] = useState<string | null>(null);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [printPerspective, setPrintPerspective] = useState<ViewPerspective>('student');
  const [printListPosition, setPrintListPosition] = useState<'none' | 'left' | 'right'>('right');
  const [isScoreModalOpen, setIsScoreModalOpen] = useState<boolean>(false);
  const [printTitle, setPrintTitle] = useState<string>('2학년 1반 학습모둠 배치표');
  const [printSubtitle, setPrintSubtitle] = useState<string>(
    '서로 존중하며 다정하게 대화하는 즐거운 교실 환경을 만듭니다.'
  );

  // Student list sorted by studentNumber ascending
  const sortedStudentsForList = [...students].sort((a, b) => {
    const numA = parseInt(a.studentNumber || '0', 10);
    const numB = parseInt(b.studentNumber || '0', 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB; // 오름차순
    }
    return (a.studentNumber || '').localeCompare(b.studentNumber || '');
  });

  // Reshuffle candidate 1, 2, 3, or 4
  const handleReshuffleCandidate = (candId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let newAssignments: Record<string, string | null>;
    if (candId === 'opt_1') {
      newAssignments = generateSingleArrangement(desks, students, constraints, 'cooperation', pastAssignments);
    } else if (candId === 'opt_2') {
      newAssignments = generateSingleArrangement(desks, students, constraints, 'scoreBalance', pastAssignments);
    } else if (candId === 'opt_3') {
      newAssignments = generateSingleArrangement(desks, students, constraints, 'intimacy', pastAssignments);
    } else {
      newAssignments = generateRandomArrangement(desks, students, constraints, pastAssignments);
    }

    const newMetrics = evaluateArrangement(newAssignments, desks, students, constraints, pastAssignments);
    const existingCand = candidates.find((c) => c.id === candId) || currentCandidate;

    const updatedCand: SeatingResult = {
      ...existingCand,
      assignments: newAssignments,
      metrics: newMetrics,
      date: new Date().toLocaleDateString('ko-KR'),
      desks,
      dimensions,
      groupAverages: computeGroupAverages(newAssignments, desks, students),
    };

    onUpdateCandidate(candId, updatedCand);
    setSelectedCandidateId(candId);
  };

  // Build a snapshot of {id, name, studentNumber, gender} for students referenced in an
  // assignment map. Embedding this lets a backup be restored by name/studentNumber later,
  // even after student IDs are regenerated in a new session (IDs are minted fresh from
  // Date.now() on each upload).
  const buildStudentRoster = (assignments: Record<string, string | null>) => {
    const referencedIds = new Set(Object.values(assignments).filter(Boolean) as string[]);
    return students
      .filter((s) => referencedIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, studentNumber: s.studentNumber, gender: s.gender }));
  };

  // Export JSON Backup file containing layout & student assignments
  const handleExportJSON = (cand: SeatingResult) => {
    const exportData = {
      version: '1.0',
      title: cand.title,
      date: cand.date,
      id: cand.id,
      assignments: cand.assignments,
      metrics: cand.metrics,
      desks: cand.desks || desks,
      dimensions: cand.dimensions || dimensions,
      studentRoster: cand.studentRoster || buildStudentRoster(cand.assignments),
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = cand.title.replace(/[/\\?%*:|"<>]/g, '_');
    a.download = `${cleanTitle}_배치도백업.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentCandidate) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">아직 생성된 자리배치 후보가 없습니다</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          <strong>3단계 [제약조건 & 알고리즘 설정]</strong> 메뉴에서 <strong>[자리후보 생성하기]</strong> 버튼을 눌러 자리배치 후보를 생성해 주세요!
        </p>
      </div>
    );
  }

  const assignments = currentCandidate.assignments;
  const groupAverages = currentCandidate.groupAverages || computeGroupAverages(assignments, desks, students);
  const groupNumbers = Array.from(new Set(desks.filter((d) => !d.disabled && d.podId !== undefined).map((d) => d.podId!))).sort((a, b) => a - b);
  // Which metric this candidate was seeded/tiered by (see CANDIDATE_PRIORITY_MODE) - shown
  // on-screen only as a "Tier N" chip so teachers can see each student's ranking bracket;
  // intentionally left out of the printed 모둠 배치표 (see printUtils.ts).
  const tierPriorityMode = CANDIDATE_PRIORITY_MODE[currentCandidate.id] || 'balanced';
  const tierOf = computeStudentTiers(students, constraints, tierPriorityMode, groupNumbers.length);
  const tierCount = tierOf.size > 0 ? Math.max(...tierOf.values()) : 0;

  const handleDeskClick = (deskId: string) => {
    if (selectedDeskForSwap === null) {
      setSelectedDeskForSwap(deskId);
    } else if (selectedDeskForSwap === deskId) {
      setSelectedDeskForSwap(null);
    } else {
      // Swap two students
      const student1 = assignments[selectedDeskForSwap];
      const student2 = assignments[deskId];

      const newAssignments = {
        ...assignments,
        [selectedDeskForSwap]: student2,
        [deskId]: student1,
      };

      onUpdateCandidateAssignments(currentCandidate.id, newAssignments);
      setSelectedDeskForSwap(null);
    }
  };

  // Export Individual Candidate Result in exact Menu 1 Basic List Excel Format
  const handleExportToExcel = (cand: SeatingResult) => {
    const exportRows: any[][] = [
      ['학번', '이름', '성별', '성적', '배정 모둠', '비고'],
    ];

    // Build map from deskId to desk position
    const deskMap = new Map<string, DeskPosition>(desks.map((d) => [d.id, d]));

    students.forEach((s) => {
      // Find desk assigned to this student
      const assignedDeskId = Object.keys(cand.assignments).find(
        (dId) => cand.assignments[dId] === s.id
      );

      let groupText = '미배치';
      if (assignedDeskId) {
        const d = deskMap.get(assignedDeskId);
        if (d && d.podId !== undefined) {
          groupText = `모둠 ${d.podId + 1}`;
        }
      }

      const genderKo = s.gender === 'F' ? '여' : '남';
      exportRows.push([
        s.studentNumber || '',
        s.name,
        genderKo,
        typeof s.score === 'number' ? s.score : '',
        groupText,
        s.notes || '',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '모둠배치결과');
    const fileName = `${cand.title.replace(/[/\\?%*:|"<>]/g, '_')}_배치결과.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Candidate 4 Pure Random Refresh Handler
  const handleRefreshCandidate4 = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newRandomAssignments = generateRandomArrangement(desks, students, constraints, pastAssignments);
    const newMetrics = evaluateArrangement(newRandomAssignments, desks, students, constraints, pastAssignments);

    const cand4 = candidates.find((c) => c.id === 'opt_4') || currentCandidate;

    const updatedCand: SeatingResult = {
      ...cand4,
      id: 'opt_4',
      title: '후보 4: 기본 균형 배치안',
      description: '성비, 고정 배치, 같이/따로 조건과 성적·협력 균형을 함께 고려해 다시 섞은 배치안입니다.',
      assignments: newRandomAssignments,
      metrics: newMetrics,
      date: new Date().toLocaleDateString('ko-KR'),
      groupAverages: computeGroupAverages(newRandomAssignments, desks, students),
    };

    onUpdateCandidate('opt_4', updatedCand);
    setSelectedCandidateId('opt_4');
  };

  // Sort rows based on perspective
  const rowIndices = Array.from({ length: dimensions.rows }).map((_, i) => i);
  if (perspective === 'teacher') {
    rowIndices.reverse();
  }

  const printRowIndices = Array.from({ length: dimensions.rows }).map((_, i) => i);
  if (printPerspective === 'teacher') {
    printRowIndices.reverse();
  }

  return (
    <div className="space-y-6">
      {/* Printable View Overlay */}
      {isPrintMode && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 flex items-start justify-center printable-area-wrapper">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-2xl max-w-5xl w-full my-auto flex flex-col space-y-5 printable-area">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  🖨️ 학급 모둠 배치 인쇄용 도면 ({currentCandidate.title})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  모둠별 카드로 묶어 <strong>모둠 번호, 학번, 이름</strong>과 모둠 평균 성적·협력 점수를 함께 출력합니다.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button
                  onClick={() =>
                    setPrintPerspective(printPerspective === 'student' ? 'teacher' : 'student')
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">
                    {printPerspective === 'student' ? '학생 시점 보기' : '교사 시점 보기'}
                  </span>
                  <span className="sm:hidden">
                    {printPerspective === 'student' ? '학생시점' : '교사시점'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (currentCandidate) {
                      printSeatingChart({
                        title: printTitle || currentCandidate.title,
                        subtitle: printSubtitle,
                        perspective: printPerspective,
                        result: currentCandidate,
                        students,
                        defaultDesks: desks,
                        defaultDimensions: dimensions,
                        listPosition: printListPosition,
                      });
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>인쇄하기 (Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintMode(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* Printable Header Text Editor */}
            <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-2xl space-y-3 shrink-0 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>인쇄물 상단에 인쇄될 제목 및 설명글 입력</span>
                </div>
                <span className="text-[11px] font-bold text-indigo-700">
                  ※ 인쇄 설명글은 선생님께서 자유롭게 수정하실 수 있습니다.
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    인쇄 제목
                  </label>
                  <input
                    type="text"
                    value={printTitle}
                    onChange={(e) => setPrintTitle(e.target.value)}
                    placeholder="예: 2학년 1반 3월 학습모둠 배치표"
                    className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    인쇄 설명글 (줄바꿈 지원)
                  </label>
                  <textarea
                    value={printSubtitle}
                    onChange={(e) => setPrintSubtitle(e.target.value)}
                    rows={2}
                    placeholder="예: 서로 존중하며 다정하게 대화하는 교실 환경&#10;선생님이 자유롭게 수정하세요."
                    className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                  />
                </div>
              </div>

              {/* Row 2: Student List Position Selector */}
              <div className="pt-2 border-t border-indigo-200/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800">
                    📋 학생 명단 표 함께 인쇄
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    · 모둠 배치표 옆에 학생 이름표를 함께 출력합니다
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrintListPosition('none')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      printListPosition === 'none'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    표 없음
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintListPosition('left')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      printListPosition === 'left'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    좌측 표
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintListPosition('right')}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      printListPosition === 'right'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    우측 표
                  </button>
                </div>
              </div>
            </div>

            {/* Print Only Header Banner */}
            <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-2xl font-black text-slate-900">{printTitle || currentCandidate.title}</h1>
              {printSubtitle && (
                <p className="text-sm font-semibold text-slate-700 mt-1 whitespace-pre-line">{printSubtitle}</p>
              )}
              <div className="text-xs text-slate-500 mt-1.5">
                배치 일자: {currentCandidate.date} | 시점: {printPerspective === 'student' ? '학생 시선 (칠판 상단)' : '교사 시선 (칠판 하단)'}
              </div>
            </div>

            {/* Print Layout Area: Optional Student List Table + Seating Grid */}
            <div className={`flex flex-col md:flex-row items-center md:items-start justify-center gap-6 py-2 sm:py-3 w-full overflow-x-auto ${
              printListPosition === 'right' ? 'md:flex-row-reverse' : ''
            }`}>
              {/* Optional Student List Table Preview */}
              {printListPosition !== 'none' && (
                <div className="w-36 border-2 border-slate-800 rounded-2xl p-2.5 bg-slate-50 shrink-0 self-center md:self-start text-xs font-sans shadow-2xs">
                  <div className="font-black text-slate-900 text-center border-b-2 border-slate-800 pb-1 mb-1.5 text-xs">
                    학생 명단
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    <table className="w-full text-center text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 bg-slate-200 text-slate-900 font-extrabold text-[10px]">
                          <th className="py-0.5 px-1">학번</th>
                          <th className="py-0.5 px-1">이름</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedStudentsForList.map((s) => (
                          <tr key={`print_preview_tbl_${s.id}`} className="border-b border-slate-200 odd:bg-white even:bg-slate-100/80 text-[11px]">
                            <td className="py-0.5 px-1 font-mono font-extrabold text-indigo-900">{s.studentNumber || '-'}</td>
                            <td className="py-0.5 px-1 font-black text-slate-800">{s.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Seating Layout Area (Blackboard + Desks) */}
              <div className="flex flex-col items-center gap-3">
                {printPerspective === 'student' && (
                  <div className="w-full text-center py-2 border-2 border-slate-800 rounded-2xl bg-slate-50 font-black text-slate-900 text-xs sm:text-sm print:border-slate-900">
                    [ 칠 판 / 교 탁 (교실 앞) ]
                  </div>
                )}

                {/* Main Grid: Pure Student Number + Student Name Only with Aisles */}
                <div className="flex flex-col items-center gap-2">
                  {printRowIndices.map((r) => {
                    const hasRowAisle = dimensions.rowAisles?.includes(r);
                    return (
                      <React.Fragment key={`print_r_${r}`}>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {Array.from({ length: dimensions.cols }).map((_, c) => {
                            const hasColAisle = dimensions.colAisles?.includes(c);
                            const desk = desks.find((d) => d.row === r && d.col === c);

                            return (
                              <React.Fragment key={`print_d_${r}_${c}`}>
                                {desk && !desk.disabled ? (
                                  <div
                                    className={`w-24 sm:w-28 h-16 sm:h-20 border-2 rounded-xl bg-white p-1 flex flex-col justify-center items-center text-center shadow-2xs shrink-0 ${getPodColor(desk.podId).border}`}
                                  >
                                    <div className={`text-[9px] font-black px-1.5 py-0.5 rounded-full mb-0.5 ${getPodColor(desk.podId).badge}`}>
                                      모둠 {desk.podId !== undefined ? desk.podId + 1 : '-'}
                                    </div>
                                    {assignments[desk.id] ? (
                                      <>
                                        <div className="text-[10px] font-extrabold text-indigo-800 font-mono leading-none">
                                          {studentMap.get(assignments[desk.id]!)?.studentNumber || ''}
                                        </div>
                                        <div className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-tight">
                                          {studentMap.get(assignments[desk.id]!)?.name}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400 font-bold">빈 좌석</span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-24 sm:w-28 h-16 sm:h-20 border border-dashed border-slate-300 rounded-xl bg-slate-50 opacity-40 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                                    빈 공간
                                  </div>
                                )}

                                {/* Col Aisle Gap */}
                                {hasColAisle && (
                                  <div className="w-4 sm:w-5 h-16 sm:h-20 border-l border-r border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-[9px] text-slate-400 font-bold shrink-0" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {/* Row Aisle Gap */}
                        {hasRowAisle && (
                          <div className="h-3 sm:h-4 w-full border-t border-b border-dashed border-slate-200 bg-slate-50/50 my-0.5 flex items-center justify-center text-[9px] text-slate-400 font-bold" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {printPerspective === 'teacher' && (
                  <div className="w-full text-center py-2 border-2 border-slate-800 rounded-2xl bg-slate-50 font-black text-slate-900 text-xs sm:text-sm print:border-slate-900">
                    [ 칠 판 / 교 탁 (교실 앞 - 교사 시선) ]
                  </div>
                )}
              </div>
            </div>

            {printPerspective === 'teacher' && (
              <div className="text-center py-2.5 border-2 border-slate-800 rounded-2xl bg-slate-50 font-black text-slate-900 text-sm sm:text-base">
                [ 칠 판 / 교 탁 (교실 앞) ]
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Selector Tabs */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">
                4단계: 자리배치 결과 확인 & 변경
              </span>
              <h2 className="text-xl font-black text-slate-800">자리배치 결과 확인 및 수동 변경</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              CRA 관계망 알고리즘으로 생성된 모둠 배치 후보 1~3안과 기본 균형 후보 4안을 비교·수정하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPrintMode(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>모둠 배치 인쇄용 도면</span>
            </button>
          </div>
        </div>

        {/* Candidate Cards Grid (Horizontal Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {candidates.map((cand) => {
            const isSelected = cand.id === selectedCandidateId;
            const isRandomCand = cand.id === 'opt_4';
            // Derive the badge number from the candidate's own id (opt_N) rather than its
            // array position, so it stays consistent with the title even when opt_4 is the
            // only candidate present (no CRA data uploaded).
            const candNumber = parseInt(cand.id.replace('opt_', ''), 10) || 1;

            return (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        isRandomCand
                          ? 'bg-purple-200 text-purple-900'
                          : 'bg-indigo-200 text-indigo-900'
                      }`}
                    >
                      후보 {candNumber} {isRandomCand ? '(랜덤/수동)' : ''}
                    </span>

                    {isSelected ? (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white font-extrabold text-[10px] rounded-full shadow-xs">
                        ✓ 선택됨
                      </span>
                    ) : (
                      <span className="text-[11px] font-black text-indigo-700">
                        종합 {cand.metrics.overallScore}점
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-slate-900 text-xs mt-2.5">
                    {cand.title.replace(/^후보 \d+:\s*/, '')}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {cand.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
                    <div>
                      <span className="text-slate-400">성적 균형:</span>{' '}
                      <span className="text-slate-700 font-extrabold">{cand.metrics.scoreBalanceScore}점</span>
                    </div>
                    <div>
                      <span className="text-slate-400">협력 균형:</span>{' '}
                      <span className="text-emerald-700 font-extrabold">{cand.metrics.cooperationBalanceScore}점</span>
                    </div>
                    <div>
                      <span className="text-slate-400">친밀 분산:</span>{' '}
                      <span className="text-indigo-700 font-extrabold">
                        {cand.metrics.intimacyDispersionScore}점
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">영향력 균형:</span>{' '}
                      <span className="text-purple-700 font-extrabold">
                        {cand.metrics.influenceBalanceScore}점
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const fullCand: SeatingResult = {
                          ...cand,
                          desks: cand.desks || desks,
                          dimensions: cand.dimensions || dimensions,
                          studentRoster: cand.studentRoster || buildStudentRoster(cand.assignments),
                        };
                        onSaveToHistory(fullCand);
                        handleExportToExcel(fullCand);
                        handleExportJSON(fullCand);
                      }}
                      className="py-1.5 px-2 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      title="메뉴 1 양식 엑셀 출력 및 배치도 JSON 백업 파일 다운로드"
                    >
                      <Download className="w-3 h-3 text-emerald-700" />
                      <span>저장</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleReshuffleCandidate(cand.id, e)}
                      className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-extrabold text-[10px] rounded-xl border border-indigo-200 shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer hover:scale-[1.01] active:scale-95"
                      title="동일 제약 조건하에서 조합을 재계산하여 다시 섞습니다"
                    >
                      <RefreshCw className="w-3 h-3 text-indigo-600" />
                      <span>다시 섞기</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Metrics Scoreboard for Current Candidate */}
        <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center flex-1 w-full">
            <div className="p-2 border-r border-slate-800">
              <div className="text-[11px] text-slate-400">종합 평가 점수</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {currentCandidate.metrics.overallScore}{' '}
                <span className="text-xs font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-2 border-r border-slate-800">
              <div className="text-[11px] text-slate-300 font-semibold">📊 성적 균형도</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {currentCandidate.metrics.scoreBalanceScore}점
              </div>
            </div>

            <div className="p-2 border-r border-slate-800">
              <div className="text-[11px] text-emerald-400 font-semibold">🤝 기능적 협력 균형도</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {currentCandidate.metrics.cooperationBalanceScore}점
              </div>
            </div>

            <div className="p-2 border-r border-slate-800">
              <div className="text-[11px] text-indigo-400 font-semibold">🛡️ 정서 친밀감 분산도</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {currentCandidate.metrics.intimacyDispersionScore}점
              </div>
            </div>

            <div className="p-2">
              <div className="text-[11px] text-purple-400 font-semibold">⚡ 사회 영향력 균형도</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {currentCandidate.metrics.influenceBalanceScore}점
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsScoreModalOpen(true)}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs shadow-md flex items-center gap-2 shrink-0 cursor-pointer w-full md:w-auto justify-center"
          >
            <Info className="w-4 h-4 text-amber-300" />
            <span>💡 점수 산출 이유 & 분석 모달</span>
          </button>
        </div>
      </div>

      {/* Classroom Seating Grid Visualizer */}
      <div className="bg-slate-950 p-8 rounded-3xl shadow-2xl border border-slate-800 text-white space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">현재 시점:</span>
            <button
              onClick={() => setPerspective(perspective === 'student' ? 'teacher' : 'student')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {perspective === 'student'
                  ? '🏫 학생 시점 (칠판 상단)'
                  : '👨‍🏫 교사 시점 (칠판 하단)'}
              </span>
            </button>

            <button
              onClick={() => setIsPrintMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer border border-indigo-500"
              title="A4 양식 학습모둠 배치표 전용 인쇄 창 열기"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>🖨️ 모둠 배치표 인쇄</span>
            </button>
          </div>

          <div className="text-slate-400">
            {selectedDeskForSwap ? (
              <span className="text-amber-400 font-bold animate-pulse">
                👉 위치를 맞바꿀 두 번째 학생 책상을 클릭하세요!
              </span>
            ) : (
              <span>💡 수동 변경: 두 학생 책상을 차례로 클릭하면 위치가 스왑됩니다.</span>
            )}
            {tierCount > 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">
                  🏷️ 좌석의 T1~T{tierCount} 배지: {TIER_METRIC_LABEL[tierPriorityMode]} 기준 상위(T1)~하위(T{tierCount}) 구간 · 화면 전용, 인쇄 시 표시 안 됨
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Blackboard */}
        {perspective === 'student' && (
          <div className="w-full bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl py-3 text-center shadow-lg">
            <span className="text-base font-black text-emerald-400 tracking-widest uppercase">
              [ 칠 판 / 교 탁 (교실 앞) ]
            </span>
          </div>
        )}

        {/* Group Average Summary Bar */}
        <div className="flex flex-wrap gap-2">
          {groupNumbers.map((podId) => {
            const color = getPodColor(podId);
            const avg = groupAverages[podId];
            return (
              <div
                key={`group_summary_${podId}`}
                className={`px-3 py-2 rounded-xl border ${color.border} ${color.bg} flex items-center gap-2 text-[11px] font-bold`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${color.badge}`}>
                  {podId + 1}
                </span>
                <span className="text-slate-200">모둠 {podId + 1}</span>
                {avg?.score !== null && avg?.score !== undefined && (
                  <span className="text-slate-300">· 평균 성적 {avg.score}점</span>
                )}
                {avg?.cooperation !== null && avg?.cooperation !== undefined && (
                  <span className="text-slate-300">· 평균 협력 {avg.cooperation}점</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Classroom Grid */}
        <div className="flex flex-col items-center gap-4 py-4 overflow-x-auto">
          {rowIndices.map((r) => {
            const hasRowAisle = dimensions.rowAisles?.includes(r);
            return (
              <React.Fragment key={`res_r_frag_${r}`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    {Array.from({ length: dimensions.cols }).map((_, c) => {
                      const hasColAisle = dimensions.colAisles?.includes(c);
                      const desk = desks.find((d) => d.row === r && d.col === c);

                      if (!desk || desk.disabled) {
                        return (
                          <React.Fragment key={`empty_res_${r}_${c}`}>
                            <div className="w-28 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 opacity-40 flex items-center justify-center text-[10px] text-slate-600 font-bold">
                              빈 좌석
                            </div>
                            {hasColAisle && <div className="w-6 h-20 bg-slate-800/30 rounded-lg" />}
                          </React.Fragment>
                        );
                      }

                      const studentId = assignments[desk.id];
                      const student = studentId ? studentMap.get(studentId) : null;
                      const isSelectedForSwap = selectedDeskForSwap === desk.id;
                      const podColor = getPodColor(desk.podId);

                      const isGroupHighlighted =
                        highlightedGroup && student && student.intimacyGroup === highlightedGroup;

                      return (
                        <React.Fragment key={desk.id}>
                          <button
                            type="button"
                            onClick={() => handleDeskClick(desk.id)}
                            onMouseEnter={() => student && setHighlightedGroup(student.intimacyGroup)}
                            onMouseLeave={() => setHighlightedGroup(null)}
                            className={`w-28 h-20 rounded-2xl border-2 p-2 flex flex-col justify-between transition-all relative text-left cursor-pointer ${podColor.bg} ${
                              isSelectedForSwap
                                ? 'bg-amber-950/90 border-amber-400 ring-4 ring-amber-400/40 scale-105 z-10'
                                : isGroupHighlighted
                                ? 'border-indigo-400 ring-2 ring-indigo-400/50 scale-102'
                                : `${podColor.border} hover:scale-102`
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span className={`px-1.5 py-0.5 rounded-md font-black ${podColor.badge}`}>
                                모둠 {desk.podId !== undefined ? desk.podId + 1 : '-'}
                              </span>
                              <div className="flex items-center gap-1">
                                {student && tierOf.has(student.id) && (
                                  <span
                                    className={`px-1 py-0.5 rounded font-black text-[9px] leading-none ${getTierColor(
                                      tierOf.get(student.id)!
                                    )}`}
                                    title={`Tier ${tierOf.get(student.id)} / ${tierCount} (${
                                      TIER_METRIC_LABEL[tierPriorityMode]
                                    } 기준)`}
                                  >
                                    T{tierOf.get(student.id)}
                                  </span>
                                )}
                                {student && (
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      student.gender === 'M' ? 'bg-blue-400' : 'bg-pink-400'
                                    }`}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="font-black text-slate-100 text-sm tracking-tight my-auto">
                              {student ? student.name : <span className="text-slate-600 font-normal">빈 자석</span>}
                            </div>

                            {student && (
                              <div className="flex items-center justify-between text-[9px] font-medium text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold truncate max-w-[55px]">
                                  {typeof student.score === 'number' ? `성적 ${student.score}` : student.studentNumber || ''}
                                </span>
                                {/* Student Characteristic Trait Icons */}
                                <div className="flex items-center gap-0.5 text-[11px]">
                                  {(student.influenceWeighted >= 15 || student.influenceNominated >= 5) && (
                                    <span title="리더/핵심 영향력 학생">👑</span>
                                  )}
                                  {student.cooperationWeighted > 0 && (
                                    <span title="기능적 협력(모둠활동 선호도) 지목">🤝</span>
                                  )}
                                  {student.notes && (student.notes.includes('앞자리') || student.notes.includes('청력')) && (
                                    <span title={`특이사항: ${student.notes}`}>📝</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                          {hasColAisle && <div className="w-6 h-20 bg-slate-800/30 rounded-lg" />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                {hasRowAisle && <div className="h-6 w-full bg-slate-800/30 rounded-lg my-1" />}
              </React.Fragment>
            );
          })}
        </div>

        {perspective === 'teacher' && (
          <div className="w-full bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl py-3 text-center shadow-lg">
            <span className="text-base font-black text-emerald-400 tracking-widest uppercase">
              [ 칠 판 / 교 탁 (교실 앞) ]
            </span>
          </div>
        )}
      </div>

      {/* Score Explanation Analysis Modal */}
      {isScoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <Info className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    📊 [{currentCandidate.title}] 점수 산출 상세 분석
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    현재 선택된 자리배치안의 항목별 세부 수치 및 종합 점수 계산 근거
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-900">최종 종합 평가 점수</span>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    제약조건·성비 준수율(30%) + 교사 가중치가 반영된 균형 점수(70%)
                  </p>
                </div>
                <div className="text-3xl font-black text-indigo-600">
                  {currentCandidate.metrics.overallScore}점
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">📊 성적 균형</span>
                    <span className="font-black text-slate-700">{currentCandidate.metrics.scoreBalanceScore}점</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    모둠별 평균 성적의 편차가 작을수록 높은 점수입니다.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900">🤝 기능적 협력 균형</span>
                    <span className="font-black text-emerald-600">{currentCandidate.metrics.cooperationBalanceScore}점</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    모둠별 평균 협력 가중점수(협업 선호도)의 편차가 작을수록 높은 점수입니다.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900">🛡️ 정서적 친밀감 분산</span>
                    <span className="font-black text-indigo-600">{currentCandidate.metrics.intimacyDispersionScore}점</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    단짝 소집단이 같은 모둠에 몰리지 않을수록 산출되는 분산 지수입니다.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-900">⚡ 사회적 영향력 균형</span>
                    <span className="font-black text-purple-600">{currentCandidate.metrics.influenceBalanceScore}점</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    학급 리더십 수치 학생 간 같은 모둠 중복 충돌 회피 점수입니다.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900">🎯 필수 제약조건 준수</span>
                    <span className="font-black text-amber-600">{currentCandidate.metrics.constraintSatisfactionScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    고정석, 같이/따로 앉기, 성별 및 과거 모둠 회피 규칙 성립율입니다.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <span className="font-bold text-slate-900">💡 평가 산출 근거 팁</span>
                <p>
                  3단계 [CRA 알고리즘 옵션] 및 [성적 균형 옵션]에서 슬라이더를 통해 각 지표의 상대적 중요도 비중(%)을 조정하면 최종 종합 점수 산출 방식에 실시간 적용됩니다.
                </p>
              </div>
            </div>

            <div className="text-right border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsScoreModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
