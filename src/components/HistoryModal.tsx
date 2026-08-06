import React, { useRef } from 'react';
import { SeatingResult } from '../types';
import { History, Trash2, CheckCircle2, X, Calendar, Upload, FileText } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedResults: SeatingResult[];
  onDeleteHistory: (id: string) => void;
  onLoadHistory: (result: SeatingResult) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedResults,
  onDeleteHistory,
  onLoadHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.assignments) {
          const result: SeatingResult = {
            id: parsed.id || `uploaded_${Date.now()}`,
            title: parsed.title || '업로드된 자리배치안',
            description: parsed.description || '내 PC 파일에서 불러온 자리배치입니다.',
            date: parsed.date || new Date().toLocaleDateString('ko-KR'),
            assignments: parsed.assignments,
            desks: parsed.desks,
            dimensions: parsed.dimensions,
            metrics: parsed.metrics || {
              scoreBalanceScore: 90,
              cooperationBalanceScore: 90,
              intimacyDispersionScore: 90,
              influenceBalanceScore: 90,
              constraintSatisfactionScore: 100,
              overallScore: 90,
            },
          };
          onLoadHistory(result);
          onClose();
        } else {
          alert('올바른 자리배치 JSON 파일 형식이 아닙니다.');
        }
      } catch (err) {
        alert('파일을 읽는 도중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold inline-block">
            📜 과거 자리배치 (.json) 복원하기
          </span>
          <h2 className="text-xl font-bold text-slate-900">과거 자리배치 확인하기</h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            내 PC에 저장된 자리배치 백업 파일(.json)을 업로드하여 책상 배치도와 학생 자리를 화면에 그대로 복원할 수 있습니다.
          </p>
        </div>

        {/* JSON File Upload Box */}
        <div className="p-6 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileText className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-indigo-950">내 PC에서 자리배치 파일(.json) 업로드</div>
              <div className="text-xs text-indigo-700 mt-0.5">결과화면에서 다운로드한 .json 백업 파일로 전체 복원합니다.</div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>파일 선택 및 업로드</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
