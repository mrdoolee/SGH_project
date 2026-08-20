import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-modal-title"
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-3 pb-0 shrink-0">
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-1 space-y-4 overflow-y-auto text-xs text-slate-700">
          {/* Card 1: 제작 & 이용 조건 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <h3 id="credit-modal-title" className="font-extrabold text-sm text-slate-900">
              ✨ 제작: 두리쌤
            </h3>
            <div className="font-extrabold text-slate-800 pt-1">📌 이용 조건</div>
            <ul className="space-y-1.5 text-slate-600 font-medium leading-relaxed">
              <li>• 교육 목적으로 자유롭게 사용하실 수 있습니다.</li>
              <li>• 재배포 시 출처(제작자 표기)를 유지해주세요.</li>
              <li>• 코드를 임의로 수정한 버전을 다시 배포하지 말아주세요.</li>
              <li>• 수정이 필요하시면 아래 연락처로 요청해주세요.</li>
            </ul>
          </div>

          {/* Card 2: 문의 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="font-extrabold text-sm text-slate-900">📷 문의</div>
            <ul className="space-y-1.5 text-slate-600 font-medium leading-relaxed">
              <li>
                • Instagram:{' '}
                <a
                  href="https://www.instagram.com/trdoolee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  trdoolee
                </a>
              </li>
              <li>
                • Blog:{' '}
                <a
                  href="https://blog.naver.com/trdoolee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:underline"
                >
                  blog.naver.com/trdoolee
                </a>
              </li>
            </ul>
            <p className="text-slate-400 text-[11px] italic pt-1">
              간단한 질문 위주로 답변드리며, 답변이 늦어질 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
