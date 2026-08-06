import React, { useState } from 'react';
import {
  Users,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  History,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Laptop,
  Info,
} from 'lucide-react';
import { ViewPerspective } from '../types';

interface SidebarProps {
  activeTab: 'cra' | 'layout' | 'constraints' | 'result';
  setActiveTab: (tab: 'cra' | 'layout' | 'constraints' | 'result') => void;
  perspective: ViewPerspective;
  setPerspective: (p: ViewPerspective) => void;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
  onOpenCraGuide: () => void;
  onOpenOfflineGuide: () => void;
  onOpenSystemInfo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  perspective,
  setPerspective,
  onOpenHistory,
  onOpenHelp,
  onOpenCraGuide,
  onOpenOfflineGuide,
  onOpenSystemInfo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(true);

  const teacherItems = [
    {
      id: 'cra' as const,
      label: '1. 학생 & CRA 데이터 관리',
      subLabel: '학번·성별·성적·이전모둠',
      icon: Users,
    },
    {
      id: 'layout' as const,
      label: '2. 모둠 구성 설정',
      subLabel: '모둠 크기/모둠 수 설정',
      icon: LayoutGrid,
    },
    {
      id: 'constraints' as const,
      label: '3. 제약조건 & 알고리즘 설정',
      subLabel: '자리 고정·성비·가중치 설정',
      icon: SlidersHorizontal,
    },
    {
      id: 'result' as const,
      label: '4. 모둠 배치 결과 확인 & 변경',
      subLabel: '후보 비교·수동 배치 편집',
      icon: Sparkles,
    },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div>
        {/* Sidebar Header & Brand Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div>
                <div className="text-[11px] font-black text-white tracking-tight leading-tight">
                  학습모둠 구성 도우미
                </div>
                <h1 className="font-black text-indigo-400 text-sm tracking-tight leading-tight my-1">
                  Study Group<br />
                  Formation<br />
                  Helper
                </h1>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={onOpenCraGuide}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 rounded-full text-[10px] font-bold tracking-tight transition-colors cursor-pointer"
                    title="학급 교우관계 분석 도우미(CRA) 안내"
                  >
                    <span>CRA Add-on App</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title={isCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-4">
          {/* Group 1: 교사 관리 메뉴 */}
          <div className="space-y-1">
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => setIsTeacherMenuOpen(!isTeacherMenuOpen)}
                className="w-full pt-1 pb-1 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between hover:text-slate-200 cursor-pointer"
              >
                <span>교사 관리 메뉴</span>
                {isTeacherMenuOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            {(isTeacherMenuOpen || isCollapsed) &&
              teacherItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
                    />
                    {!isCollapsed && (
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </nav>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* History Button */}
        <button
          onClick={onOpenHistory}
          className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
          title="과거 자리배치 확인 및 JSON 파일 불러오기"
        >
          <History className="w-4 h-4 text-purple-400 shrink-0" />
          {!isCollapsed && <span>과거 자리배치 확인하기</span>}
        </button>

        {/* User Guide Button */}
        <button
          onClick={onOpenHelp}
          className="w-full flex items-center gap-3 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
          title="사용법 가이드"
        >
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          {!isCollapsed && <span>사용 가이드</span>}
        </button>

        {!isCollapsed ? (
          <div className="space-y-2 pt-1">
            {/* 1. 개인정보보호 완벽 보장 & 오프라인 EXE 가이드 */}
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-3 space-y-2 text-center shadow-inner">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold text-[12px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>개인정보보호 완벽 보장</span>
              </div>
              <button
                onClick={onOpenOfflineGuide}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <Laptop className="w-4 h-4" />
                <span>오프라인 .EXE 실행 가이드</span>
              </button>
            </div>

            {/* 3. 시스템 이용 안내 / 문의 */}
            <button
              onClick={onOpenSystemInfo}
              className="w-full py-2.5 px-3 bg-slate-800/90 hover:bg-slate-800 text-slate-200 rounded-2xl text-xs font-black border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>시스템 이용 안내 / 문의</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
            <button
              onClick={onOpenOfflineGuide}
              className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 flex justify-center cursor-pointer"
              title="오프라인 .EXE 실행 가이드"
            >
              <Laptop className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSystemInfo}
              className="p-2 rounded-xl bg-slate-800 text-indigo-400 hover:bg-slate-700 flex justify-center cursor-pointer"
              title="시스템 이용 안내 / 문의"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
