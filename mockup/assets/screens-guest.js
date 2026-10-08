/* 게스트(M3) 화면 */

add({
  id: 'stay-list', role: '게스트', group: '스테이·예약 (M3)', title: '숙소 목록·필터', ph: 'P2', sc: 'S4', fn: '–', dev: '웹',
  desc: '“아이와 함께” 같은 필터로 숙소를 찾는다. MVP에서는 1·2호점 상세 페이지로 바로 연결.',
  html: () => userWeb('/stays', `
    <div class="row between"><h2 class="h h-lg">홍성의 온기로 스테이</h2><div class="row"><input class="input" value="11월 14일(토) – 15일 · 성인 2, 아동 2" style="width:300px"></div></div>
    <div class="chips"><span class="chip on">아이와 함께</span><span class="chip">독채</span><span class="chip">마당</span><span class="chip">순례길 도보권</span><span class="chip">반려동물</span><span class="chip">조식 키트</span></div>
    <div class="grid3">
      ${[['감나무집', '1호점 · ○○리', '30만', '4.8', '', '유아 의자 · 마당 · 외부 CCTV'], ['순례자의 집', '2호점 · △△리', '26만', '4.9', 'warm', '순례길 3구간 8분 · 짐 보관'], ['돌담 별채', '3호점 · 오픈 예정', '–', '–', '', '2027년 봄']].map(s => `
      <div class="card"><div class="ph-img ${s[4]}" style="min-height:150px"><span class="tag">${s[1]}</span></div>
        <div class="row between"><b>${s[0]}</b><span class="num small">★ ${s[3]}</span></div>
        <div class="small">${s[5]}</div>
        <div class="row between"><span class="num"><b>${s[2]}</b><span class="small"> / 1박 (토)</span></span>${s[2] === '–' ? pill('준비 중') : pill('안전 표시 4/4', 'good')}</div></div>`).join('')}
    </div>`, '스테이'),
});

add({
  id: 'stay-detail', role: '게스트', group: '스테이·예약 (M3)', title: '숙소 상세', ph: 'P0', sc: 'S4', fn: 'STY-01, STY-02', dev: '웹',
  desc: '실사진, 청결 체크 기록, 편의시설, 위치를 보여준다. MVP의 예약은 에어비앤비·네이버 예약 링크로 연결.',
  html: () => userWeb('/stays/gamnamu', `
    <div class="grid4" style="grid-template-columns:2fr 1fr 1fr">
      <div class="ph-img tall warm" style="grid-row:span 2"><span class="tag">마당과 감나무</span></div>
      <div class="ph-img"><span class="tag">대청</span></div><div class="ph-img"><span class="tag">침실</span></div>
      <div class="ph-img"><span class="tag">욕실</span></div><div class="ph-img warm"><span class="tag">주방</span></div>
    </div>
    <div class="split rev">
      <div class="stack lg">
        <div class="stack"><div class="eyebrow">온기로 홍성 1호점</div><h2 class="h h-lg">감나무집 · 1978년 목구조 한옥 독채</h2><div class="small">최대 4인 · 침실 2 · 욕실 1 · 마당 · 주차 2대</div></div>
        <div class="card flat"><div class="card-head"><div class="h-sm">청결 관리</div>${pill('체크아웃마다 전문 청소', 'good')}</div>
          <div class="small">침구 매회 교체 · 욕실·주방 소독 · 월 1회 해충 방제 (최근 9/30)</div></div>
        <div class="stack"><div class="h-md">아이와 함께 안심</div><div class="chips"><span class="pill good">소화기</span><span class="pill good">연기 감지기</span><span class="pill good">외부 CCTV (실내 없음)</span><span class="pill good">유아 의자·식기</span></div></div>
        <div class="stack"><div class="h-md">함께 담기 좋은 체험</div><div class="grid3">
          <div class="card flat"><b>짚풀 공예</b><span class="small">마을 장인 · 90분 · 1인 2만 원</span></div>
          <div class="card flat"><b>마을 산책 투어</b><span class="small">마을 해설사 · 60분 · 무료</span></div>
          <div class="card flat"><b>순례자의 식탁 조식</b><span class="small">2인 키트 · 2.4만 원</span></div></div></div>
        <div class="card flat"><div class="h-sm">위치</div><div class="small">홍성군 ○○면 ○○리 · 홍주읍성 차량 12분 · 남당항 차량 25분 · 순례길 3구간 도보 8분</div></div>
      </div>
      <div class="card" style="position:sticky;top:0">
        <div class="row between"><span class="num"><b style="font-size:20px">20만~30만 원</b> / 1박</span><span class="num">★ 4.8 (23)</span></div>
        <div class="small">평일 20만 · 주말 30만 · 체크인 15:00 · 체크아웃 11:00</div>
        <span class="btn primary lg block">에어비앤비에서 예약</span>
        <span class="btn lg block">네이버 예약에서 예약</span>
        <div class="hint">현재는 외부 예약으로 연결됩니다. 체험은 예약 후 문의로 신청해 주세요.</div>
      </div>
    </div>`, '스테이'),
});

add({
  id: 'experience', role: '게스트', group: '스테이·예약 (M3)', title: '체험·패키지', ph: 'P1', sc: 'S4, S5', fn: 'STY-03', dev: '웹',
  desc: '순례자의 식탁, 마을 투어, 장인 체험과 순례자 패키지를 소개하고 문의를 받는다.',
  html: () => userWeb('/experiences', `
    <h2 class="h h-lg">마을에서 하는 일</h2>
    <div class="card hl"><div class="split rev" style="align-items:center">
      <div class="stack"><div class="eyebrow">순례자 패키지</div><div class="h-lg" style="font:600 20px var(--f-display)">걷다가 쉬어가는 집</div>
        <p class="sub">숙박 + 순례자의 식탁(저녁·조식) + 다음 구간까지 짐 이동 + 구간 해설 안내</p>
        <div class="row"><span class="num"><b>1인 13만 원~</b></span>${pill('내포 순례길 2·3구간', 'acc plain')}</div>
        <div class="row"><span class="btn primary">문의하기</span><span class="btn ghost">구간 지도 보기</span></div></div>
      <div class="ph-img warm" style="min-height:180px"><span class="tag">순례자의 식탁</span></div></div></div>
    <div class="grid3">
      ${[['짚풀 공예', '마을 장인 김○○ 님 · 90분', '1인 2만 원', '토·일 10시'], ['마을 산책 투어', '마을 해설사 · 60분', '숙박객 무료', '매일 8시'], ['농장 수확 체험', '○○리 사과농장 · 10~11월', '가족 3만 원', '사전 예약']].map(e => `
      <div class="card"><div class="ph-img" style="min-height:120px"></div><b>${e[0]}</b><div class="small">${e[1]}</div><div class="row between"><span class="num">${e[2]}</span><span class="small">${e[3]}</span></div><span class="btn sm">문의하기</span></div>`).join('')}
    </div>`, '체험·패키지'),
});

add({
  id: 'booking', role: '게스트', group: '스테이·예약 (M3)', title: '예약·결제', ph: 'P2', sc: 'S4', fn: 'STY-04', dev: '웹',
  desc: '날짜·인원을 고르고 숙박과 체험을 한 번에 결제한다. Phase 2 자체 예약.',
  html: () => userWeb('/stays/gamnamu/book', `
    <div class="split rev">
      <div class="stack lg">
        <h2 class="h h-lg">예약 정보</h2>
        <div class="grid2"><div class="field"><span class="lab">체크인</span><div class="input">11월 14일 (토) 15:00</div></div><div class="field"><span class="lab">체크아웃</span><div class="input">11월 15일 (일) 11:00</div></div></div>
        <div class="field"><span class="lab">인원</span><div class="input">성인 2 · 아동 2 (만 9세, 6세)</div></div>
        <div class="card"><div class="h-md">체험 추가</div>
          <div class="check"><span class="box on">✓</span><span>짚풀 공예 · 11/15 10:00 · 4인</span></div>
          <div class="check"><span class="box on">✓</span><span>순례자의 식탁 조식 키트 · 4인</span></div>
          <div class="check"><span class="box"></span><span>농장 수확 체험 · 가족</span></div></div>
        <div class="card flat"><div class="h-sm">환불 규정</div><div class="small">체크인 7일 전까지 전액 · 3일 전까지 50% · 이후 환불 불가. 체험은 전날 18시까지 취소 가능.</div></div>
      </div>
      <div class="card"><div class="h-md">결제 금액</div>
        <div class="list">
          <div><span>숙박 1박 (토)</span><span class="num">300,000원</span></div>
          <div><span>짚풀 공예 × 4</span><span class="num">80,000원</span></div>
          <div><span>조식 키트 × 4</span><span class="num">48,000원</span></div>
          <div><b>합계</b><b class="num">428,000원</b></div></div>
        <span class="btn primary lg block">결제하기</span>
        <div class="hint">결제 즉시 카카오 알림톡으로 예약 확정과 길 안내를 보내드립니다. 도어록 비밀번호는 체크인 당일 14시에 발송됩니다.</div></div>
    </div>`, '스테이'),
});

add({
  id: 'my-booking', role: '게스트', group: '스테이·예약 (M3)', title: '예약 내역·리뷰', ph: 'P2', sc: 'S4', fn: '–', dev: '모바일',
  desc: '예약 확정, 체크인 안내, 비밀번호 발송 시각, 체크아웃 후 리뷰 요청과 재방문 쿠폰.',
  html: () => phones(
    phone(`<div class="h-md">내 예약</div>
      <div class="card hl"><div class="row between"><b>감나무집</b>${pill('D-1', 'acc')}</div>
        <div class="small num">11/14(토) 15:00 – 11/15(일) 11:00 · 4인</div>
        <div class="notice info"><span class="ic">i</span><div>도어록 비밀번호는 <b>내일 14:00</b>에 알림톡으로 보내드려요.</div></div>
        <div class="row"><span class="btn sm">길 안내</span><span class="btn sm">체크인 안내</span><span class="btn sm danger">문제 신고</span></div></div>
      <div class="card"><div class="row between"><b>순례자의 집</b>${pill('이용 완료')}</div><div class="small num">10/03 – 10/04 · 2인</div>
        <span class="btn primary sm">리뷰 쓰기</span><div class="small">리뷰를 쓰면 재방문 10% 쿠폰을 드려요.</div></div>`, '게스트 · 예약 내역'),
    phone(`<div class="h-md">리뷰 쓰기 · 순례자의 집</div>
      <div style="font-size:30px;letter-spacing:4px;color:var(--ochre)">★★★★★</div>
      <div class="chips"><span class="chip on">깨끗해요</span><span class="chip on">조용해요</span><span class="chip">아이와 좋아요</span><span class="chip on">식사가 좋아요</span></div>
      <textarea class="textarea" style="min-height:120px">3구간 걷고 도착해서 따뜻한 저녁을 먹었어요. 짐 이동 덕분에 가볍게 걸었습니다.</textarea>
      <div class="slot-empty">+ 사진 추가</div>
      <span class="btn primary block">등록하기</span>`, '게스트 · 리뷰')),
});

add({
  id: 'stamp', role: '게스트', group: '스테이·예약 (M3)', title: '순례 스탬프', ph: 'P2', sc: 'S5', fn: '–', dev: '모바일',
  desc: '내포 순례길 구간별 디지털 스탬프와 누적 보상, 오늘의 구간 일정 카드.',
  html: () => phones(
    phone(`<div class="eyebrow">내포 순례길 디지털 인증</div><div class="h-lg" style="font:600 20px var(--f-display)">정민호 님의 순례</div>
      <div class="grid4" style="grid-template-columns:repeat(4,1fr);gap:10px">
        ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<div style="aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font:600 13px var(--f-mono);${n <= 3 ? 'background:var(--accent);color:var(--accent-ink)' : 'border:1.5px dashed var(--line-2);color:var(--muted)'}">${n}구간</div>`).join('')}
      </div>
      <div class="card flat"><div class="row between"><b>3 / 8 구간</b><span class="small">다음 보상 4구간</span></div><div class="bar"><i style="width:37%"></i></div><div class="small">4구간 완주 시 순례자의 식탁 10% · 8구간 완주 시 기념 손수건</div></div>
      <div class="card"><div class="h-sm">오늘의 구간 카드 · 3구간</div>
        <dl class="kv small"><dt>거리</dt><dd class="num">14.2km · 약 4시간 30분</dd><dt>숙소 도착</dt><dd class="num">16:30 예상</dd><dt>짐 픽업</dt><dd>순례자의 집 현관 · 09:00</dd></dl></div>`, '순례객 · 스탬프')),
});

add({
  id: 'concierge', role: '게스트', group: '스테이·예약 (M3)', title: 'AI 컨시어지', ph: 'P1', sc: 'S6', fn: 'STY-05', dev: '모바일',
  desc: '숙소 매뉴얼과 지역 정보로 답하고, 모르는 것은 지어내지 않으며, 긴급 상황은 즉시 사람에게 넘긴다.',
  html: () => phones(
    phone(`<div class="row between"><b>감나무집 컨시어지</b>${pill('24시간', 'acc plain')}</div>
      <div class="chat">
        <div class="msg me">보일러 어떻게 켜요?</div>
        <div class="msg bot">주방 옆 다용도실 벽의 온도조절기에서 <b>전원 → 난방 → 24℃</b>로 맞춰 주세요. 바닥이 따뜻해지기까지 30분쯤 걸려요.<div class="chat-src">출처: 감나무집 매뉴얼 · 사진 2</div></div>
        <div class="msg me">근처에 아이 먹을 만한 식당 있어요?</div>
        <div class="msg bot">차로 10분 거리 ‘○○ 칼국수’(11~20시, 월 휴무)가 아이 메뉴가 있어요. 오늘 영업 중입니다.<div class="chat-src">출처: 온기로 큐레이션 · 10/01 확인</div></div>
        <div class="msg me">내일 짚풀 공예 추가할 수 있어요?</div>
        <div class="msg bot">내일 10시에 2자리 남았어요. <u>결제 링크 열기</u></div>
      </div>
      <div class="input" style="color:var(--muted)">메시지를 입력하세요</div>`, '일반 문의'),
    phone(`<div class="row between"><b>감나무집 컨시어지</b>${pill('운영팀 연결됨', 'crit')}</div>
      <div class="chat">
        <div class="msg me">욕실 천장에서 물이 떨어져요</div>
        <div class="msg sys">누수 신고를 운영팀에 바로 전달했어요.<br>담당자가 15분 안에 전화드립니다.</div>
        <div class="msg bot">기다리시는 동안 욕실 전등은 끄고, 물 받을 통을 놓아 주세요. 세면대 아래 <b>수도 밸브</b>를 오른쪽으로 돌려 잠글 수 있어요.</div>
        <div class="msg bot">불이 나거나 다친 분이 있으면 <b>119</b>로 먼저 연락하세요.</div>
        <div class="msg sys">운영팀 박PM이 대화에 참여했습니다 · 14:32</div>
      </div>`, '긴급 상황 · 사람에게 전환')),
});
