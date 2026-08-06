import React from 'react';
import { Bookmark, X, ShieldCheck, Sliders, Sparkles, Instagram } from 'lucide-react';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bookmark className="w-5 h-5 fill-current text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                과목 학습모둠 구성 도우미 시스템 안내
              </h2>
              <p className="text-xs text-slate-400">버전 v1.0 (2026.08.)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* 1. 데이터 보안 및 개인정보보호 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              데이터 보안 및 개인정보보호
            </h3>
            <ul className="space-y-1.5 text-emerald-800 leading-relaxed font-medium">
              <li>
                • 학생 이름, 학번, 성별, 자리 고정 및 제약조건 데이터는 선생님의 브라우저 및 로컬 단말기에만 저장됩니다.
              </li>
              <li>
                • 제작자는 이 데이터에 일절 접근하지 않으며, 어떠한 외부 서버로도 유출되거나 전송되지 않습니다.
              </li>
            </ul>
          </div>

          {/* 2. 모둠 배치 최적화 작동 방식 */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              모둠 배치 최적화 작동 방식
            </h3>
            <ul className="space-y-1.5 text-indigo-900 leading-relaxed font-medium">
              <li>
                • <strong>로컬 연산 처리:</strong> 지정한 고정석, 성별 배치, 같이/따로 관계 및 같은 모둠 소속 여부 제약조건을 교사 PC 브라우저 내 알고리즘이 실시간 최적 연산합니다.
              </li>
              <li>
                • <strong>다각도 배치 후보:</strong> 성적 균형 우선안, 협력 균형 우선안, 친밀감 분산 우선안 등 다각도 모둠 배치 후보안을 자동 생성합니다.
              </li>
              <li>
                • <strong>안전한 로컬 저장:</strong> 입력된 학생 데이터 및 과거 모둠 배치는 외부 서버 전송 없이 교사 PC 브라우저(LocalStorage)에만 안전하게 보관됩니다.
              </li>
            </ul>
          </div>

          {/* 3. 제작: 두리쌤 */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              제작: 두리쌤
            </h3>
            <div className="space-y-1 text-purple-900 leading-relaxed">
              <div className="font-extrabold text-purple-950 mb-1">📌 이용 조건</div>
              <ul className="space-y-1 pl-1 font-medium">
                <li>• 교육 목적으로 자유롭게 사용하실 수 있습니다.</li>
                <li>• 재배포 시 출처(제작자 표기)를 유지해주세요.</li>
                <li>• 코드를 임의로 수정한 버전을 다시 배포하지 말아주세요.</li>
                <li>• 수정이 필요하시면 아래 연락처로 요청해주세요.</li>
              </ul>
            </div>
          </div>

          {/* 4. 문의 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-pink-600" />
              문의
            </h3>
            <ul className="space-y-1 text-slate-700 font-medium">
              <li>
                • Instagram:{' '}
                <a
                  href="https://instagram.com/trdoolee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  trdoolee
                </a>
              </li>
              <li className="text-slate-500 text-[11px]">
                • 간단한 질문 위주로 답변드리며, 답변이 늦어질 수 있습니다.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
