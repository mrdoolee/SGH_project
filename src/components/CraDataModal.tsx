import React, { useState } from 'react';
import {
  CraStudent,
  Gender,
  DeskPosition,
  GridDimensions,
  LayoutType,
  SeatingResult,
} from '../types';
import { SAMPLE_CRA_STUDENTS } from '../data/sampleCraData';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  HeartHandshake,
  TrendingUp,
  Zap,
  History,
  FileSpreadsheet,
  Download,
  ArrowRight,
  Info,
  Database,
  UserCheck,
  Sparkles,
  FileJson,
  Save,
  Network,
} from 'lucide-react';

interface CraDataModalProps {
  students: CraStudent[];
  setStudents: React.Dispatch<React.SetStateAction<CraStudent[]>>;
  desks?: DeskPosition[];
  setDesks?: React.Dispatch<React.SetStateAction<DeskPosition[]>>;
  dimensions?: GridDimensions;
  setDimensions?: React.Dispatch<React.SetStateAction<GridDimensions>>;
  setLayoutType?: React.Dispatch<React.SetStateAction<LayoutType>>;
  onSaveToHistory?: (result: SeatingResult) => void;
  onProceedToLayout: () => void;
  onOpenCraGuide?: () => void;
}

export const CraDataModal: React.FC<CraDataModalProps> = ({
  students,
  setStudents,
  desks,
  setDesks,
  dimensions,
  setDimensions,
  setLayoutType,
  onSaveToHistory,
  onProceedToLayout,
  onOpenCraGuide,
}) => {
  // Sub-step state: 'upload' (단계1: 자료 업로드) vs 'confirm' (단계2: 학생자료 확인)
  const [subStep, setSubStep] = useState<'upload' | 'confirm'>('upload');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [editingStudent, setEditingStudent] = useState<CraStudent | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Upload status counters
  const [basicUploadedCount, setBasicUploadedCount] = useState<number | null>(null);
  const [craUploadedCount, setCraUploadedCount] = useState<number | null>(null);
  const [pastUploadedCount, setPastUploadedCount] = useState<number | null>(null);

  // Form states for adding a new student
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<Gender>('M');
  const [newStudentScore, setNewStudentScore] = useState('');
  const [newStudentPastSeat, setNewStudentPastSeat] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // Handler to load synthetic 25-student sample data
  const handleLoadSampleData25 = () => {
    setStudents(SAMPLE_CRA_STUDENTS);
    setBasicUploadedCount(25);
    setCraUploadedCount(25);
    setPastUploadedCount(25);
    alert('⚡ 25명의 테스트용 CRA 가상 샘플 학생 및 소모임 관계망 데이터가 성공적으로 로드되었습니다!');
  };

  // Sample CSV generator for Past Group Data
  const handleDownloadPastSeatingSample = () => {
    const sampleData = [
      ['학번', '이름', '이전 모둠 기록', '비고'],
      ['10101', '학생01', '모둠 1 (팀원: 학생02)', '1분기 배치'],
      ['10102', '학생02', '모둠 1 (팀원: 학생01)', '1분기 배치'],
      ['10103', '학생03', '모둠 2', ''],
      ['10104', '학생04', '모둠 2 (팀원: 학생05)', ''],
      ['10105', '학생05', '모둠 2 (팀원: 학생04)', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '이전모둠양식샘플');
    XLSX.writeFile(wb, '이전모둠_양식_샘플.xlsx');
  };

  // 3. (3) 선택 자료: 이전 자리배치 결과 파일 업로드 (JSON 및 Excel 지원)
  const handlePastSeatingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isJson = fileName.endsWith('.json');

    if (isJson) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const parsed = JSON.parse(content);

          let jsonResult: SeatingResult | null = null;
          if (Array.isArray(parsed) && parsed.length > 0) {
            jsonResult = parsed[0];
          } else if (parsed && typeof parsed === 'object') {
            jsonResult = parsed;
          }

          if (!jsonResult) {
            alert('올바른 과거 자리배치 JSON 백업 파일 형식이 아닙니다.');
            return;
          }

          // 1. 책상 배치 및 크기 메뉴 2 자동 연동
          if (jsonResult.desks && Array.isArray(jsonResult.desks) && jsonResult.desks.length > 0 && setDesks) {
            setDesks(jsonResult.desks);
          }
          if (jsonResult.dimensions && jsonResult.dimensions.rows && setDimensions) {
            setDimensions(jsonResult.dimensions);
          }
          if (setLayoutType) {
            setLayoutType('custom');
          }

          // 2. 알고리즘 이전 짝꿍 회피 규칙 연동을 위한 히스토리 저장
          if (onSaveToHistory && jsonResult.assignments) {
            onSaveToHistory({
              id: jsonResult.id || `past_${Date.now()}`,
              title: jsonResult.title || '업로드된 이전 자리배치',
              description: jsonResult.description || '선택자료3 JSON 업로드 이전 배치 기록',
              date: jsonResult.date || new Date().toLocaleDateString('ko-KR'),
              assignments: jsonResult.assignments,
              desks: jsonResult.desks,
              dimensions: jsonResult.dimensions,
              metrics: jsonResult.metrics || {
                scoreBalanceScore: 90,
                cooperationBalanceScore: 90,
                intimacyDispersionScore: 90,
                influenceBalanceScore: 90,
                constraintSatisfactionScore: 100,
                overallScore: 90,
              },
            });
          }

          // 3. 학생 목록 pastSeatInfo 매칭 및 업데이트
          const assignments = jsonResult.assignments || {};
          const desksList = jsonResult.desks || [];
          let updatedCount = 0;

          const deskToStudentMap = new Map<string, string>();
          Object.entries(assignments).forEach(([dId, stId]) => {
            if (stId) deskToStudentMap.set(dId, stId);
          });

          const getStudentName = (stId: string) => {
            const found = students.find((s) => s.id === stId || s.name === stId);
            return found ? found.name : stId;
          };

          const updatedStudents = students.map((st) => {
            const assignedDeskId = Object.keys(assignments).find(
              (dId) => assignments[dId] === st.id || assignments[dId] === st.name
            );

            if (assignedDeskId && desksList.length > 0) {
              const myDesk = desksList.find((d) => d.id === assignedDeskId);
              if (myDesk) {
                const groupmateDeskIds = desksList
                  .filter(
                    (otherDesk) =>
                      otherDesk.id !== myDesk.id &&
                      !otherDesk.disabled &&
                      myDesk.podId !== undefined &&
                      otherDesk.podId === myDesk.podId
                  )
                  .map((d) => d.id);

                const groupmateNames = groupmateDeskIds
                  .map((dId) => deskToStudentMap.get(dId))
                  .filter(Boolean)
                  .map((stId) => getStudentName(stId!));

                const seatDesc = `모둠 ${myDesk.podId !== undefined ? myDesk.podId + 1 : '-'}${
                  groupmateNames.length > 0 ? ` (팀원: ${groupmateNames.join(', ')})` : ''
                }`;

                updatedCount++;
                return {
                  ...st,
                  pastSeatInfo: seatDesc,
                };
              }
            }
            return st;
          });

          setStudents(updatedStudents);
          setPastUploadedCount(updatedCount || Object.keys(assignments).length);
          alert(
            `🎉 [선택자료 3] 이전 자리배치 JSON 파일 로드 완료!\n- 책상 배치(${desksList.length || '기존'}개 책상, 메뉴2) 자동 연동\n- 이전 짝/배치 기록 ${
              updatedCount || Object.keys(assignments).length
            }건 알고리즘 회피 연동 완료`
          );
        } catch (err) {
          console.error('JSON past seating parse error:', err);
          alert('JSON 이전 자리배치 파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file);
      return;
    }

    // Excel file handling
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          alert('이전 자리배치 결과 파일이 비어있거나 형식에 맞지 않습니다.');
          return;
        }

        const headerRow = jsonData[0] as string[];
        let numIdx = -1, nameIdx = -1, pastIdx = -1;

        if (Array.isArray(headerRow)) {
          headerRow.forEach((h, idx) => {
            if (!h) return;
            const str = String(h).trim();
            if (str.includes('학번') || str.includes('번호')) numIdx = idx;
            else if (str.includes('이름') || str.includes('성명')) nameIdx = idx;
            else if (str.includes('이전') || str.includes('과거') || str.includes('자리') || str.includes('짝')) pastIdx = idx;
          });
        }

        let updatedCount = 0;
        const updatedStudents = students.map((s) => ({ ...s }));

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const sName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : String(row[1] || row[0] || '').trim();
          const sNum = numIdx !== -1 ? String(row[numIdx] || '').trim() : '';
          const sPast = pastIdx !== -1 ? String(row[pastIdx] || '').trim() : (row[2] ? String(row[2]).trim() : '');

          if (!sName && !sNum) continue;

          const targetIndex = updatedStudents.findIndex(
            (s) => (sName && s.name === sName) || (sNum && s.studentNumber === sNum)
          );

          if (targetIndex !== -1 && sPast) {
            updatedStudents[targetIndex] = {
              ...updatedStudents[targetIndex],
              pastSeatInfo: sPast,
            };
            updatedCount++;
          }
        }

        setStudents(updatedStudents);
        setPastUploadedCount(updatedCount);
        alert(`[선택 자료] 이전 자리배치 결과 ${updatedCount}건이 학생 목록과 성공적으로 연동되었습니다!`);
      } catch (err) {
        console.error('Past seating file parse error:', err);
        alert('이전 자리배치 결과 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Sample CSV generator for Basic Students
  const handleDownloadBasicSample = () => {
    const sampleData = [
      ['학번', '이름', '성별', '성적', '이전자리배치', '비고(특이사항)'],
      ['10101', '학생01', '남', '88', '1행 2열 (짝: 학생02)', '앞줄 선호'],
      ['10102', '학생02', '여', '95', '2행 3열', '학급 부반장'],
      ['10103', '학생03', '남', '72', '3행 1열', '체구 작음'],
      ['10104', '학생04', '남', '64', '1행 1열', '비고없음'],
      ['10105', '학생05', '여', '81', '4행 2열', '청력 고려'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '학생기본명단샘플');
    XLSX.writeFile(wb, '학생_기본명단_양식_샘플.xlsx');
  };

  // Sample CSV generator for CRA Data (Exact Official CRA Raw Column Format)
  const handleDownloadCraSample = () => {
    const sampleData = [
      [
        '이름',
        '[0_전체_통합]_지목횟수',
        '[0_전체_통합]_가중점수',
        '[0_전체_통합]_중재자점수',
        '[0_전체_통합]_소집단',
        '[1_정서적_친밀감]_지목횟수',
        '[1_정서적_친밀감]_가중점수',
        '[1_정서적_친밀감]_중재자점수',
        '[1_정서적_친밀감]_소집단',
        '[2_기능적_협력]_지목횟수',
        '[2_기능적_협력]_가중점수',
        '[2_기능적_협력]_중재자점수',
        '[2_기능적_협력]_소집단',
        '[3_사회적_영향력]_지목횟수',
        '[3_사회적_영향력]_가중점수',
        '[3_사회적_영향력]_중재자점수',
        '[3_사회적_영향력]_소집단',
      ],
      ['학생01', '12', '36', '0.045', '모둠_1', '4', '12', '0.015', '모둠_1', '5', '15', '0.08', '모둠_1', '3', '9', '0.02', '모둠_1'],
      ['학생02', '18', '58', '0.062', '모둠_1', '5', '16', '0.022', '모둠_1', '8', '26', '0.12', '모둠_1', '4', '12', '0.035', '모둠_2'],
      ['학생03', '15', '48', '0.055', '모둠_2', '6', '18', '0.04', '모둠_2', '4', '12', '0.03', '모둠_2', '8', '24', '0.11', '모둠_1'],
      ['학생04', '8', '24', '0.02', '모둠_2', '2', '6', '0.01', '모둠_2', '3', '9', '0.02', '모둠_2', '1', '3', '0.005', '모둠_3'],
      ['학생05', '14', '42', '0.048', '모둠_3', '5', '15', '0.025', '모둠_3', '6', '18', '0.07', '모둠_3', '2', '6', '0.01', '모둠_3'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CRA분석데이터샘플');
    XLSX.writeFile(wb, 'CRA_관계분석시트_양식_샘플.xlsx');
  };

  // 1. (1) 학생 기본명단 파일 업로드
  const handleBasicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          alert('데이터가 비어있거나 올바르지 않은 양식입니다.');
          return;
        }

        const headerRow = jsonData[0] as string[];
        let numIdx = -1, nameIdx = -1, genderIdx = -1, scoreIdx = -1, pastIdx = -1, notesIdx = -1;

        if (Array.isArray(headerRow)) {
          headerRow.forEach((h, idx) => {
            if (!h) return;
            const str = String(h).trim();
            if (str.includes('학번') || str.includes('번호')) numIdx = idx;
            else if (str.includes('이름') || str.includes('성명')) nameIdx = idx;
            else if (str.includes('성별')) genderIdx = idx;
            else if (str.includes('성적') || str.includes('점수')) scoreIdx = idx;
            else if (str.includes('이전') || str.includes('과거')) pastIdx = idx;
            else if (str.includes('비고') || str.includes('특이') || str.includes('메모')) notesIdx = idx;
          });
        }

        const newBasicList: Partial<CraStudent>[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const sName = nameIdx !== -1 ? String(row[nameIdx] || '') : String(row[1] || row[0] || '');
          if (!sName.trim()) continue;

          const sNum = numIdx !== -1 ? String(row[numIdx] || '') : String(row[0] || `${i}`);
          const rawGender = genderIdx !== -1 ? String(row[genderIdx] || '') : String(row[2] || '');
          const sGender: Gender = rawGender.toUpperCase().includes('F') || rawGender.includes('여') ? 'F' : 'M';
          const rawScore = scoreIdx !== -1 ? parseFloat(String(row[scoreIdx])) : NaN;
          const sScore = Number.isFinite(rawScore) ? rawScore : undefined;
          const sPast = pastIdx !== -1 ? String(row[pastIdx] || '') : '';
          const sNotes = notesIdx !== -1 ? String(row[notesIdx] || '') : '';

          newBasicList.push({
            studentNumber: sNum,
            name: sName.trim(),
            gender: sGender,
            score: sScore,
            pastSeatInfo: sPast || undefined,
            notes: sNotes || undefined,
          });
        }

        if (newBasicList.length === 0) {
          alert('인식 가능한 학생 목록이 없습니다.');
          return;
        }

        // Merge into current students state by studentNumber/name or replace
        const mergedStudents: CraStudent[] = newBasicList.map((basic, idx) => {
          const existing = students.find(
            (s) =>
              (basic.studentNumber && s.studentNumber === basic.studentNumber) ||
              s.name === basic.name
          );

          return {
            id: existing ? existing.id : `s_basic_${idx}_${Date.now()}`,
            studentNumber: basic.studentNumber || `${idx + 1}`,
            name: basic.name || `학생_${idx + 1}`,
            gender: basic.gender || 'M',
            score: basic.score ?? existing?.score,
            pastSeatInfo: basic.pastSeatInfo || existing?.pastSeatInfo,
            notes: basic.notes || existing?.notes,
            // Retain existing CRA metrics if available
            totalNominated: existing?.totalNominated || 0,
            totalWeighted: existing?.totalWeighted || 0,
            totalMediator: existing?.totalMediator || 0,
            totalGroup: existing?.totalGroup || '모둠_1',
            intimacyNominated: existing?.intimacyNominated || 0,
            intimacyWeighted: existing?.intimacyWeighted || 0,
            intimacyMediator: existing?.intimacyMediator || 0,
            intimacyGroup: existing?.intimacyGroup || '모둠_1',
            cooperationNominated: existing?.cooperationNominated || 0,
            cooperationWeighted: existing?.cooperationWeighted || 0,
            cooperationMediator: existing?.cooperationMediator || 0,
            cooperationGroup: existing?.cooperationGroup || '모둠_1',
            influenceNominated: existing?.influenceNominated || 0,
            influenceWeighted: existing?.influenceWeighted || 0,
            influenceMediator: existing?.influenceMediator || 0,
            influenceGroup: existing?.influenceGroup || '모둠_1',
          };
        });

        setStudents(mergedStudents);
        setBasicUploadedCount(newBasicList.length);
        alert(`[1] 학생 기본명단 ${newBasicList.length}명이 성공적으로 등록되었습니다!`);
      } catch (err) {
        console.error('Basic file parse error:', err);
        alert('학생 기본명단 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // 2. (2) CRA 데이터 시트 파일 업로드 (공식 CRA 원본 CSV / 엑셀 완벽 지원)
  const handleCraFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

        if (jsonData.length <= 1) {
          alert('CRA 데이터 시트가 비어있습니다.');
          return;
        }

        const headerRow = (jsonData[0] as string[]).map((h) => String(h || '').trim());

        // Dynamic column index lookup table
        const findCol = (domainKeyword: string, metricKeyword: string) => {
          return headerRow.findIndex(
            (h) => h.includes(domainKeyword) && h.includes(metricKeyword)
          );
        };

        const nameIdx = headerRow.findIndex((h) => h.includes('이름') || h.includes('성명'));
        const numIdx = headerRow.findIndex((h) => h.includes('학번') || h.includes('번호'));

        // Domain 0: Total Integrated
        const totNom = findCol('0_전체', '지목횟수');
        const totWgt = findCol('0_전체', '가중점수');
        const totMed = findCol('0_전체', '중재자');
        const totGrp = findCol('0_전체', '소집단');

        // Domain 1: Emotional Intimacy
        const intNom = findCol('1_정서적', '지목횟수') !== -1 ? findCol('1_정서적', '지목횟수') : headerRow.findIndex((h) => h.includes('친밀') && h.includes('지명'));
        const intWgt = findCol('1_정서적', '가중점수');
        const intMed = findCol('1_정서적', '중재자');
        const intGrp = findCol('1_정서적', '소집단') !== -1 ? findCol('1_정서적', '소집단') : headerRow.findIndex((h) => h.includes('친밀') && h.includes('모둠'));

        // Domain 2: Functional Cooperation
        const coopNom = findCol('2_기능적', '지목횟수');
        const coopWgt = findCol('2_기능적', '가중점수');
        const coopMed = findCol('2_기능적', '중재자');
        const coopGrp = findCol('2_기능적', '소집단');

        // Domain 3: Social Influence
        const infNom = findCol('3_사회적', '지목횟수') !== -1 ? findCol('3_사회적', '지목횟수') : headerRow.findIndex((h) => h.includes('영향') && h.includes('지명'));
        const infWgt = findCol('3_사회적', '가중점수');
        const infMed = findCol('3_사회적', '중재자');
        const infGrp = findCol('3_사회적', '소집단') !== -1 ? findCol('3_사회적', '소집단') : headerRow.findIndex((h) => h.includes('영향') && h.includes('모둠'));

        // Detect which '소집단' (group) columns could not be recognized in the header row.
        // These columns drive intimacyGroup, which the group-forming algorithm relies on
        // to score clique dispersion — if missing, every student silently falls back to
        // the same default group and that score becomes meaningless without any visible
        // warning to the teacher.
        const missingGroupColumns: string[] = [];
        if (totGrp === -1) missingGroupColumns.push('[0_전체_통합] 소집단');
        if (intGrp === -1) missingGroupColumns.push('[1_정서적_친밀감] 소집단');
        if (coopGrp === -1) missingGroupColumns.push('[2_기능적_협력] 소집단');
        if (infGrp === -1) missingGroupColumns.push('[3_사회적_영향력] 소집단');

        let matchedCount = 0;
        let transferredOutCount = 0;
        const updatedStudents = [...students];
        const matchedStudentIds = new Set<string>();

        // Check if basic list was already populated
        const hasBasicList = updatedStudents.length > 0;

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const sName = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : String(row[0] || '').trim();
          const sNum = numIdx !== -1 ? String(row[numIdx] || '').trim() : '';

          if (!sName && !sNum) continue;

          // Find student in existing state by name or studentNumber
          const targetIndex = updatedStudents.findIndex(
            (s) => (sName && s.name === sName) || (sNum && s.studentNumber === sNum)
          );

          const getNum = (colIdx: number) => (colIdx !== -1 && row[colIdx] !== undefined ? parseFloat(row[colIdx]) || 0 : 0);
          const getStr = (colIdx: number, fallback: string) => (colIdx !== -1 && row[colIdx] ? String(row[colIdx]).trim() : fallback);

          const craDataPartial = {
            totalNominated: getNum(totNom),
            totalWeighted: getNum(totWgt),
            totalMediator: getNum(totMed),
            totalGroup: getStr(totGrp, '모둠_1'),

            intimacyNominated: getNum(intNom),
            intimacyWeighted: intWgt !== -1 ? getNum(intWgt) : getNum(intNom) * 2,
            intimacyMediator: getNum(intMed),
            intimacyGroup: getStr(intGrp, '모둠_1'),

            cooperationNominated: getNum(coopNom),
            cooperationWeighted: getNum(coopWgt),
            cooperationMediator: getNum(coopMed),
            cooperationGroup: getStr(coopGrp, '모둠_1'),

            influenceNominated: getNum(infNom),
            influenceWeighted: infWgt !== -1 ? getNum(infWgt) : getNum(infNom) * 3,
            influenceMediator: getNum(infMed),
            influenceGroup: getStr(infGrp, '모둠_1'),
          };

          if (targetIndex !== -1) {
            // Update existing student with CRA data
            updatedStudents[targetIndex] = {
              ...updatedStudents[targetIndex],
              ...craDataPartial,
            };
            matchedStudentIds.add(updatedStudents[targetIndex].id);
            matchedCount++;
          } else if (!hasBasicList) {
            // If basic list was NOT uploaded previously, append new student from CRA data
            const newStudentId = `s_cra_${i}_${Date.now()}`;
            updatedStudents.push({
              id: newStudentId,
              studentNumber: sNum || `${updatedStudents.length + 1}`,
              name: sName || `학생_${i}`,
              gender: 'M',
              ...craDataPartial,
            });
            matchedStudentIds.add(newStudentId);
            matchedCount++;
          } else {
            // Student is in CRA sheet but NOT in basic list -> Transferred Out (전출생)
            transferredOutCount++;
          }
        }

        // Identify Transferred IN students (in basic list, but missing in CRA sheet)
        let transferredInCount = 0;
        updatedStudents.forEach((s) => {
          if (!matchedStudentIds.has(s.id)) {
            transferredInCount++;
            // Ensure neutral safe values so algorithm functions seamlessly
            if (!s.intimacyGroup || s.intimacyGroup === '모둠_1') {
              s.intimacyGroup = '신규_전입';
            }
          }
        });

        setStudents(updatedStudents);
        setCraUploadedCount(matchedCount);

        let reportMsg = `[CRA 데이터 연동 및 정원 보정 리포트]\n\n`;
        reportMsg += `✅ 기본명단 - CRA 데이터 정상 매칭: ${matchedCount}명\n`;
        if (transferredInCount > 0) {
          reportMsg += `ℹ️ 전입/미응답 학생 (${transferredInCount}명): 기본명단에는 있으나 CRA 데이터가 없어 '신규_전입' 모둠으로 자동 안전 설정되었습니다. (자리배치에 정상 참여)\n`;
        }
        if (transferredOutCount > 0) {
          reportMsg += `⚠️ 전출 제외 학생 (${transferredOutCount}명): 과거 CRA 시트에는 존재하나 현재 기본명단에 없어 자리배치 대상에서 자동 제외되었습니다.\n`;
        }
        if (missingGroupColumns.length > 0) {
          reportMsg += `\n🚨 소집단 컬럼 인식 실패: ${missingGroupColumns.join(', ')}\n`;
          reportMsg += `→ 위 항목은 컬럼명을 인식하지 못해 전체 학생이 기본값(모둠_1)으로 처리되었습니다. 이 상태에서는 '친밀집단 분산'/'교우관계 확장' 점수가 실제 관계망을 반영하지 못하니, CRA 데이터 시트의 컬럼명을 공식 양식과 대조해 다시 업로드해 주세요.\n`;
        }

        alert(reportMsg);
      } catch (err) {
        console.error('CRA file parse error:', err);
        alert('CRA 분석 시트 파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filter students in confirm view
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentNumber && s.studentNumber.includes(searchTerm));
    if (selectedGroup === 'all') return matchesSearch;
    if (selectedGroup === 'high_influence')
      return matchesSearch && (s.influenceWeighted >= 6 || s.influenceNominated >= 2);
    if (selectedGroup === 'high_cooperation')
      return matchesSearch && (s.cooperationWeighted >= 6 || s.cooperationNominated >= 2);
    return matchesSearch && s.intimacyGroup === selectedGroup;
  });

  const intimacyGroups = Array.from(new Set(students.map((s) => s.intimacyGroup))).sort();

  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.gender === 'M').length;
  const femaleCount = students.filter((s) => s.gender === 'F').length;
  const highInfluenceCount = students.filter(
    (s) => s.influenceWeighted >= 6 || s.influenceNominated >= 2
  ).length;

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const autoNumber = newStudentNumber.trim() || `${students.length + 1}`;
    const parsedScore = parseFloat(newStudentScore);
    const newStudent: CraStudent = {
      id: `s_${Date.now()}`,
      studentNumber: autoNumber,
      name: newStudentName.trim(),
      gender: newStudentGender,
      score: Number.isFinite(parsedScore) ? parsedScore : undefined,
      pastSeatInfo: newStudentPastSeat.trim() || undefined,
      notes: newStudentNotes.trim() || undefined,
      totalNominated: 0,
      totalWeighted: 0,
      totalMediator: 0,
      totalGroup: '모둠_1',
      intimacyNominated: 0,
      intimacyWeighted: 0,
      intimacyMediator: 0,
      intimacyGroup: '모둠_1',
      cooperationNominated: 0,
      cooperationWeighted: 0,
      cooperationMediator: 0,
      cooperationGroup: '모둠_1',
      influenceNominated: 0,
      influenceWeighted: 0,
      influenceMediator: 0,
      influenceGroup: '모둠_1',
    };
    setStudents([...students, newStudent]);
    setNewStudentNumber('');
    setNewStudentName('');
    setNewStudentScore('');
    setNewStudentPastSeat('');
    setNewStudentNotes('');
    setIsAddModalOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('해당 학생을 목록에서 삭제하시겠습니까?')) {
      setStudents(students.filter((s) => s.id !== id));
    }
  };

  const handleSaveEdit = (updated: CraStudent) => {
    setStudents(students.map((s) => (s.id === updated.id ? updated : s)));
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-step Navigation Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-extrabold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                1단계: 학생 & CRA 데이터 관리
              </span>
              <h2 className="text-xl font-black text-slate-800">학급 정보 및 CRA 분석 데이터 연동</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              (1) 학생 기본명단과 (2) CRA 관계분석 시트를 각각 업로드한 후, 하나로 통합하여 관리합니다.
            </p>
          </div>

          {onOpenCraGuide && (
            <button
              type="button"
              onClick={onOpenCraGuide}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs sm:text-sm rounded-2xl border border-purple-200 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Network className="w-4 h-4 text-purple-600 shrink-0" />
              <span>학급 교우관계 분석 도우미(CRA) 안내</span>
            </button>
          )}
        </div>

        {/* Integrated Stepper Tab Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSubStep('upload')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              subStep === 'upload'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  subStep === 'upload'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                1
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>단계 1: 자료 업로드</span>
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    subStep === 'upload' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  (1) 기본 명단 & (2) CRA 시트 업로드
                </div>
              </div>
            </div>
            {subStep === 'upload' && (
              <span className="px-2.5 py-1 text-[10px] font-black bg-white/20 text-white rounded-full">
                진행중
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubStep('confirm')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              subStep === 'confirm'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                  subStep === 'confirm'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>단계 2: 학생자료 확인</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      subStep === 'confirm'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {students.length}명
                  </span>
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    subStep === 'confirm' ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  통합 데이터 검토 및 개별 편집
                </div>
              </div>
            </div>
            {subStep === 'confirm' && (
              <span className="px-2.5 py-1 text-[10px] font-black bg-white/20 text-white rounded-full">
                진행중
              </span>
            )}
          </button>
        </div>
      </div>

      {subStep === 'upload' ? (
        /* ================= [단계 1: 자료 업로드] ================= */
        <div className="space-y-6">
          {/* Quick 25-Student CRA Test Sample Loader Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">
                    25명 CRA 테스트용 가상 샘플 데이터
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-md">
                    테스트 추천
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                  별도 엑셀 파일 없이 25명 학급의 교우관계망(소모임, 짝, 영향력, 협력) 가상 샘플을 즉시 로드하여 알고리즘을 테스트할 수 있습니다.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadSampleData25}
              className="w-full sm:w-auto px-5 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ 25명 샘플 데이터 즉시 불러오기</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Box 1: (1) 학생 기본명단 업로드 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-indigo-100 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-xs rounded-xl">
                    자료 1
                  </span>
                  {basicUploadedCount !== null && (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{basicUploadedCount}명 완료</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      (1) 학생 기본명단 파일 업로드
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      학번, 이름, 성별, 성적(선택), 이전 자리배치, 특이사항(비고)
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>필수 및 선택 항목 안내</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-slate-700">필수 항목:</strong> 학번, 이름, 성별
                    </li>
                    <li>
                      <strong className="text-slate-700">선택 항목:</strong> 성적(모둠 간 성적 균형 배치에 사용), 이전 자리배치 기록, 비고(특이사항 등)
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadBasicSample}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>(1) 기본명단 양식 샘플 다운로드 (.xlsx)</span>
                </button>

                <label className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>학생 기본명단 업로드 (CSV / Excel)</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleBasicFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Box 2: (2) CRA 데이터 시트 업로드 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-purple-100 hover:border-purple-300 transition-all flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 font-black text-xs rounded-xl">
                    선택 자료 2
                  </span>
                  {craUploadedCount !== null && (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{craUploadedCount}건 매칭완료</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      (2) CRA 데이터 시트 업로드
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      정서적 친밀감 · 기능적 협력 · 사회적 영향력 소집단 관계 분석결과
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>CRA 연동 안내</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-slate-700">자동 병합 기준:</strong> 학번 또는 이름 기준 자동 매칭
                    </li>
                    <li>
                      CRA 관계 망 소집단(친밀감 그룹, 리더 지표)이 학생 데이터와 자동 결합됩니다.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadCraSample}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-purple-600" />
                  <span>(2) CRA 데이터 시트 양식 샘플 다운로드 (.xlsx)</span>
                </button>

                <label className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>CRA 데이터 시트 업로드 (CSV / Excel)</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleCraFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Box 3: (선택) 이전 자리배치 결과 업로드 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-amber-100 hover:border-amber-300 transition-all flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 font-black text-xs rounded-xl">
                    선택 자료 3
                  </span>
                  {pastUploadedCount !== null && (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{pastUploadedCount}건 연동완료</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      (선택) 이전 자리배치 파일 업로드
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      이전 자리배치 JSON 백업 파일 또는 엑셀 (.xlsx, .json)
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>책상 배치 & 이전 짝꿍 회피 연동 안내</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] leading-relaxed">
                    <li>
                      <strong className="text-slate-700">JSON 업로드 시:</strong> 책상 배치 데이터(행/열/통로)가 <strong className="text-slate-700">메뉴 2에 자동 적용</strong>됩니다.
                    </li>
                    <li>
                      3단계에서 <strong className="text-slate-700">'이전 짝궁 회피'</strong> 선택 시 이전 짝과의 중복 배치를 자동 방지합니다.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadPastSeatingSample}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>(3) 엑셀 양식 샘플 다운로드 (.xlsx)</span>
                </button>

                <label className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>이전 자리배치 업로드 (JSON / Excel / CSV)</span>
                  <input
                    type="file"
                    accept=".json, .csv, .xlsx, .xls"
                    onChange={handlePastSeatingFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Bottom Consolidated Action Bar */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-black text-base">
                  현재 통합 관리 학생 수: {students.length}명
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                두 자료가 잘 로드되었는지 단계 2에서 한눈에 확인하고 필요한 학생 정보를 직접 수정할 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => setSubStep('confirm')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>통합 데이터 확인하기 (단계 2 이동)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= [단계 2: 통합 학생자료 확인 & 편집] ================= */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                <span>총 학급 인원</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                {totalStudents} <span className="text-xs font-bold text-slate-500">명</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-semibold">
                남 {maleCount}명 / 여 {femaleCount}명
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 shadow-xs">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-bold">
                <span>정서적 친밀감 그룹</span>
                <HeartHandshake className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900 mt-2">
                {intimacyGroups.length} <span className="text-xs font-bold text-indigo-600">개 소집단</span>
              </div>
              <div className="text-xs text-indigo-600/80 mt-1 font-medium">
                친밀 짝/모둠 분산 배치 적용
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 shadow-xs">
              <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
                <span>영향력 리더</span>
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-900 mt-2">
                {highInfluenceCount} <span className="text-xs font-bold text-purple-600">명</span>
              </div>
              <div className="text-xs text-purple-600/80 mt-1 font-medium">
                학급 균형 배치 대상
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold">
                <span>성적 데이터 입력</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">
                {students.filter((s) => typeof s.score === 'number').length}{' '}
                <span className="text-xs font-bold text-emerald-600">명</span>
              </div>
              <div className="text-xs text-emerald-600/80 mt-1 font-medium">
                모둠 간 성적 균형 배치에 반영
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="학번 또는 이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>학생 직접 추가</span>
              </button>

              <button
                onClick={onProceedToLayout}
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md cursor-pointer whitespace-nowrap"
              >
                <span>2단계: 책상 배치 설정</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">학번</th>
                    <th className="py-3.5 px-4">이름 / 성별</th>
                    <th className="py-3.5 px-3">성적</th>
                    <th className="py-3.5 px-3">비고 / 특이사항</th>
                    <th className="py-3.5 px-3">이전 자리배치 기록</th>
                    <th className="py-3.5 px-3">CRA 친밀감 그룹</th>
                    <th className="py-3.5 px-3">CRA 사회적 영향력</th>
                    <th className="py-3.5 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-700">
                        {s.studentNumber || '-'}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              s.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                            }`}
                            title={s.gender === 'M' ? '남학생' : '여학생'}
                          />
                          <span>{s.name}</span>
                          <span className="text-xs text-slate-400 font-medium">
                            ({s.gender === 'M' ? '남' : '여'})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-xs font-bold text-slate-700">
                        {typeof s.score === 'number' ? s.score : <span className="text-slate-300 font-normal">-</span>}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600">
                        {s.notes ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg font-bold inline-block">
                            {s.notes}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-600">
                        {s.pastSeatInfo ? (
                          <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 w-fit">
                            <History className="w-3 h-3 text-slate-500" />
                            {s.pastSeatInfo}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                          {s.intimacyGroup} ({s.intimacyNominated}회)
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {s.influenceNominated > 0 || s.influenceWeighted > 0 ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-lg border border-purple-200">
                            ⚡ 리더 ({s.influenceWeighted}점)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="정보 수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="학생 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">새 학생 추가</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학번</label>
                <input
                  type="text"
                  value={newStudentNumber}
                  onChange={(e) => setNewStudentNumber(e.target.value)}
                  placeholder="예: 1 또는 10101"
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학생 이름 *</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">성별 *</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewStudentGender('M')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    newStudentGender === 'M'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  남학생
                </button>
                <button
                  type="button"
                  onClick={() => setNewStudentGender('F')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    newStudentGender === 'F'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  여학생
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                성적 (선택)
              </label>
              <input
                type="number"
                value={newStudentScore}
                onChange={(e) => setNewStudentScore(e.target.value)}
                placeholder="예: 88"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                이전 자리배치 기록
              </label>
              <input
                type="text"
                value={newStudentPastSeat}
                onChange={(e) => setNewStudentPastSeat(e.target.value)}
                placeholder="예: 1행 2열 (짝: 학생02)"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                특이사항 (비고)
              </label>
              <input
                type="text"
                value={newStudentNotes}
                onChange={(e) => setNewStudentNotes(e.target.value)}
                placeholder="예: 청력 고려, 특별 지도 필요 등"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                추가 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800">
              학생 정보 수정 ({editingStudent.name})
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학번</label>
                <input
                  type="text"
                  value={editingStudent.studentNumber || ''}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, studentNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">이름</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">성별</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent({ ...editingStudent, gender: 'M' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    editingStudent.gender === 'M'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  남학생
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent({ ...editingStudent, gender: 'F' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    editingStudent.gender === 'F'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  여학생
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                성적 (선택)
              </label>
              <input
                type="number"
                value={editingStudent.score ?? ''}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    score: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  })
                }
                placeholder="예: 88"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                이전 자리배치 기록
              </label>
              <input
                type="text"
                value={editingStudent.pastSeatInfo || ''}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, pastSeatInfo: e.target.value })
                }
                placeholder="예: 1행 2열 (짝: 학생02)"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                특이사항 (비고)
              </label>
              <input
                type="text"
                value={editingStudent.notes || ''}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, notes: e.target.value })
                }
                placeholder="예: 청력 고려, 특별 지도 필요 등"
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={() => handleSaveEdit(editingStudent)}
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
