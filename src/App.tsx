import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CraDataModal } from './components/CraDataModal';
import { GroupSetup } from './components/GroupSetup';
import { ConstraintSetup } from './components/ConstraintSetup';
import { ResultView } from './components/ResultView';
import { HistoryModal } from './components/HistoryModal';
import { HelpModal } from './components/HelpModal';
import { RestoredSeatingModal } from './components/RestoredSeatingModal';
import { PrivacyInfoModal } from './components/PrivacyInfoModal';
import { SystemInfoModal } from './components/SystemInfoModal';
import { CraGuideModal } from './components/CraGuideModal';

import {
  CraStudent,
  DeskPosition,
  GridDimensions,
  GroupLayoutConfig,
  LayoutType,
  SeatingConstraints,
  SeatingResult,
  ViewPerspective,
} from './types';
import {
  generateDeskLayout,
  generateCandidateArrangements,
  evaluateArrangement,
  computeGroupAverages,
} from './utils/groupAlgorithm';

export default function App() {
  // 1. Core State - Starts empty as per user request
  const [students, setStudents] = useState<CraStudent[]>([]);
  const [layoutType, setLayoutType] = useState<LayoutType>('pods4');
  const [groupLayout, setGroupLayout] = useState<GroupLayoutConfig>({ groupSize: 4, numGroups: 7 });

  const initialLayout = generateDeskLayout('pods4', { groupSize: 4, numGroups: 7 }, 25);
  const [desks, setDesks] = useState<DeskPosition[]>(initialLayout.desks);
  const [dimensions, setDimensions] = useState<GridDimensions>(initialLayout.dimensions);

  const [perspective, setPerspective] = useState<ViewPerspective>('student');
  const [activeTab, setActiveTab] = useState<
    'cra' | 'layout' | 'constraints' | 'result'
  >('cra');

  // Constraints State
  const [constraints, setConstraints] = useState<SeatingConstraints>({
    genderRule: 'even_distribution',
    fixedSeats: [],
    pairConstraints: [],
    avoidPastNeighbors: true,
    separateIntimacyCliques: true,
    separateHighInfluence: true,
  });

  // Saved Results History
  const [savedResults, setSavedResults] = useState<SeatingResult[]>(() => {
    try {
      const stored = localStorage.getItem('study_group_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Candidate Arrangements State
  const [candidates, setCandidates] = useState<SeatingResult[]>([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('opt_4');

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isCraGuideOpen, setIsCraGuideOpen] = useState<boolean>(false);
  const [isPrivacyInfoOpen, setIsPrivacyInfoOpen] = useState<boolean>(false);
  const [isSystemInfoOpen, setIsSystemInfoOpen] = useState<boolean>(false);
  const [restoredModalResult, setRestoredModalResult] = useState<SeatingResult | null>(null);
  const [isRestoredModalOpen, setIsRestoredModalOpen] = useState<boolean>(false);

  // Guard: menus 2-4 require student data; bounce back to step 1 if it's ever empty
  useEffect(() => {
    if (students.length === 0 && activeTab !== 'cra') {
      setActiveTab('cra');
    }
  }, [students.length, activeTab]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('study_group_history', JSON.stringify(savedResults));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [savedResults]);

  // Handler to regenerate candidate options
  const handleGenerateCandidates = () => {
    if (students.length === 0) {
      alert('등록된 학생 데이터가 없습니다. 먼저 1단계에서 학생 명단을 입력/업로드해 주세요.');
      setActiveTab('cra');
      return;
    }
    const pastAssignments = savedResults.map((r) => r.assignments);
    const newCandidates = generateCandidateArrangements(
      desks,
      students,
      constraints,
      pastAssignments,
      dimensions
    );
    setCandidates(newCandidates);
    // Default to opt_4 if only 1 candidate generated (no CRA data), else opt_1
    setSelectedCandidateId(newCandidates.length === 1 ? 'opt_4' : 'opt_1');
    setActiveTab('result');
  };

  // Handler to update entire candidate result (or add custom candidate)
  const handleUpdateCandidate = (candidateId: string, updatedCandidate: SeatingResult) => {
    setCandidates((prev) => {
      const exists = prev.some((c) => c.id === candidateId);
      if (exists) {
        return prev.map((c) => (c.id === candidateId ? updatedCandidate : c));
      } else {
        return [...prev, updatedCandidate];
      }
    });
  };

  // Handler for manual desk student swap in result view
  const handleUpdateCandidateAssignments = (
    candidateId: string,
    newAssignments: Record<string, string | null>
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const pastAssignments = savedResults.map((r) => r.assignments);
          const metrics = evaluateArrangement(
            newAssignments,
            desks,
            students,
            constraints,
            pastAssignments
          );
          return {
            ...c,
            assignments: newAssignments,
            metrics,
            groupAverages: computeGroupAverages(newAssignments, desks, students),
          };
        }
        return c;
      })
    );
  };

  // Handler to save current arrangement to history
  const handleSaveToHistory = (result: SeatingResult) => {
    const newHistoryItem: SeatingResult = {
      ...result,
      id: `saved_${Date.now()}`,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setSavedResults([newHistoryItem, ...savedResults]);
    alert(`[${result.title}] 배치안이 누적 히스토리에 개별 저장되었습니다!`);
  };

  const handleDeleteHistory = (id: string) => {
    setSavedResults(savedResults.filter((r) => r.id !== id));
  };

  const handleLoadHistory = (result: SeatingResult) => {
    setRestoredModalResult(result);
    setIsRestoredModalOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 flex flex-row">
      {/* Sidebar Navigation */}
      <div className="no-print h-full shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          perspective={perspective}
          setPerspective={setPerspective}
          hasStudents={students.length > 0}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenCraGuide={() => setIsCraGuideOpen(true)}
          onOpenPrivacyInfo={() => setIsPrivacyInfoOpen(true)}
          onOpenSystemInfo={() => setIsSystemInfoOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto print:overflow-visible">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'cra' && (
            <CraDataModal
              students={students}
              setStudents={setStudents}
              desks={desks}
              setDesks={setDesks}
              dimensions={dimensions}
              setDimensions={setDimensions}
              setLayoutType={setLayoutType}
              onSaveToHistory={(res) => setSavedResults((prev) => [res, ...prev])}
              onProceedToLayout={() => setActiveTab('layout')}
              onOpenCraGuide={() => setIsCraGuideOpen(true)}
            />
          )}

          {activeTab === 'layout' && (
            <GroupSetup
              layoutType={layoutType}
              setLayoutType={setLayoutType}
              groupLayout={groupLayout}
              setGroupLayout={setGroupLayout}
              desks={desks}
              setDesks={setDesks}
              dimensions={dimensions}
              setDimensions={setDimensions}
              studentCount={students.length}
              onProceedToConstraints={() => setActiveTab('constraints')}
            />
          )}

          {activeTab === 'constraints' && (
            <ConstraintSetup
              students={students}
              desks={desks}
              dimensions={dimensions}
              constraints={constraints}
              setConstraints={setConstraints}
              onGenerateCandidates={handleGenerateCandidates}
            />
          )}

          {activeTab === 'result' && (
            <ResultView
              candidates={candidates}
              selectedCandidateId={selectedCandidateId}
              setSelectedCandidateId={setSelectedCandidateId}
              desks={desks}
              students={students}
              dimensions={dimensions}
              perspective={perspective}
              setPerspective={setPerspective}
              constraints={constraints}
              onSaveToHistory={handleSaveToHistory}
              onUpdateCandidateAssignments={handleUpdateCandidateAssignments}
              onUpdateCandidate={handleUpdateCandidate}
              pastAssignments={savedResults.map((r) => r.assignments)}
            />
          )}
        </main>

        {/* Footer (Matching Reference UI Image 7) */}
        <footer className="no-print py-6 text-center text-xs text-sky-700/80 font-medium border-t border-slate-200/80 bg-slate-50/50 mt-auto shrink-0 space-y-1">
          <div>
            <span className="font-bold text-sky-700">
              과목 학습모둠 구성 도우미 버전 v1.0(2026.08.)
            </span>
          </div>
          <div className="text-slate-500 font-normal">
            © 2026 Designed & Developed by 두리쌤. All rights reserved.
          </div>
        </footer>
      </div>

      {/* Global Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedResults={savedResults}
        onDeleteHistory={handleDeleteHistory}
        onLoadHistory={handleLoadHistory}
      />

      <RestoredSeatingModal
        isOpen={isRestoredModalOpen}
        onClose={() => setIsRestoredModalOpen(false)}
        result={restoredModalResult}
        students={students}
        defaultDesks={desks}
        defaultDimensions={dimensions}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <CraGuideModal
        isOpen={isCraGuideOpen}
        onClose={() => setIsCraGuideOpen(false)}
      />

      <PrivacyInfoModal
        isOpen={isPrivacyInfoOpen}
        onClose={() => setIsPrivacyInfoOpen(false)}
      />

      <SystemInfoModal
        isOpen={isSystemInfoOpen}
        onClose={() => setIsSystemInfoOpen(false)}
      />
    </div>
  );
}
