import React from 'react';
import { Users, X, ExternalLink, Sparkles, Network } from 'lucide-react';

interface CraGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CraGuideModal: React.FC<CraGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                학급 교우관계 분석 도우미(CRA) 안내
              </h2>
              <p className="text-xs text-purple-300 font-medium">Classroom Relationship Analysis</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 flex-1">
          {/* Add-on App Notification */}
          <div className="bg-indigo-50/90 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-extrabold text-indigo-950 text-xs sm:text-sm">
                Add-on Application
              </div>
              <p className="text-indigo-900 text-xs font-semibold leading-relaxed">
                과목 학습모둠 구성 도우미는 <strong className="text-indigo-950">학급 교우관계 분석 도우미(CRA)</strong>의 Add-on app입니다.
              </p>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" />
              CRA (Classroom Relationship Analysis)란?
            </h3>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
              CRA(Classroom Relationship Analysis)는 설문 응답 기반의 사회관계망 분석(SNA) 알고리즘을 활용하여 학급 내 교우관계 구조와 영향력, 소집단(모둠) 및 고립 위험 학생을 정밀하게 파악하도록 돕는 학급 맞춤형 교우관계 분석·진단 시스템입니다.
            </p>
          </div>

          {/* Web Link */}
          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 text-center space-y-2">
            <div className="text-xs font-bold text-purple-900">학급 교우관계 분석 도우미(CRA) 바로가기</div>
            <a
              href="https://cra-project-two.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer w-full sm:w-auto"
            >
              <span>https://cra-project-two.vercel.app/</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
