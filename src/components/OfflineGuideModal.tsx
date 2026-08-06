import React, { useState } from 'react';
import { Laptop, X, ShieldCheck, Copy, Check } from 'lucide-react';

interface OfflineGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineGuideModal: React.FC<OfflineGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const batScript = `@echo off
title 과목 학습모둠 구성 도우미 - 오프라인 개인 PC 모드
echo ===================================================
echo 과목 학습모둠 구성 도우미 (Study Group Formation Helper)
echo 개인정보보호를 위해 로컬 단말기 메모리에서만 동작합니다.
echo ===================================================
npm run start
pause`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(batScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                개인 PC 오프라인 실행 파일 (.exe) 패키징 가이드
              </h2>
              <p className="text-xs text-slate-400">
                학생 개인정보 유출 방지를 위한 로컬 실행 가이드
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-6 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab(1)}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 1
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            1. 개인정보보호 동작 원리
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 2
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            2. 간편 실행 스크립트 (run_app.bat)
          </button>
          <button
            onClick={() => setActiveTab(3)}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 3
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            3. Electron 빌드 (.exe 패키징)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs flex-1">
          {activeTab === 1 && (
            <div className="space-y-4">
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
                    선생님께서 입력/업로드하신 학생 이름 명단, 자리 고정, 같이/따로 앉기 및 제약조건 데이터는 오직 선생님 교사 PC의 브라우저 메모리(RAM) 내부에서만 분석됩니다.
                  </li>
                  <li>
                    <strong className="font-extrabold text-emerald-950">
                      • No External Database:
                    </strong>{' '}
                    Firestore, Cloud SQL 등 외부 서버나 외부 데이터베이스로 학생 개인정보 및 자리배치 정보를 전송하지 않습니다.
                  </li>
                  <li>
                    <strong className="font-extrabold text-emerald-950">
                      • 100% Client-Side Output:
                    </strong>{' '}
                    모둠구성 필수/선호 제약조건 판정, 최적 모둠 배치 알고리즘 계산, 엑셀 출력까지 모든 기능이 외부 서버를 거치지 않고 교사 PC 내부에서 100% 즉시 처리됩니다.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-4">
              {/* Tip box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 space-y-1">
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  💡 간편 실행 스크립트(run_app.bat)란?
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  어려운 개발 프로그램이나 별도의 프로그램 설치 없이, 다운로드받은 프로그램 폴더에서 마우스 더블클릭 한 번으로 내 PC에서 오프라인 실행되게 만드는 가장 쉬운 실행 방법입니다.
                </p>
              </div>

              {/* 3 Step Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="font-extrabold text-xs text-slate-800">
                  📌 누구나 쉽게 따라 하는 3단계 실행 방법
                </div>
                <ol className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    1. 소스를 다운로드받은 프로그램 폴더 안에 메모장(새 텍스트 문서)을 열고 파일 이름을 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">run_app.bat</code> 로 변경합니다.
                  </li>
                  <li>
                    2. 아래 상자의 명령어를 <strong>[스크립트 복사]</strong> 버튼을 눌러 복사한 후 메모장에 붙여넣고 저장합니다.
                  </li>
                  <li>
                    3. 이제 만들어진 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">run_app.bat</code> 파일만 더블클릭하시면, 선생님 PC의 웹 브라우저가 열리며 인터넷 서버 연결 없는 안전한 오프라인 분석 도구가 실행됩니다!
                  </li>
                </ol>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">run_app.bat</span>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>스크립트 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-indigo-300 bg-slate-900/90 p-3 rounded-xl overflow-x-auto leading-relaxed border border-slate-800/80">
                  {batScript}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sky-900 space-y-1">
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  💡 Electron 패키징이란?
                </div>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  본 React 소스 코드를 Windows 데스크톱 프로그램 (<code className="bg-sky-100 px-1 py-0.5 rounded text-sky-900 font-mono">Classroom_Seating_Installer.exe</code>) 형태로 패키징하여 인터넷 연결 없이 개인 PC에서 독립 실행할 수 있게 만드는 방법입니다.
                </p>
              </div>

              <div className="space-y-3 text-slate-700">
                <div>
                  <div className="font-bold text-xs text-slate-800 mb-1">
                    단계 1: Electron 패키지 설치
                  </div>
                  <pre className="font-mono text-[11px] bg-slate-950 text-emerald-400 p-3 rounded-xl overflow-x-auto">
                    npm install --save-dev electron electron-builder
                  </pre>
                </div>

                <div>
                  <div className="font-bold text-xs text-slate-800 mb-1">
                    단계 2: electron/main.js 생성
                  </div>
                  <pre className="font-mono text-[11px] bg-slate-950 text-indigo-300 p-3 rounded-xl overflow-x-auto leading-relaxed">
{`const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Study Group Formation Helper (오프라인 실행 모드)",
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.whenReady().then(createWindow);`}
                  </pre>
                </div>
              </div>
            </div>
          )}
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
