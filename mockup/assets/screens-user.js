/* 사용자(창업자·소유주) 화면 */

/* ───── 공통 ───── */
add({
  id: 'home', role: '사용자', group: '공통', title: '서비스 소개 홈', ph: 'P0', sc: '전체', fn: 'COM-01', dev: '웹',
  desc: '온기로 미션과 위탁 운영 모델, 1·2호점을 소개하고 빈집 진단으로 이끄는 첫 화면.',
  html: () => userWeb('/', `
    <div class="split rev" style="align-items:center">
      <div class="stack lg">
        <div class="eyebrow">AI 빈집 진단 · 재생 · 스테이 운영</div>
        <h2 class="h h-xl">빈집을 발견한 순간부터<br>첫 손님을 맞는 날까지</h2>
        <p class="sub" style="max-width:52ch">주소와 사진만 넣으면 공정별 공사비와 공사기간, 스테이로 운영했을 때의 월 수익과 회수기간을 근거와 함께 보여드립니다.</p>
        <div class="row"><span class="btn primary lg">내 빈집 진단하기</span><span class="btn lg">빈집 맡기기 상담</span></div>
        <div class="small">입력 완료 후 3초 안에 결과 · 모든 수치에 데이터 출처와 가정값 표시</div>
      </div>
      <div class="ph-img tall warm"><span class="tag">홍성 1호점 · 시공 후</span></div>
    </div>
    <div class="grid3">
      <div class="card flat"><div class="eyebrow">진단</div><div class="h-md">주소 → 공정별 견적</div><p class="sub small">건축물대장·토지·관광 데이터를 자동으로 불러와 지붕·구조·설비별 비용 범위를 계산합니다.</p></div>
      <div class="card flat"><div class="eyebrow">재생</div><div class="h-md">표준 모듈 시공 · PM</div><p class="sub small">미니멀·감성 한옥·가족형 모듈 중에서 고르고, 공사 진행을 온기로 PM이 관리합니다.</p></div>
      <div class="card flat"><div class="eyebrow">운영</div><div class="h-md">스테이 오픈 · 운영</div><p class="sub small">숙박업 신고부터 OTA 등록까지 오픈을 돕고, 직영점 실적으로 시뮬레이터를 계속 보정합니다.</p></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="h-md">위탁 운영 – 투자하고, 운영하고, 더 좋은 집으로 돌려드립니다</div>${pill('운영 조건은 협의 사항', 'och plain')}</div>
      <div class="grid3">
        <div class="stat"><span class="k">투자</span><span class="h-sm">온기로가 리모델링 비용 부담</span></div>
        <div class="stat"><span class="k">운영</span><span class="h-sm">계약 기간 직영 운영 · 수익 배분</span></div>
        <div class="stat"><span class="k">반환</span><span class="h-sm">계약 종료 시 개선된 집 반환</span></div>
      </div>
    </div>
    <div class="grid2">
      <div class="card"><div class="ph-img"><span class="tag">1호점 · 감나무집</span></div><div class="row between"><b>홍성 1호점 · 감나무집</b>${pill('운영 중', 'good')}</div><div class="small">1978년 목구조 · 72㎡ · 표준 모듈 B</div></div>
      <div class="card"><div class="ph-img warm"><span class="tag">2호점 · 순례자의 집</span></div><div class="row between"><b>홍성 2호점 · 순례자의 집</b>${pill('공사 중', 'warn')}</div><div class="small">내포 순례길 3구간 도보 8분</div></div>
    </div>`, '', { guest: true }),
});

add({
  id: 'login', role: '사용자', group: '공통', title: '로그인 · 약관 동의', ph: 'P0', sc: '전체', fn: 'COM-02, COM-04', dev: '웹',
  desc: '카카오 로그인과 함께 약관, 견적 면책, 진단 사진 이용 동의를 받는다. 사진 동의는 필수(검수용)와 선택(모델 개선용)으로 나눈다.',
  html: () => userWeb('/login', `
    <div style="max-width:420px;margin:0 auto;width:100%" class="stack lg">
      <div class="stack" style="text-align:center"><h2 class="h h-lg">온기로 시작하기</h2><p class="sub small">진단 결과를 저장하고 상담을 신청하려면 로그인하세요.</p></div>
      <span class="btn kakao lg block">카카오로 계속하기</span>
      <span class="btn naver lg block" style="opacity:.55">네이버로 계속하기 · 준비 중</span>
      <div class="card flat stack">
        <div class="check"><span class="box on">✓</span><b>모두 동의</b></div>
        <div class="check"><span class="box on">✓</span><span>(필수) 이용약관</span></div>
        <div class="check"><span class="box on">✓</span><span>(필수) 개인정보 수집·이용</span></div>
        <div class="check"><span class="box on">✓</span><span>(필수) 견적 결과는 추정치이며 정밀진단을 대체하지 않음을 확인합니다</span></div>
        <div class="check"><span class="box on">✓</span><span>(필수) 진단 사진을 견적 검수 목적으로 이용 · 보관 기간 ○개월 (정책 확정 예정)</span></div>
        <div class="check"><span class="box"></span><span>(선택) 진단 사진을 견적 모델 개선에 이용 · 식별정보 제거 후</span></div>
      </div>
      <div class="hint" style="text-align:center">업로드한 사진의 위치정보(EXIF)는 자동으로 지워집니다. 사진 삭제 요청 방법은 개인정보 처리방침에서 안내합니다 (정책 확정 예정).</div>
    </div>`, '', { guest: true }),
});

add({
  id: 'mypage', role: '사용자', group: '공통', title: '마이페이지', ph: 'P0', sc: 'S1', fn: 'COM-03', dev: '웹',
  desc: '내 진단 목록, 저장한 리포트, 상담 신청 내역을 한곳에서 본다.',
  html: () => userWeb('/me', `
    <div class="row between"><h2 class="h h-lg">박지은 님의 빈집</h2><span class="btn primary">새 빈집 진단</span></div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>진단 ID</th><th>주소</th><th>진단일</th><th class="r">견적 합계</th><th class="r">월 추정액</th><th>상태</th><th></th></tr></thead>
      <tbody>
        <tr><td class="mono">DX-1003-014</td><td>홍성군 ○○면 ○○리 312</td><td class="mono">2026-10-03</td><td class="r">3,300만</td><td class="r">195만</td><td>${pill('현장진단 신청', 'info')}</td><td><span class="btn ghost sm">리포트</span></td></tr>
        <tr><td class="mono">DX-0927-002</td><td>홍성군 △△읍 △△리 88-1</td><td class="mono">2026-09-27</td><td class="r">5,100만</td><td class="r">–</td><td>${pill('전문가 진단 필수', 'crit')}</td><td><span class="btn ghost sm">리포트</span></td></tr>
        <tr><td class="mono">DX-0921-031</td><td>예산군 □□면 □□리 45</td><td class="mono">2026-09-21</td><td class="r">2,400만</td><td class="r">121만</td><td>${pill('저장됨')}</td><td><span class="btn ghost sm">리포트</span></td></tr>
      </tbody></table></div>
    <div class="card"><div class="h-md">상담 신청 내역</div>
      <div class="list">
        <div><span><b>현장진단</b> · DX-1003-014 · 희망일 10/12(월) 오전</span>${pill('연락 완료 · 방문 예정', 'acc')}</div>
        <div><span><b>턴키 PM 상담</b> · DX-0921-031</span>${pill('보류 · 매입 검토 중')}</div>
      </div></div>`, '빈집 진단'),
});

/* ───── M1 시뮬레이터 ───── */
add({
  id: 'sim-address', role: '사용자', group: '빈집 진단 (M1)', title: '주소 입력', ph: 'P0', sc: 'S1', fn: 'SIM-01', dev: '웹',
  desc: '도로명·지번으로 주소를 찾고 좌표와 PNU(필지고유번호)를 확보한다.',
  html: () => userWeb('/diagnose/address', `
    <div style="max-width:640px" class="stack lg">
      <div class="stack"><h2 class="h h-lg">진단할 빈집의 주소를 입력하세요</h2><p class="sub">건축물대장·토지·관광 정보를 자동으로 불러옵니다. 등기가 없는 집도 진단할 수 있어요.</p></div>
      <div class="field"><input class="input lg" value="홍성군 ○○면 ○○리 312"><span class="hint">도로명 또는 지번 · 예) 홍성군 홍북읍 ○○로 12</span></div>
      <div class="card" style="padding:0;gap:0">
        <div class="list" style="padding:0 16px">
          <div><div><b>충남 홍성군 ○○면 ○○리 312</b><div class="small">도로명 ○○길 41-7 · PNU 4480034025-1-0312-0000</div></div><span class="btn primary sm">선택</span></div>
          <div><div>충남 홍성군 ○○면 ○○리 312-1<div class="small">도로명 ○○길 41-9 · PNU 4480034025-1-0312-0001</div></div><span class="btn sm">선택</span></div>
        </div>
      </div>
      <div class="notice info"><span class="ic">i</span><div>주소와 필지가 연결되지 않으면 다음 단계에서 면적·구조·연식을 직접 입력할 수 있습니다.</div></div>
    </div>`, '빈집 진단', { stepper: simSteps(0) }),
});

add({
  id: 'sim-confirm', role: '사용자', group: '빈집 진단 (M1)', title: '자동조회 확인·수정', ph: 'P0', sc: 'S1', fn: 'SIM-02~05', dev: '웹',
  desc: '공공 API에서 불러온 값을 출처·조회 시점과 함께 보여주고, 틀리거나 비어 있는 값은 직접 고친다.',
  html: () => userWeb('/diagnose/confirm', `
    <div class="row between"><h2 class="h h-lg">불러온 정보를 확인해 주세요</h2><span class="small">조회 2026-10-05 14:02</span></div>
    <div class="grid2">
      <div class="card"><div class="card-head"><div class="h-md">건축물대장 표제부</div>${pill('조회 성공', 'good')}</div>
        <div class="tbl-wrap"><table class="tbl"><tbody>
          <tr><td>연면적</td><td class="r">72.0㎡</td><td><span class="btn ghost sm">수정</span></td></tr>
          <tr><td>주구조</td><td>목구조</td><td><span class="btn ghost sm">수정</span></td></tr>
          <tr><td>지붕</td><td>기와</td><td><span class="btn ghost sm">수정</span></td></tr>
          <tr><td>사용승인</td><td class="r">1978-04-12</td><td><span class="btn ghost sm">수정</span></td></tr>
          <tr><td>대지면적</td><td><input class="input" placeholder="직접 입력 (㎡)" style="padding:5px 8px"></td><td>${pill('결측', 'warn')}</td></tr>
        </tbody></table></div>
        <div class="small">출처: 공공데이터포털 건축물대장정보 서비스</div>
      </div>
      <div class="card"><div class="card-head"><div class="h-md">토지 정보</div>${pill('조회 성공', 'good')}</div>
        <dl class="kv"><dt>지목</dt><dd>대</dd><dt>용도지역</dt><dd>계획관리지역</dd><dt>개별공시지가</dt><dd class="num">48,200원/㎡ (2026.01)</dd></dl>
        <div class="small">출처: 브이월드 OpenAPI</div>
        <div class="h-md" style="margin-top:6px">주변 관광지 · 경로 기준</div>
        <div class="list">
          <div><span>내포 순례길 3구간</span><span class="num">도보 8분 · 0.6km</span></div>
          <div><span>홍주읍성</span><span class="num">차량 12분 · 8.4km</span></div>
          <div><span>남당항</span><span class="num">차량 25분 · 21km</span></div>
        </div>
        <div class="small">출처: TourAPI + 지도 경로 · 직선거리 아님</div>
      </div>
    </div>
    <div class="notice"><span class="ic">!</span><div>대지면적을 불러오지 못했습니다. 등기부등본 면적을 입력하거나 비워 두면 견적 범위가 넓어집니다. 무허가·미등기 건물이면 <b>“대장 없음”</b>을 선택하세요. 결과에 “인허가 리스크” 표시가 붙습니다.</div></div>
    <div class="row between"><span class="btn">이전</span><span class="btn primary">확인했어요, 다음</span></div>`, '빈집 진단', { stepper: simSteps(1) }),
});

add({
  id: 'sim-photo', role: '사용자', group: '빈집 진단 (M1)', title: '사진 업로드', ph: 'P0', sc: 'S1', fn: 'SIM-06', dev: '웹',
  desc: '부위별 촬영 가이드에 맞춰 사진을 올린다. 사진은 운영팀 검수와 “현장 확인 필요” 판단에 쓰인다.',
  html: () => {
    const done = ['외관 정면', '외관 후면', '외관 좌측', '지붕', '주방', '욕실'];
    const miss = ['외관 우측', '벽체 균열 부위'];
    return userWeb('/diagnose/photos', `
    <div class="row between"><h2 class="h h-lg">부위별 사진을 올려주세요</h2><span class="num">6 / 8 부위 · 사진 11장</span></div>
    <div class="grid4">
      ${done.map((d, i) => `<div class="ph-img ${i % 2 ? 'warm' : ''}"><span class="tag">✓ ${d}</span></div>`).join('')}
      ${miss.map(d => `<div class="slot-empty"><div><b>${d}</b><br>+ 사진 추가</div></div>`).join('')}
    </div>
    <div class="grid2">
      <div class="card flat"><div class="h-sm">촬영 가이드 · 벽체 균열 부위</div><p class="sub small">균열 옆에 동전이나 자를 대고, 1m 거리에서 정면으로 찍어 주세요. 밝은 낮 시간이 좋습니다.</p></div>
      <div class="card flat"><div class="h-sm">사진은 이렇게 쓰여요</div><p class="sub small">운영팀이 견적을 검수할 때만 봅니다. 위치정보는 지우고, 정해진 보관 기간이 지나면 삭제합니다 (기간은 정책 확정 예정). 사진만으로 구조 안전을 판단하지 않습니다.</p></div>
    </div>
    <div class="notice"><span class="ic">!</span><div>사진이 없는 부위는 견적에서 <b>“현장 확인 필요”</b>로 표시되고 비용 범위가 넓어집니다.</div></div>
    <div class="row between"><span class="btn">이전</span><div class="row"><span class="btn ghost">나중에 올리기</span><span class="btn primary">다음</span></div></div>`, '빈집 진단', { stepper: simSteps(2) });
  },
});

add({
  id: 'sim-check', role: '사용자', group: '빈집 진단 (M1)', title: '상태 체크리스트', ph: 'P0', sc: 'S1', fn: 'SIM-07', dev: '웹',
  desc: '10문항에 답해 공정별 상태(양호·부분보수·전면교체)를 정한다.',
  html: () => {
    const q = [
      ['비가 새는 곳이 있나요?', ['예', '아니오', '모름'], 0],
      ['수도가 연결되어 있나요?', ['예', '아니오', '모름'], 0],
      ['전기가 들어오나요?', ['예', '아니오', '모름'], 1],
      ['정화조가 있나요?', ['예', '아니오', '모름'], 2],
      ['마지막으로 사람이 산 때는?', ['1년 이내', '1~5년', '5~10년', '10년 이상'], 3],
      ['벽이나 기둥에 금이 간 곳이 있나요?', ['없음', '가는 금', '손가락 들어갈 정도'], 1],
      ['집이 한쪽으로 기울어 보이나요?', ['아니오', '조금', '많이'], 0],
      ['욕실 상태는?', ['쓸 만함', '일부 수리', '전면 교체'], 2],
      ['주방 상태는?', ['쓸 만함', '일부 수리', '전면 교체'], 2],
      ['난방 방식은?', ['기름보일러', '연탄·아궁이', '전기', '없음'], 0],
    ];
    return userWeb('/diagnose/checklist', `
    <div class="row between"><h2 class="h h-lg">집 상태를 알려주세요</h2><span class="num">10 / 10</span></div>
    <div class="card" style="gap:0;padding:4px 18px">
      <div class="list">${q.map((x, i) => `<div><span><span class="num small">${String(i + 1).padStart(2, '0')}</span>&nbsp;&nbsp;${x[0]}</span><span class="seg">${x[1].map((o, j) => `<span class="${j === x[2] ? 'on' : ''}">${o}</span>`).join('')}</span></div>`).join('')}</div>
    </div>
    <div class="row between"><span class="btn">이전</span><span class="btn primary">견적 계산하기</span></div>`, '빈집 진단', { stepper: simSteps(3) });
  },
});

add({
  id: 'sim-estimate', role: '사용자', group: '빈집 진단 (M1)', title: '진단·견적 결과', ph: 'P0', sc: 'S1', fn: 'SIM-08, 10, 11, 15', dev: '웹',
  desc: '공정별 비용·합계 범위·공사기간과 인허가 간이 확인을 보여준다. 모든 수치에 근거가 붙고 면책 문구가 항상 표시된다.',
  html: () => userWeb('/diagnose/DX-1003-014/estimate', `
    <div class="split rev">
      <div class="stack lg">
        <div class="stack"><div class="eyebrow">예상 공사비 · 예비비 포함</div>
          <div class="row" style="align-items:baseline;gap:16px"><span class="hero-num">3,300<small>만 원</small></span><span class="sub">범위 <b class="num">2,800 ~ 3,800만 원</b> · 공사기간 <b class="num">40일</b></span></div>
          <div class="range"><div class="track"></div><div class="band" style="left:20%;width:50%"></div><div class="pt" style="left:45%"></div></div>
          <div class="row between small"><span>2,000만</span><span>불확실도 ±15% · 사진 2부위 부족 시 가산 전</span><span>4,500만</span></div>
        </div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>공정</th><th>구분</th><th>판정</th><th class="r">예상 비용</th><th>근거 ⓘ</th></tr></thead>
          <tbody>
            <tr><td>지붕</td><td>상태별 보수</td><td>${pill('부분 보수', 'warn')}</td><td class="r">650만</td><td class="why">체크리스트(비 샘)·사진 검수 · 1978년 준공</td></tr>
            <tr><td>구조(벽체·기둥)</td><td>상태별 보수</td><td>${pill('경미 균열', 'warn')}</td><td class="r">300만</td><td class="why">체크리스트 · 목구조 · <b>균열 사진 없음 → 현장 확인</b></td></tr>
            <tr><td>내부 리모델링 (모듈 B)</td><td>기본 공사</td><td>–</td><td class="r">1,500만</td><td class="why">72㎡ × 모듈 B 단가 · 단가DB v2026.10-1</td></tr>
            <tr><td>욕실·주방</td><td>상태별 보수</td><td>${pill('전면 교체', 'crit')}</td><td class="r">450만</td><td class="why">체크리스트 8·9번</td></tr>
            <tr><td>IoT 설비</td><td>기본 공사</td><td>–</td><td class="r">100만</td><td class="why">도어록·센서·외부 CCTV 표준 패키지 · 설치비만 추정 (자동 연동·관제는 Phase 2 이후)</td></tr>
            <tr><td colspan="3">공정 소계 · 지역계수 1.0</td><td class="r">3,000만</td><td></td></tr>
            <tr><td colspan="3">예비비</td><td class="r">300만</td><td class="why">공정 소계의 10%</td></tr>
            <tr class="total"><td colspan="3">합계</td><td class="r">3,300만</td><td class="why">범위 2,800~3,800만</td></tr>
          </tbody></table></div>
        ${DISCLAIMER}
      </div>
      <div class="stack lg">
        <div class="card"><div class="card-head"><div class="h-md">숙박 영업 간이 확인</div>${pill('추가 확인 필요 2', 'warn')}</div>
          <p class="sub small">입력하신 정보로 확인할 항목을 정리했습니다. 영업 가능 여부는 관할 기관에서 확정됩니다.</p>
          <div class="list">
            <div><span>농어촌민박 · 신고자 실거주 요건</span>${pill('확인 필요', 'warn')}</div>
            <div><span>원격 운영과 민박 요건의 충돌 여부</span>${pill('확인 필요', 'warn')}</div>
            <div><span>용도지역 · 계획관리지역</span>${pill('주의 신호 없음', 'good')}</div>
            <div><span>건축물대장 존재</span>${pill('확인됨', 'good')}</div>
          </div>
          <div class="hint">다음 행동: 홍성군청 민원실 또는 행정사에게 업종(농어촌민박·한옥체험업) 확인</div>
        </div>
        <div class="card"><div class="h-md">구조 위험 신호</div>
          <div class="row">${pill('큰 균열 없음', 'good')}${pill('기울어짐 없음', 'good')}${pill('지붕 붕괴 없음', 'good')}</div>
          <div class="hint">위험 신호가 있으면 수익 계산보다 전문가 진단을 먼저 안내합니다.</div>
        </div>
        <span class="btn primary lg block">수익 시뮬레이션 보기</span>
      </div>
    </div>`, '빈집 진단', { stepper: simSteps(4) }),
});

add({
  id: 'sim-revenue', role: '사용자', group: '빈집 진단 (M1)', title: '수익 시뮬레이션 · 3안 비교', ph: 'P0', sc: 'S1', fn: 'SIM-12~14', dev: '웹',
  desc: '가정값을 조정하면 기본안과 보수·낙관안이 함께 갱신된다. 포함·제외 비용과 계산 근거를 항상 보여준다.',
  html: () => userWeb('/diagnose/DX-1003-014/revenue', `
    <div class="split">
      <div class="card stack lg">
        <div class="card-head"><div class="h-md">가정값 · 기본안</div><span class="btn ghost sm">지역 기본값으로</span></div>
        ${slider('평일가', '20만 원', 27, '5~60만 원 · 1·2호점 기준')}
        ${slider('주말가', '30만 원', 33, '평일 5/7 · 주말 2/7 → ADR 22.9만 원')}
        ${slider('연평균 가동률', '60%', 59, '성수기 80% / 비수기 40% · 지역 기본값')}
        ${slider('OTA 수수료율', '15%', 60, 'OTA 경유 비중 100%')}
        ${slider('월 판매 불가일', '0일', 0, '정비·소유주 사용일')}
        <details><summary class="small" style="cursor:pointer">운영비 가정 더 보기</summary>
          <dl class="kv" style="margin-top:10px"><dt>청소·소모품</dt><dd class="num">5만 원/회 (인건비 4 + 소모품 1)</dd><dt>평균 숙박</dt><dd class="num">1.5박</dd><dt>공과금</dt><dd class="num">30만 원/월</dd><dt>임차료</dt><dd class="num">50만 원/월</dd><dt>보험·유지보수</dt><dd class="num">15만 원/월</dd></dl>
        </details>
      </div>
      <div class="stack lg">
        <div class="card hl">
          <div class="eyebrow">월 운영비 차감 후 추정액 · 기본안</div>
          <div class="hero-num">195<small>만 원</small></div>
          <div class="grid3">
            <div class="stat"><span class="k">월 매출</span><span class="v">411<small>만</small></span><span class="d">18박 × ADR</span></div>
            <div class="stat"><span class="k">월 운영비</span><span class="v">217<small>만</small></span><span class="d">변동 122 · 고정 95</span></div>
            <div class="stat"><span class="k">투자 회수</span><span class="v">17<small>개월</small></span><span class="d">3,300만 ÷ 195만</span></div>
          </div>
          <div class="row small"><span>손익분기 가동률 <b class="num">약 20%</b></span></div>
          <div class="chips"><span class="pill good plain">포함: OTA 수수료 · 청소 · 공과금 · 임차료 · 보험</span><span class="pill plain">제외: 세금 · 금융비용 · 대규모 수선비</span></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="h-md">3안 비교 · 운영비 차감 후 추정액</div><span class="small">가동률만 변경, 나머지 동일</span></div>
          <div class="hbars">
            <div class="hbar"><span>보수 45%</span><div class="tr"><i style="width:50%" title="보수안 122만 원"></i></div><span class="r">122만 · 27개월</span></div>
            <div class="hbar sel"><span><b>기본 60%</b></span><div class="tr"><i style="width:80%" title="기본안 195만 원"></i></div><span class="r"><b>195만 · 17개월</b></span></div>
            <div class="hbar"><span>낙관 70%</span><div class="tr"><i style="width:100%" title="낙관안 243만 원"></i></div><span class="r">243만 · 14개월</span></div>
          </div>
          <div class="hint">보수안 = 기본 가동률 −15%p · 낙관안 = +10%p</div>
        </div>
      </div>
    </div>
    <div class="notice neutral"><span class="ic">i</span><div>세후 순이익이 아닙니다. 기본 가정값은 1·2호점 운영 실적이 쌓이면 보정됩니다.</div></div>
    <div class="card"><div class="h-md">다음 단계</div><div class="row"><span class="btn primary">전문가 현장진단 신청</span><span class="btn">온기로 턴키 PM 상담</span><span class="btn">PDF 리포트 받기</span><span class="btn ghost">저장하고 나중에 보기</span></div></div>`, '빈집 진단', { stepper: simSteps(5) }),
});

add({
  id: 'sim-report', role: '사용자', group: '빈집 진단 (M1)', title: 'PDF 리포트', ph: 'P0', sc: 'S1', fn: 'SIM-16, SIM-20', dev: '웹',
  desc: '견적·수익 결과, 3안 가정값, 포함·제외 비용, 계산 기준일과 적용 버전, 면책 문구를 담은 A4 리포트.',
  html: () => `<div class="a4">
    <div class="a4-head"><div><div class="eyebrow">ONKIRO 빈집 진단 리포트</div><div class="h-lg" style="font:600 22px var(--f-display)">홍성군 ○○면 ○○리 312</div></div>
      <dl class="kv small"><dt>진단 ID</dt><dd class="mono">DX-1003-014</dd><dt>계산 기준일</dt><dd class="mono">2026-10-05</dd><dt>적용 버전</dt><dd class="mono">단가 v2026.10-1 · 가정값 v0.3 · 계산식 v1.0</dd></dl></div>
    <div class="grid3">
      <div class="stat"><span class="k">예상 공사비</span><span class="v">3,300<small>만</small></span><span class="d">2,800~3,800만 · 40일</span></div>
      <div class="stat"><span class="k">월 운영비 차감 후 추정액</span><span class="v">195<small>만</small></span><span class="d">기본안 · 가동률 60%</span></div>
      <div class="stat"><span class="k">투자 회수</span><span class="v">17<small>개월</small></span><span class="d">BEP 가동률 약 20%</span></div>
    </div>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>구분</th><th class="r">가동률</th><th class="r">월 매출</th><th class="r">월 운영비</th><th class="r">차감 후</th><th class="r">회수</th></tr></thead>
      <tbody><tr><td>보수적</td><td class="r">45%</td><td class="r">309만</td><td class="r">186만</td><td class="r">122만</td><td class="r">27개월</td></tr>
      <tr class="sel"><td>기본</td><td class="r">60%</td><td class="r">411만</td><td class="r">217만</td><td class="r">195만</td><td class="r">17개월</td></tr>
      <tr><td>낙관적</td><td class="r">70%</td><td class="r">480만</td><td class="r">237만</td><td class="r">243만</td><td class="r">14개월</td></tr></tbody></table></div>
    <div class="grid2 small">
      <div><b>포함 비용</b><br>OTA 수수료 15% · 청소·소모품 5만 원/회 · 공과금 30만 · 임차료 50만 · 보험·유지보수 15만 (월)</div>
      <div><b>제외 비용</b><br>세금 · 금융비용 · 대규모 수선비 · 감가상각 · 개업 비품(별도 입력 시 반영)</div>
    </div>
    ${DISCLAIMER}
    <div class="small">숙박 영업 간이 확인은 법적 판정이 아닙니다. 업종과 신고 요건은 관할 기관에서 확인하세요.</div>
    <div class="a4-foot"><span>(주)온기로 · onkiro.kr</span><span class="mono">요약 페이지</span></div>
  </div>`,
});

/* ───── M2 상담·재생 ───── */
add({
  id: 'con-apply', role: '사용자', group: '상담·재생 (M2)', title: '상담 신청', ph: 'P0', sc: 'S1, S2', fn: 'CON-01', dev: '웹',
  desc: '현장진단·턴키 PM·빈집 맡기기 상담을 하나의 폼으로 받는다. 진단 ID가 자동 연결된다.',
  html: () => userWeb('/consult/new', `
    <div style="max-width:680px" class="stack lg">
      <h2 class="h h-lg">상담 신청</h2>
      <div class="field"><span class="lab">상담 유형</span><div class="chips"><span class="chip">전문가 현장진단</span><span class="chip">턴키 PM</span><span class="chip on">빈집 맡기기</span></div></div>
      <div class="grid2">
        <div class="field"><label for="c-name">신청인</label><input id="c-name" class="input" value="이준호"></div>
        <div class="field"><label for="c-tel">연락처</label><input id="c-tel" class="input" value="010-••••-2841"></div>
      </div>
      <div class="field"><span class="lab">소유 관계</span><div class="seg"><span>본인</span><span class="on">가족</span><span>공동상속</span></div><span class="hint">공동상속이면 상속인 전원 동의서가 필요합니다. 계약 전까지 준비하시면 됩니다.</span></div>
      <div class="grid2">
        <div class="field"><label for="c-dx">연결된 진단</label><input id="c-dx" class="input mono" value="DX-1003-014"></div>
        <div class="field"><label for="c-date">희망 연락일</label><input id="c-date" class="input" value="10/12(월) 오전"></div>
      </div>
      <div class="field"><label for="c-memo">하고 싶은 말</label><textarea id="c-memo" class="textarea">어머니가 10년째 비워 두신 집입니다. 연 2~3회 가족이 쓸 수 있으면 좋겠습니다.</textarea></div>
      <div class="check"><span class="box on">✓</span><span>앱 대신 <b>전화로 상담</b>받고 싶어요 (어르신 대리 접수 가능)</span></div>
      <span class="btn primary lg">상담 신청하기</span>
    </div>`, '빈집 맡기기'),
});

add({
  id: 'con-proposal', role: '사용자', group: '상담·재생 (M2)', title: '위탁 운영 제안서', ph: 'P1', sc: 'S2', fn: 'CON-04', dev: '웹',
  desc: '위탁 운영 조건을 담은 제안서. 기준이 확정되지 않은 조건은 “협의 조건(예시)”으로 표시한다.',
  html: () => `<div class="a4">
    <div class="a4-head"><div><div class="eyebrow">위탁 운영 제안서 · 초안</div><div style="font:600 22px var(--f-display)">홍성군 ○○면 ○○리 312 · 이영자 님 댁</div></div><div class="small">제안일 2026-10-20<br>담당 온기로 박PM</div></div>
    <div class="stack"><div class="h-md">운영 방식 · 위탁 운영</div>
      <div class="grid4">
        <div class="card flat"><div class="small">1 · 투자</div><b>리모델링 3,300만 원</b><span class="small">온기로 부담</span></div>
        <div class="card flat"><div class="small">2 · 운영</div><b>직영 5년</b>${pill('협의 조건(예시)', 'och plain')}</div>
        <div class="card flat"><div class="small">3 · 회수</div><b>투자금 회수 기준</b>${pill('협의 조건(예시)', 'och plain')}</div>
        <div class="card flat"><div class="small">4 · 반환</div><b>계약 종료 시 집 반환</b>${pill('확정', 'good')}</div>
      </div></div>
    <div class="tbl-wrap"><table class="tbl"><tbody>
      <tr><td>수익 배분</td><td>월 임차료 50만 원 또는 매출 연동 ○%</td><td>${pill('협의 조건(예시)', 'och plain')}</td></tr>
      <tr><td>소유주 사용일</td><td>연 ○회 가족 사용 (판매 불가일로 반영)</td><td>${pill('협의 조건(예시)', 'och plain')}</td></tr>
      <tr><td>수선 책임</td><td>일상 수선 온기로 / 구조 대수선 협의</td><td>${pill('협의 조건(예시)', 'och plain')}</td></tr>
      <tr><td>중도 종료</td><td>잔여 투자금 정산 방식</td><td>${pill('협의 조건(예시)', 'och plain')}</td></tr>
      <tr><td>계약 종료</td><td>개선된 집 반환</td><td>${pill('확정', 'good')}</td></tr>
    </tbody></table></div>
    <div class="notice"><span class="ic">!</span><div>표시된 협의 조건은 예시이며 계약 조건이 아닙니다. 현장 실측과 상담 후 확정합니다.</div></div>
    <div class="a4-foot"><span>(주)온기로</span><span class="mono">CON-04 · 템플릿 v0.1</span></div>
  </div>`,
});

add({
  id: 'owner-dash', role: '사용자', group: '상담·재생 (M2)', title: '소유주 대시보드', ph: 'P2', sc: 'S2', fn: '–', dev: '웹',
  desc: '위탁한 집의 공사 진행률, 월 운영 리포트, 정산 내역. Phase 2 이후.',
  html: () => userWeb('/owner', `
    <div class="row between"><h2 class="h h-lg">어머니 댁 · ○○리 312</h2>${pill('운영 중 · 4개월째', 'good')}</div>
    <div class="grid4">
      <div class="card"><div class="stat"><span class="k">이번 달 배분액</span><span class="v">50<small>만 원</small></span><span class="d">11/10 입금 예정</span></div></div>
      <div class="card"><div class="stat"><span class="k">10월 가동률</span><span class="v">64<small>%</small></span><span class="d">판매 19박 / 30일</span></div></div>
      <div class="card"><div class="stat"><span class="k">후기 평점</span><span class="v">4.8</span><span class="d">후기 23건</span></div></div>
      <div class="card"><div class="stat"><span class="k">가족 사용</span><span class="v">1<small>/ 3회</small></span><span class="d">다음 예약 12/24~26</span></div></div>
    </div>
    <div class="grid2">
      <div class="card"><div class="h-md">정산 내역</div><div class="list">
        <div><span class="num">2026-10</span><span class="num">500,000원 · 입금 완료</span></div>
        <div><span class="num">2026-09</span><span class="num">500,000원 · 입금 완료</span></div>
        <div><span class="num">2026-08</span><span class="num">500,000원 · 입금 완료</span></div></div></div>
      <div class="card"><div class="h-md">집 관리 기록</div><div class="list">
        <div><span>보일러 정기 점검</span><span class="small">10/02 · 운영팀</span></div>
        <div><span>마당 잡초 정리</span><span class="small">09/21</span></div>
        <div><span>지붕 기와 2장 교체</span><span class="small">09/04 · 사진 3</span></div></div></div>
    </div>`, ''),
});

add({
  id: 'pm-project', role: '사용자', group: '상담·재생 (M2)', title: '턴키 PM 공사 관리', ph: 'P2', sc: 'S3', fn: 'CON-06', dev: '웹',
  desc: '공정별 진행률과 현장 사진을 보고, 추가 공사 요청을 승인·거절한다. MVP는 관리자의 실제 공사비 입력(CON-07)만.',
  html: () => {
    const ps = [['철거', 100, '완료'], ['지붕 보수', 100, '완료'], ['구조 보강', 80, '진행'], ['전기·설비', 45, '진행'], ['욕실·주방', 0, '대기'], ['내부 마감', 0, '대기'], ['IoT 설치', 0, '대기']];
    return userWeb('/project/PJ-03', `
    <div class="row between"><div><h2 class="h h-lg">○○리 312 · 표준 모듈 B</h2><div class="small">착공 10/26 · 준공 예정 12/04 (40일) · 담당 박PM</div></div><div class="stat" style="text-align:right"><span class="k">전체 진행률</span><span class="v">46<small>%</small></span></div></div>
    <div class="split rev">
      <div class="card"><div class="h-md">공정별 진행</div>
        <div class="stack">${ps.map(p => `<div class="row" style="gap:12px"><span style="width:84px">${p[0]}</span><div class="bar" style="flex:1"><i style="width:${p[1]}%"></i></div><span class="num small" style="width:40px;text-align:right">${p[1]}%</span>${pill(p[2], p[2] === '완료' ? 'good' : p[2] === '진행' ? 'info' : '')}</div>`).join('')}</div>
      </div>
      <div class="stack lg">
        <div class="card hl"><div class="card-head"><div class="h-md">추가 공사 승인 요청</div>${pill('응답 대기', 'warn')}</div>
          <p class="sub">서까래 3본 부식으로 교체가 필요합니다.</p>
          <dl class="kv"><dt>추가 비용</dt><dd class="num">+120만 원 (예비비에서 차감)</dd><dt>공기 영향</dt><dd class="num">+2일</dd></dl>
          <div class="grid2"><div class="ph-img warm"><span class="tag">현장 11/08</span></div><div class="ph-img"><span class="tag">근접</span></div></div>
          <div class="row"><span class="btn primary">승인</span><span class="btn">거절</span><span class="btn ghost">PM에게 질문</span></div></div>
      </div>
    </div>`, '');
  },
});

add({
  id: 'open-checklist', role: '사용자', group: '상담·재생 (M2)', title: '오픈 체크리스트', ph: 'P2', sc: 'S3', fn: '–', dev: '웹',
  desc: '공사 후 영업 신고부터 도어록 설치, 청소 인력 확보까지 오픈 준비를 챙긴다.',
  html: () => {
    const it = [['숙박업 신고 (농어촌민박 등)', '관할 기관 확인 후 신고', 'good', '완료'], ['화재·배상책임보험 가입', '증권 업로드', 'good', '완료'], ['소방시설 (소화기·감지기)', '설치 사진 2장', 'good', '완료'], ['도어록·센서 설치', '제조사 앱 등록 · 비밀번호 변경 확인', 'warn', '진행 중'], ['OTA 등록 (에어비앤비·네이버)', '사진·요금·환불 규정', 'warn', '진행 중'], ['청소·관리 인력 확보', '청소 업체 1곳 + 대체 연락처', '', '대기'], ['숙소 매뉴얼 작성', '보일러·와이파이·분리수거', '', '대기']];
    return userWeb('/project/PJ-03/open', `
    <div class="row between"><h2 class="h h-lg">오픈 준비</h2><span class="num">3 / 7 완료</span></div>
    <div class="bar"><i style="width:43%"></i></div>
    <div class="card" style="gap:0;padding:4px 18px"><div class="list">${it.map(x => `<div><div class="check"><span class="box ${x[2] === 'good' ? 'on' : ''}">${x[2] === 'good' ? '✓' : ''}</span><div><b>${x[0]}</b><div class="small">${x[1]}</div></div></div>${pill(x[3], x[2])}</div>`).join('')}</div></div>`, '');
  },
});
