import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyInfoModal: React.FC<PrivacyInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">개인정보보호 동작 원리</h2>
              <p className="text-xs text-slate-400">학생 개인정보가 외부로 유출되지 않는 이유</p>
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
        <div className="p-6 overflow-y-auto text-xs flex-1">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              개인정보 외부 유출 ZERO (안전한 로컬 전용 처리)
            </h3>
            <ul className="space-y-2 text-emerald-800 leading-relaxed font-medium">
              <li>
                <strong className="font-extrabold text-emerald-950">
                  • Local In-Memory Processing:
                </strong>{' '}
                선생님께서 입력/업로드하신 학생 명단 파일, 성적 데이터, CRA 교우관계 지목 데이터는 오직 선생님 교사 PC의 브라우저 메모리(RAM) 내부에서만 분석됩니다.
              </li>
              <li>
                <strong className="font-extrabold text-emerald-950">
                  • No External Database:
                </strong>{' '}
                Firestore, Cloud SQL 등 외부 서버나 외부 데이터베이스로 학생 개인정보 및 모둠 배치 정보를 전송하지 않습니다.
              </li>
              <li>
                <strong className="font-extrabold text-emerald-950">
                  • 100% Client-Side Output:
                </strong>{' '}
                모둠구성 제약조건 판정, 성적·CRA 균형 알고리즘 계산, 엑셀 출력 및 인쇄용 도면 생성까지 모든 기능이 외부 서버를 거치지 않고 교사 PC 내부에서 100% 즉시 처리됩니다.
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
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
