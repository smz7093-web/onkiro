/* 관리자(운영팀) · 지자체 화면 */

/* ───── 운영 (M4) ───── */
add({
  id: 'ops-dash', role: '관리자', group: '무인 운영 (M4) · 예정', title: '운영 대시보드', ph: 'P2', sc: 'S7', fn: 'OPS-07', dev: '웹',
  desc: '오늘의 체크인·아웃, 청소 상태, 미처리 신고, 자동화 실패 건을 한 화면에서 본다.',
  html: () => adminWeb('/ops', `
    <div class="row between"><h2 class="h h-lg">10월 6일 (화) · 오늘</h2><span class="small">09:02 기준 · 5분마다 새로고침</span></div>
    <div class="grid4">
      <div class="card"><div class="stat"><span class="k">체크인</span><span class="v">2</span><span class="d">1호점 15:00 · 2호점 15:00</span></div></div>
      <div class="card"><div class="stat"><span class="k">체크아웃</span><span class="v">1</span><span class="d">2호점 11:00</span></div></div>
      <div class="card"><div class="stat"><span class="k">청소</span><span class="v">1<small>/ 2 배정</small></span><span class="d">1호점 담당자 거절</span></div></div>
      <div class="card" style="border-color:var(--crit)"><div class="stat"><span class="k">미처리 예외</span><span class="v" style="color:var(--crit)">2</span><span class="d">긴급 1 · 주의 1</span></div></div>
    </div>
    <div class="split rev">
      <div class="stack">
        ${[['1호점 · 감나무집', '김수진 외 3 · 에어비앤비', 'crit', '청소 일정 미확정', '비밀번호 발송 보류 예정 (14:00)', 30], ['2호점 · 순례자의 집', '정민호 외 1 · 네이버 예약', 'good', '청소 일정 확정', '청소 업체 · 11:00 시작 예정', 0]].map(b => `
        <div class="card"><div class="card-head"><div class="h-md">${b[0]}</div>${pill(b[3], b[2])}</div>
          <dl class="kv"><dt>오늘 체크인</dt><dd>${b[1]}</dd><dt>청소</dt><dd>${b[4]}</dd><dt>도어록</dt><dd class="num">배터리 82% · 연결 정상</dd></dl>
          <div class="row">${b[2] === 'crit' ? '<span class="btn primary sm">대체 청소 섭외</span><span class="btn sm">게스트에게 안내</span>' : '<span class="btn sm">상세</span>'}</div></div>`).join('')}
      </div>
      <div class="card"><div class="card-head"><div class="h-md">처리할 일</div><span class="btn ghost sm">운영 예외 전체</span></div>
        <div class="timeline">
          <div><span class="tm">08:41</span><span class="dot crit"></span><div><b>1호점 청소 일정 취소</b> · 청소 업체 사정<br><span class="small">대체 청소 인력 전화 섭외 필요</span></div></div>
          <div><span class="tm">08:10</span><span class="dot warn"></span><div><b>iCal 동기화 지연</b> · 에어비앤비 2시간째<br><span class="small">예약 변경 여부를 채널에서 직접 확인하세요</span></div></div>
          <div><span class="tm">07:55</span><span class="dot good"></span><div>알림톡 발송 실패 1건 → 재시도 성공</div></div>
          <div><span class="tm">어제</span><span class="dot acc"></span><div>2호점 리뷰 ★5 · 답글 대기</div></div>
        </div></div>
    </div>`, '대시보드'),
});

add({
  id: 'ops-booking', role: '관리자', group: '무인 운영 (M4) · 예정', title: '예약 관리 · 캘린더', ph: 'P2', sc: 'S7', fn: 'OPS-01', dev: '웹',
  desc: '채널별 예약을 한 캘린더에 모으고, 관리자가 직접 등록·수정하며 변경 이력을 남긴다. 중복은 즉시 경보.',
  html: () => {
    const days = [];
    const ev = { 3: ['b1|김○○ 2박'], 4: ['b1|김○○'], 6: ['b1|김수진 4인', 'b2|정민호 2인'], 9: ['b2|이○○ 3박'], 10: ['b2|이○○', 'b1|박○○'], 11: ['b2|이○○', 'x|중복: 최○○'], 14: ['b1|가족 4인'], 17: ['blk|정비'], 18: ['blk|정비'], 21: ['b1|소유주 사용'], 24: ['b2|순례 6인'], 25: ['b2|순례 6인'], 31: ['b1|송년 2박'] };
    for (let i = 0; i < 35; i++) {
      const d = i - 3;
      if (d < 1 || d > 31) { days.push('<div class="out"></div>'); continue; }
      days.push(`<div><span class="d">${d}</span>${(ev[d] || []).map(e => { const [c, t] = e.split('|'); return `<span class="bk ${c}">${t}</span>`; }).join('')}</div>`);
    }
    return adminWeb('/ops/bookings', `
    <div class="row between"><div class="row"><h2 class="h h-lg">2026년 10월</h2><div class="chips"><span class="chip on">전체 지점</span><span class="chip">1호점</span><span class="chip">2호점</span></div></div><span class="btn primary">+ 예약 직접 등록</span></div>
    <div class="row small"><span class="bk b1">1호점</span><span class="bk b2">2호점</span><span class="bk blk">판매 불가일</span><span class="bk x">중복·불일치</span><span>· 동기화: 에어비앤비 iCal 08:10 · 네이버 예약 09:00</span></div>
    <div style="overflow-x:auto"><div class="cal" style="min-width:640px">${['일', '월', '화', '수', '목', '금', '토'].map(d => `<div class="dow">${d}</div>`).join('')}${days.join('')}</div></div>
    <div class="grid2">
      <div class="card" style="border-color:var(--crit)"><div class="card-head"><div class="h-md">중복 예약 · 10/11 2호점</div>${pill('처리 필요', 'crit')}</div>
        <div class="list"><div><span>이○○ · 네이버 예약 · 10/09~12</span><span class="small">09/20 접수</span></div><div><span>최○○ · 에어비앤비 · 10/11~12</span><span class="small">10/05 접수</span></div></div>
        <div class="row"><span class="btn sm">채널 원본 확인</span><span class="btn sm primary">최○○ 대체 숙소 안내</span></div></div>
      <div class="card"><div class="h-md">변경 이력</div><div class="timeline">
        <div><span class="tm">10/05</span><span class="dot acc"></span><div>1호점 10/14 인원 2→4 · 박PM 수기 수정</div></div>
        <div><span class="tm">10/04</span><span class="dot warn"></span><div>2호점 10/02 노쇼 처리 · 청소 업무 취소</div></div>
        <div><span class="tm">10/01</span><span class="dot"></span><div>1호점 10/17~18 정비 차단 등록</div></div></div></div>
    </div>`, '예약 관리');
  },
});

add({
  id: 'ops-incident', role: '관리자', group: '무인 운영 (M4) · 예정', title: '운영 예외·수동 복구', ph: 'P2', sc: 'S4, S7', fn: 'OPS-13, OPS-06', dev: '웹',
  desc: '자동화 실패와 현장 신고를 기록하고, 담당자·조치·완료 시각을 남긴다.',
  html: () => adminWeb('/ops/incidents', `
    <div class="row between"><h2 class="h h-lg">운영 예외</h2><div class="chips"><span class="chip on">미처리 2</span><span class="chip">처리 중 1</span><span class="chip">완료 14</span></div></div>
    <div class="split">
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>유형</th><th>지점</th><th>발생</th><th>상태</th></tr></thead>
        <tbody>
          <tr class="sel"><td><b>비밀번호 발급 실패</b></td><td>1호점</td><td class="mono">10/05 14:00</td><td>${pill('처리 중', 'warn')}</td></tr>
          <tr><td>청소 일정 취소</td><td>1호점</td><td class="mono">10/06 08:41</td><td>${pill('미처리', 'crit')}</td></tr>
          <tr><td>OTA 동기화 지연</td><td>전체</td><td class="mono">10/06 08:10</td><td>${pill('미처리', 'crit')}</td></tr>
          <tr><td>누수 신고</td><td>2호점</td><td class="mono">10/04 14:31</td><td>${pill('완료', 'good')}</td></tr>
          <tr><td>알림톡 발송 실패</td><td>2호점</td><td class="mono">10/03 14:00</td><td>${pill('완료', 'good')}</td></tr>
        </tbody></table></div>
      <div class="card"><div class="card-head"><div class="h-md">비밀번호 발급 실패 · 1호점</div>${pill('처리 중', 'warn')}</div>
        <dl class="kv"><dt>예약</dt><dd>박○○ · 10/05~06 · 에어비앤비</dd><dt>원인</dt><dd class="mono">DOORLOCK_API_TIMEOUT (3회 재시도)</dd><dt>담당</dt><dd>박PM</dd></dl>
        <div class="h-sm">처리 기록</div>
        <div class="timeline">
          <div><span class="tm">14:00</span><span class="dot crit"></span><div>자동 발급 실패 · 3회 재시도 후 운영팀 알림</div></div>
          <div><span class="tm">14:06</span><span class="dot acc"></span><div>제조사 앱에서 수동 발급 · 15:00~11:00</div></div>
          <div><span class="tm">14:09</span><span class="dot acc"></span><div>문자로 게스트에게 전달 · 수신 확인 통화</div></div>
          <div><span class="tm">내일 11:00</span><span class="dot"></span><div class="small">만료 수동 확인 예정</div></div>
        </div>
        <div class="field"><label for="inc-memo">조치 추가</label><input id="inc-memo" class="input" placeholder="무엇을 했는지 적어 주세요"></div>
        <div class="row"><span class="btn primary sm">완료 처리</span><span class="btn sm">담당자 변경</span></div></div>
    </div>`, '운영 예외'),
});

add({
  id: 'ops-pnl', role: '관리자', group: '운영 데이터', title: '지점 실적 · 예측 vs 실적', ph: 'P0', sc: 'S8', fn: 'DAT-01, DAT-02', dev: '웹',
  desc: 'OTA 예약 내역과 월 비용을 관리자가 입력하면 월 손익·가동률이 계산된다(P0). 시뮬레이션 기본안과의 월 단위 비교와 원인 태그는 P1 영역이다.',
  html: () => {
    const m = [['7월', 52, 58], ['8월', 70, 81], ['9월', 60, 63], ['10월', 60, 47]];
    const scale = v => (v / 90 * 100).toFixed(0);
    return adminWeb('/ops/pnl', `
    <div class="row between"><div class="row"><h2 class="h h-lg">1호점 · 감나무집</h2><div class="seg"><span class="on">월별</span><span>일별 입력</span></div></div><span class="btn">엑셀 가져오기</span></div>
    <div class="grid4">
      <div class="card"><div class="stat"><span class="k">10월 순매출 (취소 반영)</span><span class="v">318<small>만</small></span><span class="d">판매 14박 / 판매 가능 28일</span></div></div>
      <div class="card"><div class="stat"><span class="k">실제 가동률</span><span class="v">50<small>%</small></span><span class="d">정비 2일 제외</span></div></div>
      <div class="card"><div class="stat"><span class="k">월 운영비</span><span class="v">183<small>만</small></span><span class="d">입력 9항목</span></div></div>
      <div class="card"><div class="stat"><span class="k">운영비 차감 후</span><span class="v">135<small>만</small></span><span class="d">예측 195만 대비 −31%</span></div></div>
    </div>
    <div class="split rev">
      <div class="card"><div class="card-head"><div class="row" style="gap:8px"><div class="h-md">가동률 · 예측 vs 실적 (%)</div>${pill('P1 · DAT-02', 'och plain')}</div><div class="legend"><span><i class="s1"></i>예측 (기본안)</span><span><i class="s2"></i>실적</span></div></div>
        <div class="cols">${m.map(x => `<div class="col-g"><i class="s1" style="height:${scale(x[1])}%" title="${x[0]} 예측 ${x[1]}%"><b>${x[1]}</b></i><i class="s2" style="height:${scale(x[2])}%" title="${x[0]} 실적 ${x[2]}%"><b>${x[2]}</b></i></div>`).join('')}</div>
        <div class="col-x">${m.map(x => `<span>${x[0]}</span>`).join('')}</div>
        <div class="hint">비교 단위: 월 · 판매 가능일에서 정비·소유주 사용일 제외 · 10월은 6일까지 확정분 + 예약분</div></div>
      <div class="card"><div class="card-head"><div class="h-md">차이 원인 태그 · 10월</div>${pill('P1 · DAT-02', 'och plain')}</div>
        <div class="chips"><span class="chip on">비수기 이벤트 부족</span><span class="chip on">정비일 발생</span><span class="chip">단가 과대</span><span class="chip">리뷰 부족</span><span class="chip">+ 태그</span></div>
        <div class="field"><label for="pnl-memo">메모</label><textarea id="pnl-memo" class="textarea">평일 가동률 31%. 11월 김장 체험 패키지로 평일 수요 보강 검토.</textarea></div>
        <div class="small">입력 박PM · 10/06</div></div>
    </div>`, '지점 실적');
  },
});

add({
  id: 'ops-settle', role: '관리자', group: '무인 운영 (M4) · 예정', title: '월말 정산', ph: 'P2', sc: 'S7', fn: '–', dev: '웹',
  desc: '지점별 매출·비용·손익과 소유주 배분, 가맹 로열티를 계산한다.',
  html: () => adminWeb('/ops/settlement', `
    <div class="row between"><h2 class="h h-lg">2026년 9월 정산</h2><div class="row">${pill('검토 중', 'warn')}<span class="btn primary">확정하고 명세 발송</span></div></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>항목</th><th class="r">1호점</th><th class="r">2호점</th><th class="r">합계</th></tr></thead>
      <tbody>
        <tr><td>순매출</td><td class="r">4,020,000</td><td class="r">–</td><td class="r">4,020,000</td></tr>
        <tr><td>OTA 수수료</td><td class="r">−603,000</td><td class="r">–</td><td class="r">−603,000</td></tr>
        <tr><td>청소·소모품 (외주 청소비 포함)</td><td class="r">−600,000</td><td class="r">–</td><td class="r">−600,000</td></tr>
        <tr><td>공과금 · 보험·유지보수</td><td class="r">−412,000</td><td class="r">−95,000</td><td class="r">−507,000</td></tr>
        <tr><td>소유주 배분 (임차료)</td><td class="r">−500,000</td><td class="r">−500,000</td><td class="r">−1,000,000</td></tr>
        <tr class="total"><td>운영비 차감 후</td><td class="r">1,905,000</td><td class="r">−595,000</td><td class="r">1,310,000</td></tr>
      </tbody></table></div>
    <div class="grid3">
      <div class="card"><div class="h-sm">외주 청소비</div><div class="list"><div><span>1호점 · 12회</span><span class="num">480,000</span></div><div><span>소모품</span><span class="num">120,000</span></div></div></div>
      <div class="card"><div class="h-sm">소유주 배분</div><div class="list"><div><span>1호점 · 이○○ 님</span><span class="num">500,000</span></div><div><span>2호점 · 정○○ 님</span><span class="num">500,000</span></div></div></div>
      <div class="card"><div class="h-sm">가맹 로열티</div><div class="small">가맹 지점 없음 · Phase 2부터</div></div>
    </div>`, '정산'),
});

add({
  id: 'ops-price', role: '관리자', group: '무인 운영 (M4) · 예정', title: '가격 추천', ph: 'P2', sc: 'S7', fn: 'OPS-10', dev: '웹',
  desc: '요일·계절·축제·인근 단가·예약 속도를 반영한 추천가. 적용은 검토 후 수동으로.',
  html: () => {
    const r = [['11/13', '금', 200, 220, '홍성 한우축제 첫날'], ['11/14', '토', 300, 340, '축제 · 인근 숙소 92% 마감'], ['11/15', '일', 200, 200, '–'], ['11/16', '월', 200, 170, '비수기 평일 · 예약 속도 느림'], ['11/17', '화', 200, 170, '비수기 평일'], ['11/20', '금', 200, 210, '김장 체험 패키지']];
    return adminWeb('/ops/pricing', `
    <div class="row between"><h2 class="h h-lg">1호점 가격 추천 · 다음 90일</h2><div class="row"><span class="small">한도 15만 ~ 40만 원</span><div class="seg"><span>자동 적용</span><span class="on">검토 후 적용</span></div></div></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th></th><th>날짜</th><th>요일</th><th class="r">현재가</th><th class="r">추천가</th><th class="r">차이</th><th>사유</th></tr></thead>
      <tbody>${r.map(x => { const d = x[3] - x[2]; return `<tr><td><span class="box ${d ? 'on' : ''}">${d ? '✓' : ''}</span></td><td class="mono">${x[0]}</td><td>${x[1]}</td><td class="r">${x[2]}k</td><td class="r"><b>${x[3]}k</b></td><td class="r">${d > 0 ? '▲ ' + d : d < 0 ? '▼ ' + (-d) : '–'}</td><td class="why">${x[4]}</td></tr>`; }).join('')}</tbody></table></div>
    <div class="row"><span class="btn primary">선택한 5일 적용</span><span class="small">적용하면 에어비앤비·네이버 예약 가격이 함께 바뀝니다</span></div>`, '가격 추천');
  },
});

add({
  id: 'ops-device', role: '관리자', group: '무인 운영 (M4) · 예정', title: '기기 관제', ph: 'P2', sc: 'S7', fn: 'OPS-11', dev: '웹',
  desc: '도어록·누수·연기·온도 센서 상태와 이벤트. 이상 감지 시 운영팀과 호스트에게 동시 알림.',
  html: () => adminWeb('/ops/devices', `
    <h2 class="h h-lg">기기 관제</h2>
    <div class="grid2">
      ${[['1호점 · 감나무집', [['도어록', '배터리 82%', 'good'], ['누수 센서 (욕실)', '정상', 'good'], ['연기 감지기', '정상', 'good'], ['실내 온도', '21.5℃', 'good'], ['외부 CCTV', '녹화 중', 'good']]], ['2호점 · 순례자의 집', [['도어록', '배터리 18% · 교체 필요', 'warn'], ['누수 센서 (욕실)', '10/04 감지 → 조치 완료', 'info'], ['연기 감지기', '정상', 'good'], ['실내 온도', '19.0℃', 'good'], ['외부 CCTV', '오프라인 12분', 'crit']]]].map(b => `
      <div class="card"><div class="h-md">${b[0]}</div><div class="list">${b[1].map(d => `<div><span>${d[0]}</span>${pill(d[1], d[2])}</div>`).join('')}</div></div>`).join('')}
    </div>
    <div class="card"><div class="h-md">이벤트 기록</div><div class="timeline">
      <div><span class="tm">09:14</span><span class="dot crit"></span><div>2호점 외부 CCTV 연결 끊김 · 호스트·운영팀 알림</div></div>
      <div><span class="tm">08:30</span><span class="dot warn"></span><div>2호점 도어록 배터리 20% 미만 · 점검 업무 생성</div></div>
      <div><span class="tm">10/04</span><span class="dot crit"></span><div>2호점 누수 감지 · 운영팀 현장 대응 14분 · 배관 연결부 조임</div></div></div></div>`, '기기 관제'),
});

/* ───── 시뮬레이터·상담 관리 ───── */
add({
  id: 'adm-consult', role: '관리자', group: '시뮬레이터·상담', title: '상담 관리', ph: 'P0', sc: 'S2, S3', fn: 'CON-02, CON-08', dev: '웹',
  desc: '상담을 단계별로 관리한다. 재생 적합도는 방문 우선순위용 내부 참고값(P1)으로만 표시.',
  html: () => {
    const lanes = [['접수', [['이준호', '빈집 맡기기', 'A', '홍성 ○○리 312'], ['정○○', '현장진단', '정보 부족', '예산 □□리']]], ['연락', [['박지은', '턴키 PM', 'A', 'DX-1003-014']]], ['방문 예정', [['김○○', '빈집 맡기기', 'B', '10/12 구조 자문 동행']]], ['제안', [['윤○○', '빈집 맡기기', 'B', '제안서 10/02 발송']]], ['계약', [['정○○', '위탁', 'A', '2호점']]], ['보류', [['최○○', '빈집 맡기기', 'C', '공동상속 동의서 대기']]]];
    const tone = g => g === 'A' ? 'acc' : g === 'B' ? 'info' : g === 'C' ? 'och' : '';
    return adminWeb('/consults', `
    <div class="row between"><h2 class="h h-lg">상담 관리</h2><div class="chips"><span class="chip on">전체 8</span><span class="chip">빈집 맡기기</span><span class="chip">턴키 PM</span><span class="chip">현장진단</span></div></div>
    <div class="kanban">${lanes.map(l => `<div class="lane"><div class="lane-h"><span>${l[0]}</span><span class="num">${l[1].length}</span></div>${l[1].map(c => `<div class="kcard"><div class="row between"><b>${c[0]}</b><span class="pill ${tone(c[2])} plain" title="재생 적합도 · 내부 참고">${c[2] === '정보 부족' ? '미분류' : '적합도 ' + c[2]}</span></div><span>${c[1]}</span><span class="small">${c[3]}</span></div>`).join('')}</div>`).join('')}</div>
    <div class="notice neutral"><span class="ic">i</span><div>재생 적합도는 운영팀 내부 우선순위 참고값입니다. 고객에게 노출하지 않으며, 최종 판단은 담당자가 합니다. C 등급도 지자체 지원사업을 연결합니다.</div></div>`, '상담 관리');
  },
});

add({
  id: 'adm-review', role: '관리자', group: '시뮬레이터·상담', title: '진단 검수', ph: 'P0', sc: 'S1, S8', fn: 'ADM-03 (+SIM-09 실험 영역)', dev: '웹',
  desc: '사진과 체크리스트를 보고 견적을 보정한다(P0). 보정 사유가 남는다. 사진 AI 참고값 영역은 별도 실험(SIM-09)으로 MVP 범위 밖이다.',
  html: () => adminWeb('/diagnoses/DX-1003-014', `
    <div class="row between"><div><h2 class="h h-lg">DX-1003-014 · 홍성 ○○리 312</h2><div class="small">박지은 · 10/03 · 사진 11장 (2부위 누락) · 상담 연결됨</div></div><div class="row">${pill('검수 대기', 'warn')}<span class="btn primary">검수 완료</span></div></div>
    <div class="split">
      <div class="stack">
        <div class="grid2"><div class="ph-img warm"><span class="tag">지붕 1/2</span></div><div class="ph-img"><span class="tag">지붕 2/2</span></div><div class="ph-img"><span class="tag">욕실</span></div><div class="ph-img warm"><span class="tag">주방</span></div></div>
        <div class="card flat"><div class="card-head"><div class="h-sm">사진 AI 참고값</div>${pill('SIM-09 실험 · MVP 범위 밖', 'och plain')}</div>
          <div class="list small"><div><span>지붕 기와 탈락 흔적</span><span class="num">신뢰도 0.71</span></div><div><span>누수 얼룩 (욕실 천장)</span><span class="num">신뢰도 0.42</span></div></div>
          <div class="row"><span class="btn sm">맞음</span><span class="btn sm">오탐</span><span class="btn sm">미탐 기록</span></div></div>
      </div>
      <div class="stack">
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>공정</th><th>판정</th><th class="r">자동</th><th class="r">보정</th></tr></thead>
          <tbody>
            <tr><td>지붕</td><td>부분 보수</td><td class="r">650만</td><td class="r"><input class="input" value="650" style="width:80px;padding:4px 6px;text-align:right"></td></tr>
            <tr class="sel"><td>구조</td><td>경미 균열</td><td class="r">300만</td><td class="r"><input class="input" value="380" style="width:80px;padding:4px 6px;text-align:right"></td></tr>
            <tr><td>내부 (모듈 B)</td><td>–</td><td class="r">1,500만</td><td class="r">1,500</td></tr>
            <tr><td>욕실·주방</td><td>전면 교체</td><td class="r">450만</td><td class="r">450</td></tr>
            <tr><td>IoT</td><td>–</td><td class="r">100만</td><td class="r">100</td></tr>
          </tbody></table></div>
        <div class="field"><label for="rv-why">보정 사유 (필수)</label><textarea id="rv-why" class="textarea">균열 사진 없음. 1978년 목구조 · 체크리스트 ‘가는 금’ → 현장 확인 전 보강 범위 상향.</textarea></div>
        <div class="small">보정하면 새 계산 스냅샷이 저장되고, 원래 결과도 함께 보관됩니다.</div>
      </div>
    </div>`, '진단 검수'),
});

add({
  id: 'adm-cost', role: '관리자', group: '시뮬레이터·상담', title: '실제 공사비 기록', ph: 'P0', sc: 'S3, S8', fn: 'CON-07, CON-03', dev: '웹',
  desc: '지점별 공정·자재·비용·공기를 증빙과 함께 입력하고 관리자 검수 후 저장한다. 예측과 공정별로 비교된다.',
  html: () => adminWeb('/projects/1/costs', `
    <div class="row between"><h2 class="h h-lg">1호점 · 실제 공사비</h2><div class="row">${pill('검수 2건 대기', 'warn')}<span class="btn primary">+ 공정 비용 입력</span></div></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>공정</th><th class="r">예측</th><th class="r">실제</th><th class="r">오차</th><th class="r">공기(일)</th><th>증빙</th><th>상태</th></tr></thead>
      <tbody>
        <tr><td>철거</td><td class="r">180만</td><td class="r">210만</td><td class="r">+16.7%</td><td class="r">4</td><td class="small">세금계산서 1</td><td>${pill('검수 완료', 'good')}</td></tr>
        <tr><td>지붕</td><td class="r">650만</td><td class="r">720만</td><td class="r">+10.8%</td><td class="r">7</td><td class="small">세금계산서 2 · 사진 6</td><td>${pill('검수 완료', 'good')}</td></tr>
        <tr><td>구조 보강</td><td class="r">300만</td><td class="r">410만</td><td class="r">+36.7%</td><td class="r">6</td><td class="small">견적서 1</td><td>${pill('검수 대기', 'warn')}</td></tr>
        <tr><td>욕실·주방</td><td class="r">450만</td><td class="r">430만</td><td class="r">−4.4%</td><td class="r">8</td><td class="small">세금계산서 2</td><td>${pill('검수 완료', 'good')}</td></tr>
        <tr><td>내부 마감 (모듈 B)</td><td class="r">1,500만</td><td class="r">1,460만</td><td class="r">−2.7%</td><td class="r">15</td><td class="small">–</td><td>${pill('증빙 없음', 'crit')}</td></tr>
        <tr class="total"><td>공정 소계 (예비비 제외)</td><td class="r">3,080만</td><td class="r">3,230만</td><td class="r">+4.9%</td><td class="r">42</td><td></td><td></td></tr>
      </tbody></table></div>
    <div class="notice info"><span class="ic">i</span><div>비교는 <b>공정 소계 기준</b>입니다. 예측 견적의 예비비(10%)는 실제 공정 비용이 아니므로 오차 계산에서 뺍니다. 시공팀·PM 입력은 관리자가 공정 분류와 증빙을 확인한 뒤에만 학습 데이터로 저장됩니다.</div></div>`, '실제 공사비'),
});

add({
  id: 'adm-price-db', role: '관리자', group: '시뮬레이터·상담', title: '단가 DB', ph: 'P0', sc: 'S8', fn: 'ADM-01', dev: '웹',
  desc: '공정별 기본·보수 단가, 상태계수, 기준일수를 버전으로 관리한다. 과거 견적은 당시 버전으로 재현된다.',
  html: () => adminWeb('/settings/unit-prices', `
    <div class="row between"><div class="row"><h2 class="h h-lg">단가 DB</h2><select class="select" style="width:auto"><option>v2026.10-1 · 적용 10/01~ (현재)</option></select></div><div class="row"><span class="btn">변경 이력</span><span class="btn primary">새 버전 만들기</span></div></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>공정</th><th>기준수량</th><th class="r">기본 단가</th><th class="r">보수 단가</th><th class="r">기본 작업일</th><th class="r">보수 기준일</th></tr></thead>
      <tbody>
        <tr><td>철거</td><td>연면적</td><td class="r">25,000/㎡</td><td class="r">–</td><td class="r">3</td><td class="r">–</td></tr>
        <tr><td>지붕</td><td>연면적×1.3</td><td class="r">–</td><td class="r">173,600/㎡</td><td class="r">–</td><td class="r">12</td></tr>
        <tr><td>구조 보강</td><td>연면적</td><td class="r">–</td><td class="r">104,200/㎡</td><td class="r">–</td><td class="r">8</td></tr>
        <tr><td>욕실</td><td>개수</td><td class="r">–</td><td class="r">2,500,000/개</td><td class="r">–</td><td class="r">6</td></tr>
        <tr><td>주방</td><td>개수</td><td class="r">–</td><td class="r">2,000,000/개</td><td class="r">–</td><td class="r">5</td></tr>
        <tr><td>내부 리모델링 · 모듈 A / B / C</td><td>연면적</td><td class="r">165k / 208k / 236k</td><td class="r">–</td><td class="r">15</td><td class="r">–</td></tr>
        <tr><td>IoT 패키지</td><td>1식</td><td class="r">1,000,000</td><td class="r">–</td><td class="r">1</td><td class="r">–</td></tr>
      </tbody></table></div>
    <div class="grid3">
      <div class="card"><div class="h-sm">상태계수 (보수비에만 적용)</div><dl class="kv num"><dt>양호</dt><dd>0</dd><dt>부분 보수</dt><dd>0.4</dd><dt>전면 교체</dt><dd>1.0</dd></dl></div>
      <div class="card"><div class="h-sm">예비비 · 지역계수</div><dl class="kv num"><dt>예비비</dt><dd>10%</dd><dt>홍성</dt><dd>1.00</dd><dt>공기 고정일</dt><dd>5일</dd></dl></div>
      <div class="card"><div class="h-sm">불확실도</div><dl class="kv num"><dt>기본</dt><dd>±15%</dd><dt>사진 부족</dt><dd>+5%p / 부위</dd><dt>대장 없음</dt><dd>+10%p</dd></dl></div>
    </div>
    <div class="hint">값은 1호점 실제 공사비로 정한 초안입니다. 2호점 공사 후 1차 보정합니다.</div>`, '단가 DB'),
});

add({
  id: 'adm-assume', role: '관리자', group: '시뮬레이터·상담', title: '가정값 관리', ph: 'P0', sc: 'S1, S8', fn: 'ADM-02', dev: '웹',
  desc: '수익 시뮬레이터의 지역·계절별 기본값과 운영비 가정, 3안 편차를 버전으로 관리한다.',
  html: () => adminWeb('/settings/assumptions', `
    <div class="row between"><div class="row"><h2 class="h h-lg">가정값</h2><select class="select" style="width:auto"><option>v0.3 · 적용 10/05~ (현재)</option></select></div><span class="btn primary">새 버전 만들기</span></div>
    <div class="grid2">
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>홍성군 · 수요</th><th class="r">기본값</th><th>근거</th></tr></thead>
        <tbody>
          <tr><td>평일가 / 주말가</td><td class="r">20만 / 30만</td><td class="why">1·2호점 기준</td></tr>
          <tr><td>연평균 가동률</td><td class="r">60%</td><td class="why">성수기 80 · 비수기 40</td></tr>
          <tr><td>평일·주말 비중</td><td class="r">5/7 · 2/7</td><td class="why">MVP 단순 가정</td></tr>
          <tr><td>월 판매 가능일</td><td class="r">30일</td><td class="why">판매 불가일 0</td></tr>
          <tr><td>3안 가동률 편차</td><td class="r">−15%p / +10%p</td><td class="why">보수 / 낙관</td></tr>
        </tbody></table></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>운영비</th><th class="r">기본값</th><th>구분</th></tr></thead>
        <tbody>
          <tr><td>OTA 수수료율 · 경유 비중</td><td class="r">15% · 100%</td><td>${pill('변동', 'info')}</td></tr>
          <tr><td>청소·소모품 / 회</td><td class="r">50,000</td><td>${pill('변동', 'info')}</td></tr>
          <tr><td>평균 숙박일수</td><td class="r">1.5박</td><td>${pill('변동', 'info')}</td></tr>
          <tr><td>공과금 / 월</td><td class="r">300,000</td><td>${pill('고정')}</td></tr>
          <tr><td>임차료 / 월</td><td class="r">500,000</td><td>${pill('고정')}</td></tr>
          <tr><td>보험·유지보수 / 월</td><td class="r">150,000</td><td>${pill('고정')}</td></tr>
        </tbody></table></div>
    </div>
    <div class="card flat"><div class="h-sm">검증 사례 · 이 버전으로 다시 계산</div><div class="row num small"><span>월 매출 411만</span><span>운영비 217만</span><span>차감 후 195만</span><span>회수 17개월</span><span>BEP 20%</span>${pill('기준값과 일치', 'good')}</div></div>`, '가정값'),
});

add({
  id: 'adm-accuracy', role: '관리자', group: '시뮬레이터·상담', title: '정확도 리포트', ph: 'P1', sc: 'S8', fn: 'ADM-04', dev: '웹',
  desc: '예측 대비 실제 공사비 오차(MAPE)와 표본 수. 공개 기준 표본에 못 미치면 사용자 화면에 공개하지 않는다.',
  html: () => adminWeb('/reports/accuracy', `
    <div class="row between"><h2 class="h h-lg">견적 정확도 · 초기 측정</h2>${pill('표본 n=1 · 공개 기준 미달', 'warn')}</div>
    <div class="grid3">
      <div class="card"><div class="stat"><span class="k">전체 MAPE</span><span class="v">14.3<small>%</small></span><span class="d">1호점 · 5개 공정</span></div></div>
      <div class="card"><div class="stat"><span class="k">공정 소계 오차</span><span class="v">+4.9<small>%</small></span><span class="d">예측 3,080만 → 실제 3,230만</span></div></div>
      <div class="card"><div class="stat"><span class="k">장기 목표</span><span class="v">±5<small>%</small></span><span class="d">표본·검증 방법 확정 후</span></div></div>
    </div>
    <div class="card"><div class="h-md">공정별 절대 오차율 · 1호점</div>
      <div class="hbars">
        ${[['구조', 36.7], ['철거', 16.7], ['지붕', 10.8], ['욕실·주방', 4.4], ['내부', 2.7]].map((x, i) => `<div class="hbar ${i === 0 ? 'sel' : ''}"><span>${x[0]}</span><div class="tr"><i style="width:${(x[1] / 40 * 100).toFixed(0)}%" title="${x[0]} ${x[1]}%"></i></div><span class="r">${x[1]}%</span></div>`).join('')}
      </div>
      <div class="hint">구조 공정은 사진 없이 체크리스트만으로 판정되어 오차가 큽니다. 2호점 실측 후 보수 단가를 1차 보정합니다.</div></div>`, '정확도 리포트'),
});

add({
  id: 'adm-users', role: '관리자', group: '시스템', title: '회원·권한', ph: 'P0', sc: '전체', fn: 'ADM-05', dev: '웹',
  desc: '관리자 계정과 권한, 진단 사진 접근 범위, 2단계 인증 상태.',
  html: () => adminWeb('/settings/users', `
    <div class="row between"><h2 class="h h-lg">회원·권한</h2><div class="row"><div class="chips"><span class="chip on">운영팀 3</span><span class="chip">일반회원 128</span></div><span class="btn primary">+ 계정 추가</span></div></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>이름</th><th>역할</th><th>진단 사진 접근</th><th>단가·가정값 수정</th><th>2단계 인증</th><th>최근 접속</th></tr></thead>
      <tbody>
        <tr><td>장상민</td><td>관리자 (CTO)</td><td>${pill('전체', 'acc')}</td><td>${pill('가능', 'acc')}</td><td>${pill('사용', 'good')}</td><td class="mono">10/06 08:50</td></tr>
        <tr><td>박PM</td><td>운영팀</td><td>${pill('담당 건', 'info')}</td><td>${pill('조회만')}</td><td>${pill('사용', 'good')}</td><td class="mono">10/06 09:02</td></tr>
        <tr><td>김덕선</td><td>운영팀 (상담 담당)</td><td>${pill('없음')}</td><td>${pill('조회만')}</td><td>${pill('미설정', 'crit')}</td><td class="mono">10/05 17:12</td></tr>
      </tbody></table></div>
    <div class="notice"><span class="ic">!</span><div>김덕선 님의 2단계 인증이 꺼져 있습니다. 관리자 계정은 2단계 인증이 필수입니다.</div></div>`, '회원·권한'),
});

/* ───── 지자체 ───── */
add({
  id: 'b2g-map', role: '지자체', group: '지자체 (B2G)', title: '빈집 지도', ph: 'P3', sc: 'S9', fn: '–', dev: '웹',
  desc: '관내 빈집을 진단 완료·재생 중·운영 중으로 나눠 지도에 표시한다. Phase 3.',
  html: () => {
    const pts = [[120, 140, 1], [180, 210, 0], [240, 120, 2], [310, 260, 0], [360, 180, 1], [420, 300, 0], [470, 150, 0], [520, 240, 2], [280, 330, 0], [200, 300, 0], [560, 330, 0], [610, 200, 1], [330, 110, 0], [150, 260, 0]];
    const col = ['var(--muted)', 'var(--ochre)', 'var(--accent)'];
    return b2gWeb('/map', `
    <div class="split rev">
      <div class="map"><svg viewBox="0 0 720 440" role="img" aria-label="홍성군 빈집 분포">
        <path d="M70 120 C120 50 260 40 360 70 C470 30 600 60 660 140 C700 220 670 330 590 380 C480 430 330 420 230 390 C130 370 50 300 60 210 Z" fill="var(--surface)" stroke="var(--line-2)" stroke-width="2"/>
        <path d="M200 90 C230 180 300 220 330 400 M360 70 C380 160 470 220 650 220" fill="none" stroke="var(--line)" stroke-width="2"/>
        <text x="300" y="215" fill="var(--muted)" font-size="13" font-family="IBM Plex Sans KR, sans-serif">홍성읍</text>
        <text x="500" y="120" fill="var(--muted)" font-size="13" font-family="IBM Plex Sans KR, sans-serif">홍북읍 · 내포</text>
        ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="8" fill="${col[p[2]]}" stroke="var(--surface)" stroke-width="2"><title>상태 ${['진단 완료', '재생 중', '운영 중'][p[2]]}</title></circle>`).join('')}
      </svg>
      <div class="map-legend">${['진단 완료 9', '재생 중 3', '운영 중 2'].map((t, i) => `<span><i style="background:${col[i]}"></i>${t}</span>`).join('')}</div></div>
      <div class="card"><div class="h-md">선택한 빈집</div>
        <dl class="kv"><dt>위치</dt><dd>○○면 ○○리</dd><dt>상태</dt><dd>${pill('운영 중', 'acc')}</dd><dt>재생 적합도</dt><dd>A <span class="small">(참고 지표)</span></dd><dt>운영 개시</dt><dd class="num">2026-10</dd><dt>누적 숙박객</dt><dd class="num">74명 · 112박</dd></dl>
        <div class="hint">재생 적합도는 판정이 아닌 참고 지표입니다. 개인 소유 정보는 표시하지 않습니다.</div></div>
    </div>`, '빈집 지도');
  },
});

add({
  id: 'b2g-kpi', role: '지자체', group: '지자체 (B2G)', title: '성과 지표·보고서', ph: 'P3', sc: 'S9', fn: '–', dev: '웹',
  desc: '재생 빈집 수, 생활인구, 지역 소비액을 보고 반기 보고서를 내려받는다.',
  html: () => b2gWeb('/kpi', `
    <div class="row between"><h2 class="h h-lg">2026년 하반기 성과</h2><span class="btn primary">반기 보고서 PDF</span></div>
    <div class="grid4">
      <div class="card"><div class="stat"><span class="k">재생 빈집</span><span class="v">5<small>채</small></span><span class="d">운영 2 · 공사 3</span></div></div>
      <div class="card"><div class="stat"><span class="k">생활인구 (숙박객)</span><span class="v">412<small>명</small></span><span class="d">평균 체류 1.6일</span></div></div>
      <div class="card"><div class="stat"><span class="k">지역 소비액</span><span class="v">2,860<small>만 원</small></span><span class="d">식당·체험·농산물</span></div></div>
      <div class="card"><div class="stat"><span class="k">체험 참여</span><span class="v">186<small>명</small></span><span class="d">마을 체험·투어</span></div></div>
    </div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>지표</th><th class="r">7월</th><th class="r">8월</th><th class="r">9월</th><th class="r">10월</th><th>산정 기준</th></tr></thead>
      <tbody>
        <tr><td>숙박객 수</td><td class="r">58</td><td class="r">96</td><td class="r">71</td><td class="r">64</td><td class="why">예약 인원 · 노쇼 제외</td></tr>
        <tr><td>지역 소비액 (만 원)</td><td class="r">380</td><td class="r">720</td><td class="r">540</td><td class="r">470</td><td class="why">체험·F&B 결제 + 게스트 설문</td></tr>
        <tr><td>체험 참여 (명)</td><td class="r">24</td><td class="r">61</td><td class="r">52</td><td class="r">49</td><td class="why">체험 예약 인원</td></tr>
        <tr><td>순례 스탬프 적립</td><td class="r">12</td><td class="r">31</td><td class="r">27</td><td class="r">22</td><td class="why">홍주문화관광재단 공유</td></tr>
      </tbody></table></div>`, '성과 지표'),
});
