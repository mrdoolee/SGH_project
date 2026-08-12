import React, { useState } from 'react';
import {
  CraStudent,
  DeskPosition,
  GenderRule,
  SeatingConstraints,
  FixedSeatConstraint,
  PairConstraint,
  GridDimensions,
} from '../types';
import {
  SlidersHorizontal,
  UserCheck,
  UserX,
  Pin,
  Sparkles,
  ShieldAlert,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  HeartHandshake,
  Zap,
  TrendingUp,
  History,
  Grid,
} from 'lucide-react';
import { hasCraData, hasScoreData } from '../utils/groupAlgorithm';

interface ConstraintSetupProps {
  students: CraStudent[];
  desks: DeskPosition[];
  dimensions: GridDimensions;
  constraints: SeatingConstraints;
  setConstraints: React.Dispatch<React.SetStateAction<SeatingConstraints>>;
  onGenerateCandidates: () => void;
}

export const ConstraintSetup: React.FC<ConstraintSetupProps> = ({
  students,
  desks,
  dimensions,
  constraints,
  setConstraints,
  onGenerateCandidates,
}) => {
  const activeDesks = desks.filter((d) => !d.disabled);

  // Modal state for algorithm explanation
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);

  // Algorithm weights from constraints
  const weights = constraints.algorithmWeights || {
    intimacyWeight: 30,
    cooperationWeight: 30,
    influenceWeight: 20,
    scoreBalanceWeight: 20,
  };

  const handleWeightChange = (
    key: 'intimacyWeight' | 'cooperationWeight' | 'influenceWeight' | 'scoreBalanceWeight',
    val: number
  ) => {
    const newVal = Math.max(0, Math.min(100, val));
    setConstraints({
      ...constraints,
      algorithmWeights: {
        ...weights,
        [key]: newVal,
      },
    });
  };
  // Local states for adding constraints
  const [selectedStudentForFix, setSelectedStudentForFix] = useState<string>('');
  const [student1ForPair, setStudent1ForPair] = useState<string>('');
  const [student2ForPair, setStudent2ForPair] = useState<string>('');
  const [pairType, setPairType] = useState<'must_together' | 'must_separate'>('must_together');

  // Handle clicking a desk in visual grid for seat locking
  const handleDeskClickForFix = (deskId: string) => {
    if (!selectedStudentForFix) {
      alert('먼저 고정할 학생을 위에서 선택해 주세요.');
      return;
    }

    // Remove any existing fixed seat for this student or this desk
    const filtered = constraints.fixedSeats.filter(
      (f) => f.studentId !== selectedStudentForFix && f.deskId !== deskId
    );

    setConstraints({
      ...constraints,
      fixedSeats: [...filtered, { studentId: selectedStudentForFix, deskId }],
    });

    setSelectedStudentForFix('');
  };

  const handleRemoveFixedSeat = (index: number) => {
    const updated = [...constraints.fixedSeats];
    updated.splice(index, 1);
    setConstraints({ ...constraints, fixedSeats: updated });
  };

  // Handle adding pair constraint
  const handleAddPairConstraint = () => {
    if (!student1ForPair || !student2ForPair || student1ForPair === student2ForPair) {
      alert('서로 다른 두 학생을 선택해 주세요.');
      return;
    }

    setConstraints({
      ...constraints,
      pairConstraints: [
        ...constraints.pairConstraints,
        { student1Id: student1ForPair, student2Id: student2ForPair, type: pairType },
      ],
    });
    setStudent1ForPair('');
    setStudent2ForPair('');
  };

  const handleRemovePairConstraint = (index: number) => {
    const updated = [...constraints.pairConstraints];
    updated.splice(index, 1);
    setConstraints({ ...constraints, pairConstraints: updated });
  };

  const getStudentName = (id: string) => {
    return students.find((s) => s.id === id)?.name || id;
  };

  const getDeskLabel = (deskId: string) => {
    const d = desks.find((desk) => desk.id === deskId);
    if (!d) return deskId;
    return `모둠 ${d.podId !== undefined ? d.podId + 1 : '-'} 자리`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
              3단계: 제약조건 & 알고리즘 설정
            </span>
            <h2 className="text-xl font-black text-slate-800">제약 조건 설정 및 자리배치 알고리즘 설정</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            배치도 판을 직접 클릭하여 학생 자리를 고정하고, 자리 배치의 제약 조건 설정 및 관계망 알고리즘의 가중치를 지정합니다.
          </p>
        </div>

        <button
          onClick={onGenerateCandidates}
          className="flex items-center gap-2 px-6 py-3.5 text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-xl shadow-indigo-200 transition-all cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span>자리후보 생성하기</span>
        </button>
      </div>

      <div className="space-y-6 flex flex-col w-full">
        {/* 1. Visual Desk Locking Grid */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Pin className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800">1. 특정 학생 자리 고정 (직접 클릭)</h3>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-black bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
              🔒 자리배치 필수 조건
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Step 1: 고정할 학생을 먼저 선택하세요
              </label>
              <select
                value={selectedStudentForFix}
                onChange={(e) => setSelectedStudentForFix(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">-- 학생 선택 (특이사항) --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentNumber ? `${s.studentNumber} ` : ''}
                    {s.name} {s.notes ? `(${s.notes})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-indigo-600 font-bold">
              Step 2: 아래 교실 배치판에서 학생이 앉을 책상을 클릭하면 고정됩니다.
            </p>

            {/* Interactive Visual Grid with Exact Step 2 Layout & Aisles */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white overflow-x-auto">
              <div className="text-center pb-2 text-[10px] font-black text-emerald-400 tracking-widest border-b border-slate-800 mb-3">
                [ 칠 판 / 교 탁 (앞) ]
              </div>

              <div className="flex flex-col items-center gap-2">
                {Array.from({ length: dimensions.rows }).map((_, r) => {
                  const hasRowAisle = dimensions.rowAisles?.includes(r);
                  return (
                    <React.Fragment key={`r_frag_${r}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono w-4">{r + 1}행</span>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: dimensions.cols }).map((_, c) => {
                            const hasColAisle = dimensions.colAisles?.includes(c);
                            const desk = desks.find((d) => d.row === r && d.col === c);

                            if (!desk || desk.disabled) {
                              return (
                                <React.Fragment key={`empty_${r}_${c}`}>
                                  <div className="w-16 h-14 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 opacity-40 flex items-center justify-center text-[9px] text-slate-600 font-bold">
                                    통로
                                  </div>
                                  {hasColAisle && <div className="w-4 h-14 bg-slate-800/20 rounded-md" />}
                                </React.Fragment>
                              );
                            }

                            const fixed = constraints.fixedSeats.find((f) => f.deskId === desk.id);
                            const fixedStudent = fixed ? students.find((s) => s.id === fixed.studentId) : null;

                            return (
                              <React.Fragment key={desk.id}>
                                <button
                                  type="button"
                                  onClick={() => handleDeskClickForFix(desk.id)}
                                  className={`w-16 h-14 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                                    fixed
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                                      : 'bg-indigo-950/60 border-indigo-700/60 hover:border-indigo-400 text-slate-300'
                                  }`}
                                >
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    모둠 {desk.podId !== undefined ? desk.podId + 1 : '-'}
                                  </span>
                                  {fixedStudent ? (
                                    <span className="text-xs font-black text-amber-300 truncate w-full text-center">
                                      📌 {fixedStudent.name}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400">클릭 고정</span>
                                  )}
                                </button>
                                {hasColAisle && <div className="w-4 h-14 bg-slate-800/20 rounded-md" />}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                      {hasRowAisle && <div className="h-4 w-full bg-slate-800/20 rounded-md my-1" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Locked Seats Summary */}
            <div className="space-y-1.5 pt-2">
              {constraints.fixedSeats.map((fs, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900"
                >
                  <span>
                    📌 {getStudentName(fs.studentId)} ➔ {getDeskLabel(fs.deskId)} 고정
                  </span>
                  <button
                    onClick={() => handleRemoveFixedSeat(idx)}
                    className="text-amber-700 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* 2. Pair Rules (Hard Constraint) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800">2. 같이/따로 앉기 관계 지정</h3>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-black bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                🔒 자리배치 필수 조건
              </span>
            </div>

            {/* Group-membership Scope Notice Box */}
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-1.5 text-xs text-indigo-950">
              <div className="flex items-start gap-2">
                <Grid className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-indigo-950">📐 같은 모둠 소속 여부 기준 원칙:</span>
                  <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                    '같이 앉기'는 <strong className="font-extrabold text-indigo-950">같은 모둠(그룹)에 배정되는 것</strong>을, '따로 앉기'는 서로 다른 모둠에 배정되는 것을 의미합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={student1ForPair}
                  onChange={(e) => setStudent1ForPair(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- 학생 1 선택 --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={student2ForPair}
                  onChange={(e) => setStudent2ForPair(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">-- 학생 2 선택 --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pairType}
                  onChange={(e) => setPairType(e.target.value as any)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="must_together">🤝 필수 짝/가깝게 배치 (같이 앉기)</option>
                  <option value="must_separate">🚫 반드시 떨어뜨리기 (같이 앉지 않기)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddPairConstraint}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </button>
              </div>
            </div>

            {/* Pair Constraints List */}
            <div className="space-y-1.5">
              {constraints.pairConstraints.map((pc, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold ${
                    pc.type === 'must_together'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                      : 'bg-rose-50 border-rose-100 text-rose-900'
                  }`}
                >
                  <span>
                    {pc.type === 'must_together' ? '🤝 함께 배치: ' : '🚫 떨어뜨리기: '}
                    {getStudentName(pc.student1Id)} ↔ {getStudentName(pc.student2Id)}
                  </span>
                  <button
                    onClick={() => handleRemovePairConstraint(idx)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Gender Rules */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800">3. 성별 배치 규칙 설정</h3>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setConstraints({ ...constraints, genderRule: 'even_distribution' })}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  constraints.genderRule === 'even_distribution'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs font-black text-indigo-700">⚖️ 모둠별 성비 균형 배치</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    각 모둠에 남학생과 여학생이 고르게 배정되도록 설정
                  </div>
                </div>
                <input
                  type="radio"
                  checked={constraints.genderRule === 'even_distribution'}
                  onChange={() => {}}
                  className="accent-indigo-600"
                />
              </button>

              <button
                type="button"
                onClick={() => setConstraints({ ...constraints, genderRule: 'random' })}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  constraints.genderRule === 'random'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">🎲 남여 구별 없는 자유 무작위</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    성별 구분 없이 CRA 관계 지표 최적화를 기준으로 배치
                  </div>
                </div>
                <input
                  type="radio"
                  checked={constraints.genderRule === 'random'}
                  onChange={() => {}}
                  className="accent-indigo-600"
                />
              </button>
            </div>
          </div>

          {/* 4. Past Neighbors Avoidance Rule */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-800">4. 이전 짝꿍 회피 규칙</h3>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-black bg-amber-50 text-amber-700 rounded-lg border border-amber-200/60">
                과거 기록 대조
              </span>
            </div>

            {/* Avoid Past Neighbors Toggle Card */}
            <button
              type="button"
              onClick={() =>
                setConstraints({ ...constraints, avoidPastNeighbors: !constraints.avoidPastNeighbors })
              }
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                constraints.avoidPastNeighbors
                  ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 text-amber-950'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-amber-900">
                    🔄 이전 짝꿍 회피 규칙 (과거 자리/짝 중복 방지)
                  </span>
                  {constraints.avoidPastNeighbors && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-md">
                      ON
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  1단계에서 입력/업로드된 이전 자리배치 결과 파일 및 학생별 과거 짝 정보와 비교하여, 직전 짝 및 동일 이웃 배치를 자동으로 방지합니다.
                </p>
              </div>

              <div
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  constraints.avoidPastNeighbors ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>
            </button>
          </div>

          {/* 5. CRA Network Algorithm Priorities & Weights */}
          {(() => {
            const craAvailable = hasCraData(students);

            return (
              <div
                className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4 relative transition-all ${
                  !craAvailable ? 'bg-slate-50/70 border-slate-200' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800">5. CRA 관계망 알고리즘 옵션</h3>
                  </div>
                  {craAvailable ? (
                    <span className="px-2.5 py-1 text-[11px] font-black bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/60">
                      CRA 연동중
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-black bg-slate-200 text-slate-600 rounded-lg flex items-center gap-1 border border-slate-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      CRA 시트 미업로드 (비활성화)
                    </span>
                  )}
                </div>

                {!craAvailable && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      CRA 분석 시트가 업로드되지 않았습니다. 5번 항목(CRA 관계망 알고리즘)은 선택할 수 없으며, <strong>후보 4 (기본 제약조건 준수 무작위 배치안)</strong>만 자동 생성됩니다.
                    </span>
                  </div>
                )}

                <div className={`space-y-3 ${!craAvailable ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                  {/* Separate Intimacy Cliques Toggle Card */}
                  <button
                    type="button"
                    disabled={!craAvailable}
                    onClick={() =>
                      setConstraints({
                        ...constraints,
                        separateIntimacyCliques: !constraints.separateIntimacyCliques,
                      })
                    }
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      constraints.separateIntimacyCliques
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-400/30 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-indigo-900">
                          🛡️ 정서적 친밀집단(소모임) 분산 배치
                        </span>
                        {constraints.separateIntimacyCliques && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white rounded-md">
                            ON
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        CRA 정서적 친밀감 소집단에 속한 친한 친구들끼리 같은 모둠에 3명 이상 몰려 집단화되지 않도록 여러 모둠에 균등하게 흩어지도록 가중치를 부여합니다.
                      </p>
                    </div>

                    <div
                      className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                        constraints.separateIntimacyCliques ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                    </div>
                  </button>

                  {/* CRA Algorithm Weight Distribution Sliders Redesign */}
                  {(() => {
                    const intimacyW = weights.intimacyWeight || 0;
                    const cooperationW = weights.cooperationWeight || 0;
                    const influenceW = weights.influenceWeight || 0;
                    const totalW = intimacyW + cooperationW + influenceW;

                    const intimacyPercent = totalW > 0 ? ((intimacyW / totalW) * 100).toFixed(1) : '33.3';
                    const cooperationPercent = totalW > 0 ? ((cooperationW / totalW) * 100).toFixed(1) : '33.3';
                    const influencePercent = totalW > 0 ? ((influenceW / totalW) * 100).toFixed(1) : '33.3';

                    return (
                      <div className="mt-4 p-4.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
                            <span className="font-extrabold text-xs text-indigo-950">
                              🎛️ CRA 알고리즘 영역별 가중치 설정
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsAlgoModalOpen(true)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>CRA 원리 & 계산 과정 정보창</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-indigo-800 leading-relaxed">
                          각 슬라이더를 편하게 조절하시면, 합계에 관계없이 <strong>알고리즘 평가 시 100% 비율로 자동 정규화</strong>되어 반영됩니다.
                        </p>

                        {/* Normalized Ratio Progress Bar */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-indigo-100">
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
                            <span>📊 최종 평가 반영 비율 (총합 100% 자동 분배)</span>
                            <span className="text-indigo-900 font-mono font-extrabold">
                              설정 가중치 총합: {totalW}점
                            </span>
                          </div>
                          <div className="h-3.5 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner">
                            <div
                              style={{ width: `${intimacyPercent}%` }}
                              className="bg-indigo-600 h-full transition-all duration-300 relative group flex items-center justify-center text-[9px] text-white font-black"
                              title={`정서적 친밀감: ${intimacyPercent}%`}
                            >
                              {Number(intimacyPercent) >= 12 && `${intimacyPercent}%`}
                            </div>
                            <div
                              style={{ width: `${cooperationPercent}%` }}
                              className="bg-emerald-500 h-full transition-all duration-300 relative group flex items-center justify-center text-[9px] text-white font-black"
                              title={`기능적 협력: ${cooperationPercent}%`}
                            >
                              {Number(cooperationPercent) >= 12 && `${cooperationPercent}%`}
                            </div>
                            <div
                              style={{ width: `${influencePercent}%` }}
                              className="bg-purple-600 h-full transition-all duration-300 relative group flex items-center justify-center text-[9px] text-white font-black"
                              title={`사회적 영향력: ${influencePercent}%`}
                            >
                              {Number(influencePercent) >= 12 && `${influencePercent}%`}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Intimacy Weight Slider */}
                          <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-indigo-900">🛡️ 정서적 친밀감</span>
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg border border-indigo-100 text-xs">
                                설정 수치 {weights.intimacyWeight}점
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={weights.intimacyWeight}
                              onChange={(e) => handleWeightChange('intimacyWeight', Number(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer h-1.5"
                            />
                          </div>

                          {/* Cooperation Weight Slider */}
                          <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-emerald-900">🤝 기능적 협력</span>
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-lg border border-emerald-100 text-xs">
                                설정 수치 {weights.cooperationWeight}점
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={weights.cooperationWeight}
                              onChange={(e) => handleWeightChange('cooperationWeight', Number(e.target.value))}
                              className="w-full accent-emerald-600 cursor-pointer h-1.5"
                            />
                          </div>

                          {/* Influence Weight Slider */}
                          <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-purple-900">⚡ 사회적 영향력</span>
                              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-extrabold rounded-lg border border-purple-100 text-xs">
                                설정 수치 {weights.influenceWeight}점
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={weights.influenceWeight}
                              onChange={(e) => handleWeightChange('influenceWeight', Number(e.target.value))}
                              className="w-full accent-purple-600 cursor-pointer h-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* 6. Score Balance Weight */}
          {(() => {
            const scoreAvailable = hasScoreData(students);
            return (
              <div
                className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4 transition-all ${
                  !scoreAvailable ? 'bg-slate-50/70 border-slate-200' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800">6. 성적 균형 옵션</h3>
                  </div>
                  {scoreAvailable ? (
                    <span className="px-2.5 py-1 text-[11px] font-black bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/60">
                      성적 데이터 연동중
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-black bg-slate-200 text-slate-600 rounded-lg flex items-center gap-1 border border-slate-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      성적 데이터 미입력 (비활성화)
                    </span>
                  )}
                </div>

                {!scoreAvailable && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      1단계 학생 명단에 성적이 입력되지 않았습니다. 성적 균형 가중치는 학생 성적이 있어야 반영됩니다.
                    </span>
                  </div>
                )}

                <div className={`bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4.5 space-y-2 ${!scoreAvailable ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-900">📊 모둠 간 성적 균형 가중치</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg border border-indigo-100 text-xs">
                      설정 수치 {weights.scoreBalanceWeight}점
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    학생 성적을 인원수 기준으로 나눈 tier(등급 구간)마다 1명씩 각 모둠에 고르게 배정하여, 모둠 간 평균 성적 차이가 최소화되도록 합니다.
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weights.scoreBalanceWeight}
                    onChange={(e) => handleWeightChange('scoreBalanceWeight', Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            );
          })()}

          {/* Bottom Generate Button (duplicate of the top action, for long pages) */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onGenerateCandidates}
              className="flex items-center gap-2.5 px-8 py-4 text-base font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-xl shadow-indigo-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <span>자리후보 생성하기</span>
            </button>
          </div>
      </div>

      {/* Algo Explanation Modal */}
      {isAlgoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    📐 모둠 구성 알고리즘 산출 원리 & 가중치 계산 안내
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    교실 서시오그램(Socio-gram) 관계망 및 성적 수치가 모둠 배정에 반영되는 수학적 메커니즘
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAlgoModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-indigo-600" />
                  1. 같은 모둠(Group) 소속 평가 범위
                </h3>
                <p>
                  모둠 구성 알고리즘은 <strong className="text-indigo-900 font-extrabold">물리적 좌석 위치가 아닌, 같은 모둠(podId)에 속해 있는지 여부</strong>만을 기준으로 모든 관계·균형 지표를 평가합니다.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-200 pb-1">
                  2. 4대 균형 지표(S값) 세부 수치 산출 공식
                </h3>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900">🛡️ 정서적 친밀감 분산 지수 (S_intimacy)</span>
                    <span className="text-[11px] font-extrabold text-indigo-600">소집단 밀집 감점</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    동일한 정서적 친밀 소모임(intimacyGroup) 학생끼리 같은 모둠에 함께 배치될 때마다 감점 패널티를 부여합니다. 단짝끼리 한 모둠에 무리 짓지 않고 여러 모둠에 고르게 분산될수록 100점에 수렴합니다.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">🤝 기능적 협력 균형 지수 (S_cooperation)</span>
                    <span className="text-[11px] font-extrabold text-emerald-600">협업 선호도 tier 분산</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    CRA '2_기능적_협력' 가중점수(모둠활동에서 선호되는 협업 역량 지표)를 성적처럼 tier로 나누어 각 모둠에 1명씩 고르게 배정합니다. 모둠별 평균 협력 가중점수의 편차가 작을수록 100점에 수렴합니다.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900">⚡ 사회적 영향력 균등 지수 (S_influence)</span>
                    <span className="text-[11px] font-extrabold text-purple-600">리더십 중복 분산</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    학급 내 지명도/리더십 수치가 높은 핵심 영향력 학생들(Weighted ≥ 15 또는 Nominated ≥ 5)이 같은 모둠에 겹치지 않고 반 전체 모둠 리더로 고르게 배치될 때 높은 점수를 산출합니다.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">📊 성적 균형 지수 (S_score)</span>
                    <span className="text-[11px] font-extrabold text-slate-600">성적 tier 분산</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    학생 성적을 내림차순 정렬 후 모둠당 인원수만큼 tier로 나누어 각 모둠에 1명씩 배정합니다(예: 4인 모둠 28명 → 4개 tier, tier당 7명씩 각 모둠에 분산). 모둠별 평균 성적 편차가 작을수록 100점에 수렴합니다.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-sm text-amber-950">
                  3. 종합 평가점수 산출 공식 (하드 제약 vs 소프트 가중치)
                </h3>
                <p className="font-mono bg-white p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-bold leading-relaxed">
                  Weighted Score = Σ(S_i × W_i) / Σ(W_i)  (사용 가능한 지표만 합산: CRA 3종 + 성적)
                  <br />
                  Final Score = (필수 제약조건·성비 준수율 × 0.3) + (Weighted Score × 0.7)
                </p>
                <div className="text-slate-600 text-[11px] space-y-1">
                  <p>• <strong>하드 제약조건 (Hard Constraints)</strong>: [학생 자리 고정], [같이/따로 앉기] 등은 100% 필수 준수해야 하며 위반 시 절대 선택되지 않습니다.</p>
                  <p>• <strong>소프트 가중치 (Soft Weights)</strong>: 교사가 설정한 슬라이더 비중(W)에 따라 각 균형 지표의 상대적 중요도가 종합 점수에 실시간 반영됩니다. CRA/성적 데이터가 없으면 해당 지표는 자동으로 제외되고 나머지 지표끼리 재분배됩니다.</p>
                </div>
              </div>
            </div>

            <div className="text-right border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsAlgoModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
