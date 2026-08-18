import React, { useMemo, useState } from 'react';
import { SeatingResult, CraStudent, DeskPosition, GridDimensions, ViewPerspective } from '../types';
import { X, Printer, ArrowLeftRight, Calendar, FileText, Edit3 } from 'lucide-react';
import { printSeatingChart } from '../utils/printUtils';
import { resolveDisplayAssignments } from '../utils/seatingRestore';

interface RestoredSeatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SeatingResult | null;
  students: CraStudent[];
  defaultDesks: DeskPosition[];
  defaultDimensions: GridDimensions;
}

export const RestoredSeatingModal: React.FC<RestoredSeatingModalProps> = ({
  isOpen,
  onClose,
  result,
  students,
  defaultDesks,
  defaultDimensions,
}) => {
  const [perspective, setPerspective] = useState<ViewPerspective>('student');
  const [printTitle, setPrintTitle] = useState<string>('2학년 1반 학급 모둠 배치표');
  const [printSubtitle, setPrintSubtitle] = useState<string>(
    '서로 존중하고 다정하게 대화하는 즐거운 교실 환경을 만듭니다.'
  );

  const resolution = useMemo(
    () => (result ? resolveDisplayAssignments(result, students) : null),
    [result, students]
  );

  if (!isOpen || !result) return null;

  const studentMap = resolution!.studentMap;
  const resolvedAssignments = resolution!.assignments;
  const effectiveDesks = result.desks && result.desks.length > 0 ? result.desks : defaultDesks;
  const effectiveDimensions = result.dimensions || defaultDimensions;

  const rows = effectiveDimensions.rows;
  const cols = effectiveDimensions.cols;

  const rowIndices =
    perspective === 'student'
      ? Array.from({ length: rows }, (_, i) => i)
      : Array.from({ length: rows }, (_, i) => rows - 1 - i);

  const handlePrint = () => {
    printSeatingChart({
      title: printTitle || result.title,
      subtitle: printSubtitle,
      perspective,
      result,
      students,
      defaultDesks,
      defaultDimensions,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 printable-area-wrapper">
      <div className="bg-white rounded-3xl p-6 w-full max-w-5xl shadow-2xl space-y-6 relative max-h-[92vh] flex flex-col printable-area">
        
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileText className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                  복원된 과거 모둠 배치표
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  {result.date}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">{result.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Perspective Toggle */}
            <button
              onClick={() =>
                setPerspective((p) => (p === 'teacher' ? 'student' : 'teacher'))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>{perspective === 'teacher' ? '교사 시선' : '학생 시선'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>모둠 배치표 인쇄</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Header Editor (Visible on screen, and also custom text shows when printed) */}
        <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl space-y-3 shrink-0 no-print">
          <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <span>인쇄 시 출력될 제목 및 설명글 직접 작성</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                인쇄 상단 제목
              </label>
              <input
                type="text"
                value={printTitle}
                onChange={(e) => setPrintTitle(e.target.value)}
                placeholder="예: 2학년 1반 3월 모둠 배치표"
                className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                인쇄 상단 설명글
              </label>
              <input
                type="text"
                value={printSubtitle}
                onChange={(e) => setPrintSubtitle(e.target.value)}
                placeholder="예: 서로 존중하며 다정하게 대화하는 교실"
                className="w-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Print-Only Banner Header */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
          <h1 className="text-2xl font-black text-slate-900">{printTitle || result.title}</h1>
          {printSubtitle && (
            <p className="text-sm font-semibold text-slate-700 mt-1">{printSubtitle}</p>
          )}
          <div className="text-xs text-slate-500 mt-2 flex justify-center gap-4">
            <span>배치 일자: {result.date}</span>
            <span>|</span>
            <span>시선: {perspective === 'student' ? '학생 시선 (칠판 상단)' : '교사 시선 (칠판 하단)'}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 print:overflow-visible print:pr-0">
          {/* Snapshot-only / unmatched-seat notices - Hidden in Print */}
          {resolution && resolution.matchedFromSnapshotOnly > 0 && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs font-bold text-indigo-800 no-print">
              ℹ️ {resolution.matchedFromSnapshotOnly}자리는 현재 불러온 학생 명단이 아니라 백업 파일에 저장된 이름으로 표시됩니다.
              이 학생들에게 알고리즘(이전 짝꿍 회피 등)을 적용하려면 1단계에서 동일한 학생 명단을 불러와 주세요.
            </div>
          )}
          {resolution && resolution.unmatched > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800 no-print">
              ⚠️ {resolution.unmatched}자리는 백업 파일에 이름 정보가 없어 표시할 수 없습니다 (이름 정보가 없는 예전 형식 백업이거나, 현재 명단과도 일치하지 않음).
            </div>
          )}
          {/* Metrics summary - Hidden in Print */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-center no-print">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400">종합 점수</div>
              <div className="text-lg font-black text-indigo-600">
                {result.metrics?.overallScore || 90}점
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400">성적 균형</div>
              <div className="text-lg font-black text-slate-700">
                {result.metrics?.scoreBalanceScore || 90}점
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400">협력 균형</div>
              <div className="text-lg font-black text-emerald-600">
                {result.metrics?.cooperationBalanceScore || 90}점
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400">친밀도 분산</div>
              <div className="text-lg font-black text-purple-600">
                {result.metrics?.intimacyDispersionScore || 90}점
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400">제약 만족도</div>
              <div className="text-lg font-black text-amber-600">
                {result.metrics?.constraintSatisfactionScore || 100}%
              </div>
            </div>
          </div>

          {/* Classroom Seating Grid Visualizer */}
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 text-white space-y-6 print:bg-white print:text-black print:border-none print:p-0 print:space-y-4">
            {/* Blackboard */}
            {perspective === 'student' && (
              <div className="w-full bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl py-2.5 text-center shadow-lg print:bg-slate-100 print:border-slate-800 print:text-black">
                <span className="text-sm font-black text-emerald-400 tracking-widest uppercase print:text-black">
                  [ 칠 판 / 교 탁 (교실 앞) ]
                </span>
              </div>
            )}

            {/* 2D Classroom Grid */}
            <div className="flex flex-col items-center gap-3 py-2 overflow-x-auto print:overflow-visible">
              {rowIndices.map((r) => {
                // Flip the aisle lookup key too when teacher perspective reverses the row
                // order, otherwise the gap renders one row-band off from where it should.
                const hasRowAisle =
                  perspective === 'teacher'
                    ? effectiveDimensions.rowAisles?.includes(r - 1)
                    : effectiveDimensions.rowAisles?.includes(r);
                return (
                  <React.Fragment key={`restored_r_${r}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {Array.from({ length: cols }).map((_, c) => {
                          const hasColAisle = effectiveDimensions.colAisles?.includes(c);
                          const desk = effectiveDesks.find((d) => d.row === r && d.col === c);

                          if (!desk || desk.disabled) {
                            return (
                              <React.Fragment key={`empty_restored_${r}_${c}`}>
                                <div className="w-24 sm:w-28 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 opacity-40 flex items-center justify-center text-[10px] text-slate-600 font-bold print:border-slate-200 print:bg-slate-50 print:text-slate-400">
                                  빈 통로
                                </div>
                                {hasColAisle && <div className="w-4 sm:w-6 h-20 bg-slate-800/30 rounded-lg print:bg-slate-100" />}
                              </React.Fragment>
                            );
                          }

                          const studentId = resolvedAssignments[desk.id];
                          const student = studentId ? studentMap.get(studentId) : null;

                          return (
                            <React.Fragment key={desk.id}>
                              <div
                                className={`w-24 sm:w-28 h-20 rounded-2xl border-2 p-2 flex flex-col justify-between relative text-left transition-all ${
                                  student
                                    ? 'bg-slate-900/80 border-slate-700 print:bg-white print:border-slate-900 print:text-black'
                                    : 'bg-slate-950/40 border-slate-850 text-slate-600 print:bg-slate-50 print:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 print:text-slate-700">
                                  <span>
                                    {student?.studentNumber ? `${student.studentNumber}` : `${r + 1}-${c + 1}`}
                                  </span>
                                  {student && student.gender && (
                                    <span
                                      className={`w-2 h-2 rounded-full print:border print:border-slate-400 ${
                                        student.gender === 'M' ? 'bg-blue-400 print:bg-blue-600' : 'bg-pink-400 print:bg-pink-600'
                                      }`}
                                    />
                                  )}
                                </div>

                                {student ? (
                                  <div>
                                    <div className="text-sm font-black text-white truncate print:text-black">
                                      {student.name}
                                    </div>
                                    {desk.podId !== undefined && (
                                      <div className="text-[10px] text-slate-400 print:text-slate-600 font-semibold mt-0.5">
                                        모둠 {desk.podId + 1}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-600 print:text-slate-400 text-center my-auto">
                                    빈 자석
                                  </div>
                                )}
                              </div>
                              {hasColAisle && <div className="w-4 sm:w-6 h-20 bg-slate-800/30 rounded-lg print:bg-slate-100" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                    {hasRowAisle && <div className="h-4 w-full bg-slate-800/30 rounded-lg print:bg-slate-100" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Blackboard Teacher Perspective Bottom */}
            {perspective === 'teacher' && (
              <div className="w-full bg-slate-800/90 border-2 border-emerald-500/50 rounded-2xl py-2.5 text-center shadow-lg print:bg-slate-100 print:border-slate-800 print:text-black">
                <span className="text-sm font-black text-emerald-400 tracking-widest uppercase print:text-black">
                  [ 칠 판 / 교 탁 (교실 앞 - 교사 시선) ]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions - Hidden in Print */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 no-print">
          <p className="text-xs text-slate-500">
            복원된 모둠 배치표입니다. 상단 [모둠 배치표 인쇄] 버튼으로 제목과 설명글이 포함된 모둠 배치표를 즉시 인쇄할 수 있습니다.
          </p>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
