import React from 'react';
import { X, Users, LayoutGrid, SlidersHorizontal, Eye } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-6 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold inline-block">
            📖 교사용 활용 가이드
          </span>
          <h2 className="text-xl font-bold text-slate-900">과목 학습모둠 구성 도우미 사용법</h2>
          <p className="text-xs text-slate-500">
            성적 균형과 학급 교우관계 분석 도우미(CRA)의 분석 결과를 활용하여 3/4/6인 학습모둠을 구성합니다.
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              1. 시작 방법 & 데이터 업로드 (메뉴 1)
            </h3>
            <p className="leading-relaxed">
              처음 접속 시 학생 데이터가 없이 시작됩니다. <b>[학생 기본명단 엑셀]</b>(학번·이름·성별, 선택 성적)을 업로드해 시작하고,
              <b>CRA 관계분석 시트</b>와 <b>성적 데이터</b>는 모두 <b>선택 사항</b>입니다. 둘 다 없어도 성비 균형만 반영한 <b>기본 균형 배치(후보 4)</b>를 사용할 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-indigo-600" />
              2. 모둠 구성 설정 (메뉴 2)
            </h3>
            <p className="leading-relaxed">
              3인/4인/6인 모둠 크기를 선택한 뒤 <b>모둠 수를 직접 지정</b>합니다. 학생 수와 맞지 않으면 안내 배너가 표시되며, 책상판을 클릭해 남는 좌석을 켜고 끌 수 있습니다.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              3. 제약조건 & 알고리즘 설정 (메뉴 3)
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><b>1~3번 (모둠구성 필수 조건):</b> 학생 자리 고정, 같이/따로 앉아야 하는 짝 지정, 성별 배치 규칙</li>
              <li><b>4번 (이전 모둠 회피):</b> 직전 모둠 배치와 같은 모둠이 되지 않도록 회피</li>
              <li><b>5번 (CRA 관계 알고리즘):</b> CRA 분석 시트를 업로드한 경우 활성화되며, 정서적 친밀감·기능적 협력·사회적 영향력 가중치를 조절하여 후보 1~3을 생성</li>
              <li><b>6번 (성적 균형 옵션):</b> 성적 데이터를 업로드한 경우 활성화되며, 모둠 간 평균 성적 편차를 줄이는 가중치를 조절</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              4. 시점 전환 & 배치 히스토리 저장 (메뉴 4)
            </h3>
            <p className="leading-relaxed">
              학생 시점(칠판 상단)과 교사 시점(칠판 하단)으로 간편히 화면을 전환할 수 있습니다. <b>[저장]</b> 버튼을 누르면 과거 모둠 배치 기록이 로컬 브라우저에 보관되며, 다음 배치 시 이전 모둠 자동 회피에 활용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
