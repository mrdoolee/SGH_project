import React, { useState } from 'react';
import { DeskPosition, GridDimensions, GroupLayoutConfig, LayoutType, SavedLayoutPreset } from '../types';
import { generateDeskLayout } from '../utils/groupAlgorithm';
import {
  CheckCircle2,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react';

interface GroupSetupProps {
  layoutType: LayoutType;
  setLayoutType: (type: LayoutType) => void;
  groupLayout: GroupLayoutConfig;
  setGroupLayout: (config: GroupLayoutConfig) => void;
  desks: DeskPosition[];
  setDesks: (desks: DeskPosition[]) => void;
  dimensions: GridDimensions;
  setDimensions: (dim: GridDimensions) => void;
  studentCount: number;
  onProceedToConstraints: () => void;
}

const GROUP_SIZE_PRESETS: { size: 3 | 4 | 6; layoutType: LayoutType; emoji: string; label: string; hint: string }[] = [
  { size: 3, layoutType: 'pods3', emoji: '🧑‍🤝‍🧑', label: '3인 모둠 배치', hint: '3명씩 소모둠 구역' },
  { size: 4, layoutType: 'pods4', emoji: '🧩', label: '4인 모둠 배치', hint: '2x2 모둠 구역' },
  { size: 6, layoutType: 'pods6', emoji: '👨‍👩‍👧‍👦', label: '6인 대모둠 배치', hint: '3x2 대형 모둠 구역' },
];

export const GroupSetup: React.FC<GroupSetupProps> = ({
  layoutType,
  setLayoutType,
  groupLayout,
  setGroupLayout,
  desks,
  setDesks,
  dimensions,
  setDimensions,
  studentCount,
  onProceedToConstraints,
}) => {
  const activeDeskCount = desks.filter((d) => !d.disabled).length;
  const numGroups = groupLayout.numGroups;

  const [savedPresets, setSavedPresets] = useState<SavedLayoutPreset[]>(() => {
    try {
      const stored = localStorage.getItem('study_group_saved_layout_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const applyLayout = (nextType: LayoutType, nextConfig: GroupLayoutConfig) => {
    setLayoutType(nextType);
    setGroupLayout(nextConfig);
    const { desks: newDesks, dimensions: newDim } = generateDeskLayout(nextType, nextConfig, studentCount);
    setDesks(newDesks);
    setDimensions(newDim);
  };

  const handleSelectGroupSize = (preset: (typeof GROUP_SIZE_PRESETS)[number]) => {
    const suggestedNumGroups = Math.max(1, Math.ceil(studentCount / preset.size) || 1);
    applyLayout(preset.layoutType, { groupSize: preset.size, numGroups: suggestedNumGroups });
  };

  const handleNumGroupsChange = (nextNumGroups: number) => {
    const validNumGroups = Math.max(1, Math.min(20, nextNumGroups));
    applyLayout(layoutType, { ...groupLayout, numGroups: validNumGroups });
  };

  const handlePodGridColsChange = (nextCols: number | undefined) => {
    applyLayout(layoutType, { ...groupLayout, podGridCols: nextCols });
  };

  const autoPodGridCols = Math.ceil(Math.sqrt(numGroups));
  const effectivePodGridCols = groupLayout.podGridCols || autoPodGridCols;

  const toggleDeskDisabled = (deskId: string) => {
    setDesks(
      desks.map((d) => (d.id === deskId ? { ...d, disabled: !d.disabled } : d))
    );
  };

  const handleSaveLayoutPreset = () => {
    if (!presetNameInput.trim()) return;
    const newPreset: SavedLayoutPreset = {
      id: `preset_${Date.now()}`,
      name: presetNameInput.trim(),
      type: layoutType,
      dimensions,
      desks,
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    try {
      localStorage.setItem('study_group_saved_layout_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setPresetNameInput('');
    setIsSaveModalOpen(false);
    alert('현재 모둠 배치 형태가 저장되었습니다!');
  };

  const handleLoadLayoutPreset = (preset: SavedLayoutPreset) => {
    setLayoutType(preset.type);
    setDimensions(preset.dimensions);
    setDesks(preset.desks);
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('study_group_saved_layout_presets', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
                2단계: 모둠 구성 설정
              </span>
              <h2 className="text-xl font-black text-slate-800">모둠 크기 및 모둠 수 설정</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              3인/4인/6인 모둠 크기를 선택하고, 모둠 수를 직접 지정합니다. 인원이 맞지 않으면 아래 책상판을 클릭해 개별 좌석을 켜고 끌 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="whitespace-nowrap">현재 배치 저장</span>
            </button>

            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 ${
                activeDeskCount === studentCount
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : activeDeskCount > studentCount
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {activeDeskCount === studentCount ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                학생 {studentCount}명 / 활성 좌석 {activeDeskCount}개 ({numGroups}개 모둠 x {groupLayout.groupSize}인)
              </span>
            </div>

            <button
              onClick={onProceedToConstraints}
              className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">3단계: 제약조건 & 알고리즘 설정</span>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {activeDeskCount !== studentCount && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border bg-amber-50 border-amber-200 text-amber-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {activeDeskCount < studentCount
                ? `학생 수보다 활성 좌석이 ${studentCount - activeDeskCount}개 부족합니다. 모둠 수를 늘리거나 아래 책상판에서 좌석을 활성화하세요.`
                : `활성 좌석이 학생 수보다 ${activeDeskCount - studentCount}개 많습니다. 남는 좌석을 클릭해 비활성화하면 마지막 모둠의 인원을 줄일 수 있습니다.`}
            </span>
          </div>
        )}

        {/* Group Size Preset Selector */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
            모둠 크기 선택
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GROUP_SIZE_PRESETS.map((preset) => (
              <button
                key={preset.size}
                type="button"
                onClick={() => handleSelectGroupSize(preset)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  layoutType === preset.layoutType
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <span className="text-2xl">{preset.emoji}</span>
                <div className="mt-3">
                  <div className="font-extrabold text-sm">{preset.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{preset.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Number of Groups Control */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700">모둠 수 (교사 직접 지정):</span>
              <button
                onClick={() => handleNumGroupsChange(numGroups - 1)}
                className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <MinusCircle className="w-5 h-5" />
              </button>
              <span className="font-black text-sm px-2">{numGroups}개 모둠</span>
              <button
                onClick={() => handleNumGroupsChange(numGroups + 1)}
                className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-500 font-semibold">
                (권장 {Math.max(1, Math.ceil(studentCount / groupLayout.groupSize) || 1)}개 = 학생 {studentCount}명 / {groupLayout.groupSize}인)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700">모둠 배치 열 수:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePodGridColsChange(undefined)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !groupLayout.podGridCols
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  자동 ({autoPodGridCols}열)
                </button>
                {[2, 3, 4, 5].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handlePodGridColsChange(cols)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      effectivePodGridCols === cols && groupLayout.podGridCols
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cols}열
                  </button>
                ))}
              </div>
            </div>

            {savedPresets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">저장된 배치:</span>
                <div className="flex flex-wrap gap-1.5">
                  {savedPresets.map((p) => (
                    <div
                      key={p.id}
                      className="inline-flex items-center gap-1 bg-white border border-slate-300 px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-700 shadow-2xs"
                    >
                      <button onClick={() => handleLoadLayoutPreset(p)} className="hover:underline cursor-pointer">
                        {p.name}
                      </button>
                      <button
                        onClick={() => handleDeletePreset(p.id)}
                        className="text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Desk Grid Canvas */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white space-y-6">
        <div className="w-full bg-slate-800/90 border-2 border-emerald-600/40 rounded-2xl py-3 text-center shadow-inner">
          <span className="text-sm font-black text-emerald-400 tracking-widest uppercase">
            [ 칠 판 / 교 탁 (교실 앞) ]
          </span>
        </div>

        <div className="flex flex-col items-center py-4 overflow-x-auto">
          {Array.from({ length: dimensions.rows }).map((_, r) => {
            const hasRowAisle = (dimensions.rowAisles || []).includes(r);

            return (
              <React.Fragment key={`row_group_${r}`}>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {Array.from({ length: dimensions.cols }).map((_, c) => {
                      const desk = desks.find((d) => d.row === r && d.col === c);
                      const hasColAisle = (dimensions.colAisles || []).includes(c);

                      if (!desk) return null;

                      return (
                        <React.Fragment key={desk.id}>
                          <button
                            type="button"
                            onClick={() => toggleDeskDisabled(desk.id)}
                            className={`w-20 h-16 rounded-2xl border-2 flex flex-col items-center justify-center p-1 m-1 transition-all cursor-pointer ${
                              desk.disabled
                                ? 'bg-slate-800/50 border-slate-700/80 text-slate-600 opacity-50 hover:opacity-100'
                                : 'bg-indigo-950/80 border-indigo-500 hover:border-amber-400 text-indigo-100 shadow-lg shadow-indigo-950/80 hover:scale-105'
                            }`}
                            title={
                              desk.disabled
                                ? '비활성화된 좌석입니다. 클릭하여 활성화'
                                : '활성 좌석입니다. 클릭하여 빈 좌석으로 처리'
                            }
                          >
                            <span className="text-[10px] font-mono text-slate-400">
                              모둠 {desk.podId !== undefined ? desk.podId + 1 : '-'}
                            </span>
                            <span className="text-xs font-extrabold mt-0.5">
                              {desk.disabled ? '빈 좌석' : '책상'}
                            </span>
                          </button>

                          {hasColAisle && (
                            <div
                              className="w-8 border-x border-dashed border-slate-700/60 h-16 flex items-center justify-center mx-1"
                              title="모둠 구역 간 간격"
                            >
                              <span className="text-[9px] text-slate-600 transform -rotate-90 font-mono">
                                구역
                              </span>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {hasRowAisle && (
                  <div
                    className="w-full h-8 border-y border-dashed border-slate-700/60 my-1 flex items-center justify-center"
                    title="모둠 구역 간 간격"
                  >
                    <span className="text-[9px] text-slate-600 font-mono">=== 모둠 구역 구분 ===</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-500" />
              <span>활성 좌석</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700" />
              <span>비활성 좌석</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500" />
              <span>모둠 구역 간 간격</span>
            </div>
          </div>

          <div className="text-slate-400 font-semibold">
            💡 각 책상에 표시된 "모둠 N" 번호가 실제 배치 알고리즘이 사용하는 모둠 구분입니다.
          </div>
        </div>
      </div>

      {/* Save Preset Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">현재 모둠 배치 형태 저장</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">배치 명칭</label>
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder="예: 4인 7모둠 기본 배치"
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleSaveLayoutPreset}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
