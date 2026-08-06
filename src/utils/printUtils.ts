import { SeatingResult, CraStudent, DeskPosition, GridDimensions, ViewPerspective } from '../types';

const POD_COLOR_HEXES = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#f43f5e', '#06b6d4', '#84cc16', '#d946ef'];
const getPodColorHex = (podId: number | undefined) =>
  POD_COLOR_HEXES[podId !== undefined ? podId % POD_COLOR_HEXES.length : 0];

export function printSeatingChart(options: {
  title: string;
  subtitle: string;
  perspective: ViewPerspective;
  result: SeatingResult;
  students: CraStudent[];
  defaultDesks: DeskPosition[];
  defaultDimensions: GridDimensions;
  listPosition?: 'none' | 'left' | 'right';
}) {
  const {
    title,
    subtitle,
    perspective,
    result,
    students,
    defaultDesks,
    defaultDimensions,
    listPosition = 'none',
  } = options;

  const studentMap = new Map<string, CraStudent>(students.map((s) => [s.id, s]));
  const effectiveDesks = result.desks && result.desks.length > 0 ? result.desks : defaultDesks;
  void defaultDimensions; // dimensions no longer drive layout; pods are laid out by their own spatial position

  // Group active desks by podId, and record each pod's average grid row (for spatial ordering)
  const podDesks = new Map<number, DeskPosition[]>();
  effectiveDesks
    .filter((d) => !d.disabled && d.podId !== undefined)
    .forEach((d) => {
      if (!podDesks.has(d.podId!)) podDesks.set(d.podId!, []);
      podDesks.get(d.podId!)!.push(d);
    });

  type PodInfo = { podId: number; avgRow: number; deskIds: string[] };
  const podInfos: PodInfo[] = Array.from(podDesks.entries())
    .map(([podId, deskList]) => {
      const avgRow = deskList.reduce((s, d) => s + d.row, 0) / deskList.length;
      return {
        podId,
        avgRow,
        deskIds: deskList.map((d) => d.id),
      };
    })
    .sort((a, b) => a.podId - b.podId);

  // Group pods into visual print-rows by their spatial row band (matches the desk layout's pod grid)
  const printRows: PodInfo[][] = [];
  podInfos.forEach((info) => {
    const lastRow = printRows[printRows.length - 1];
    if (lastRow && Math.abs(lastRow[0].avgRow - info.avgRow) < 0.01) {
      lastRow.push(info);
    } else {
      printRows.push([info]);
    }
  });
  if (perspective === 'teacher') printRows.reverse();

  const podColorHex = (podId: number) => getPodColorHex(podId);

  let podGridHtml = '';
  printRows.forEach((row) => {
    const cardsHtml = row
      .map((info) => {
        const memberChips = info.deskIds
          .map((deskId) => {
            const studentId = result.assignments[deskId];
            const student = studentId ? studentMap.get(studentId) : null;
            if (!student) return `<div class="member empty">빈 좌석</div>`;
            return `
              <div class="member">
                <div class="m-num">${student.studentNumber || ''}</div>
                <div class="m-name">${student.name}</div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="pod-card" style="border-top-color:${podColorHex(info.podId)}">
            <div class="pod-header" style="background:${podColorHex(info.podId)}22;">
              <span class="pod-badge" style="background:${podColorHex(info.podId)}">모둠 ${info.podId + 1}</span>
            </div>
            <div class="pod-members">${memberChips}</div>
          </div>
        `;
      })
      .join('');

    podGridHtml += `<div class="pod-row">${cardsHtml}</div>`;
  });

  // Student List Table sorted by studentNumber ascending
  let studentTableHtml = '';
  if (listPosition && listPosition !== 'none') {
    const sortedStudents = [...students].sort((a, b) => {
      const numA = parseInt(a.studentNumber || '0', 10);
      const numB = parseInt(b.studentNumber || '0', 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB; // 오름차순
      }
      return (a.studentNumber || '').localeCompare(b.studentNumber || '');
    });

    const rowsHtml = sortedStudents
      .map(
        (s) => `<tr><td class="num">${s.studentNumber || '-'}</td><td class="name">${s.name}</td></tr>`
      )
      .join('');

    studentTableHtml = `
      <div class="student-list-panel">
        <div class="list-title">학생 명단</div>
        <table class="student-table">
          <thead>
            <tr>
              <th>학번</th>
              <th>이름</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  const boardText =
    perspective === 'student'
      ? '[ 칠 판 / 교 탁 (교실 앞) ]'
      : '[ 칠 판 / 교 탁 (교실 앞 - 교사 시선) ]';

  const boardHtml = `<div class="board">${boardText}</div>`;
  const topBoard = perspective === 'student' ? boardHtml : '';
  const bottomBoard = perspective === 'teacher' ? boardHtml : '';

  const formattedSubtitle = subtitle ? subtitle.replace(/\n/g, '<br/>') : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title || '학급 모둠 배치표'}</title>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif; margin: 0; padding: 8px; background: #fff; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 6px; margin-bottom: 8px; }
        .header h1 { font-size: 20px; margin: 0 0 4px 0; font-weight: 900; color: #0f172a; }
        .header p { font-size: 11.5px; margin: 0; color: #475569; font-weight: 600; white-space: pre-line; line-height: 1.35; }
        .board { background: #f1f5f9; border: 2px solid #334155; border-radius: 8px; text-align: center; padding: 5px; font-weight: 800; font-size: 11.5px; letter-spacing: 2px; color: #0f172a; margin: 0 0 8px 0; width: 100%; }
        .content-layout { display: flex; align-items: flex-start; justify-content: center; gap: 16px; width: 100%; margin: 6px 0; }
        .grid-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; flex-shrink: 0; }

        /* Pod (group) cards */
        .pod-row { display: flex; align-items: flex-start; justify-content: center; gap: 10px; }
        .pod-card { border: 1.5px solid #1e293b; border-top: 5px solid #6366f1; border-radius: 10px; background: #fff; overflow: hidden; min-width: 150px; }
        .pod-header { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 6px; border-bottom: 1px solid #1e293b; }
        .pod-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 900; color: #fff; }
        .pod-members { display: flex; flex-wrap: wrap; gap: 4px; padding: 5px; justify-content: center; }
        .member { width: 62px; min-height: 44px; border: 1.5px solid #cbd5e1; border-radius: 7px; padding: 3px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #f8fafc; }
        .member.empty { color: #94a3b8; font-size: 9px; border-style: dashed; }
        .m-num { font-size: 9px; font-weight: 800; color: #3730a3; font-family: monospace; line-height: 1; }
        .m-name { font-size: 12px; font-weight: 900; color: #0f172a; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Student List Panel */
        .student-list-panel { width: 145px; flex-shrink: 0; border: 1.5px solid #334155; border-radius: 8px; padding: 4px; background: #f8fafc; }
        .student-list-panel .list-title { font-weight: 800; font-size: 10px; text-align: center; border-bottom: 1.5px solid #334155; padding-bottom: 3px; margin-bottom: 3px; color: #0f172a; }
        .student-table { width: 100%; border-collapse: collapse; text-align: center; }
        .student-table th { background: #e2e8f0; padding: 2px 3px; font-weight: 800; font-size: 9px; border-bottom: 1px solid #94a3b8; }
        .student-table td { padding: 2px 3px; font-weight: 700; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; line-height: 1.15; }
        .student-table tr:nth-child(even) { background: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title || result.title}</h1>
        ${formattedSubtitle ? `<p>${formattedSubtitle}</p>` : ''}
      </div>
      <div class="content-layout">
        ${listPosition === 'left' ? studentTableHtml : ''}
        <div class="grid-wrapper">
          ${topBoard}
          ${podGridHtml}
          ${bottomBoard}
        </div>
        ${listPosition === 'right' ? studentTableHtml : ''}
      </div>
    </body>
    </html>
  `;

  let windowOpened = false;
  try {
    const printWin = window.open('', '_blank', 'width=950,height=850');
    if (printWin) {
      windowOpened = true;
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 300);
    }
  } catch (e) {
    console.warn('Popup blocked, falling back to iframe print', e);
  }

  if (!windowOpened) {
    let iframe = document.getElementById('app-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'app-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 300);
    } else {
      window.print();
    }
  }
}
