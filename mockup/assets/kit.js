/* 목업 공통 조각: 프레임, 배지, 스텝 표시 */
window.ONK = { screens: [] };
function add(s) { ONK.screens.push(s); }

const pill = (t, c = '') => `<span class="pill ${c}">${t}</span>`;
const won = (n) => `<span class="num">${n}</span>`;

function webFrame(path, inner) {
  return `<div class="web"><div class="web-bar"><div class="dots"><i></i><i></i><i></i></div><div class="url">${path}</div></div>${inner}</div>`;
}

function userWeb(path, body, on = '', opts = {}) {
  const items = ['빈집 진단', '스테이', '체험·패키지', '빈집 맡기기'];
  const nav = items.map(i => `<span class="${i === on ? 'on' : ''}">${i}</span>`).join('');
  const right = opts.guest
    ? `<span class="btn sm">로그인</span>`
    : `<span>마이페이지</span><span class="avatar">지은</span>`;
  return webFrame('onkiro.kr' + path, `
    <div class="app-head">
      <div class="app-logo"><b>온</b>온기로</div>
      <nav class="app-nav">${nav}</nav>
      <div class="app-right">${right}</div>
    </div>
    ${opts.stepper || ''}
    <div class="app-body">${body}</div>`);
}

const ADMIN_MENU = [
  ['시뮬레이터·상담', ['상담 관리', '진단 검수', '실제 공사비', '단가 DB', '가정값', '정확도 리포트']],
  ['운영 데이터', ['지점 실적']],
  ['무인 운영 · 예정', ['대시보드', '예약 관리', '운영 예외', '정산', '가격 추천', '기기 관제']],
  ['시스템', ['회원·권한']],
];
function adminWeb(path, body, on) {
  const side = ADMIN_MENU.map(([g, items]) =>
    `<div class="lbl">${g}</div>` + items.map(i => `<span class="${i === on ? 'on' : ''}">${i}</span>`).join('')).join('');
  return webFrame('admin.onkiro.kr' + path, `
    <div class="app-head">
      <div class="app-logo"><b>온</b>온기로 운영콘솔</div>
      <div class="app-right"><span class="pill acc plain">홍성 1·2호점</span><span>운영팀 박PM</span><span class="avatar">PM</span></div>
    </div>
    <div class="admin"><nav class="admin-side">${side}</nav><div class="admin-main"><div class="app-body tight">${body}</div></div></div>`);
}

function b2gWeb(path, body, on) {
  const items = ['빈집 지도', '성과 지표', '보고서'];
  return webFrame('gov.onkiro.kr' + path, `
    <div class="app-head">
      <div class="app-logo"><b>온</b>온기로 지자체</div>
      <nav class="app-nav">${items.map(i => `<span class="${i === on ? 'on' : ''}">${i}</span>`).join('')}</nav>
      <div class="app-right"><span>홍성군 귀촌건축지원센터</span></div>
    </div>
    <div class="app-body">${body}</div>`);
}

function phone(body, cap = '', time = '9:41') {
  return `<div class="phone-wrap"><div class="phone"><div class="phone-screen">
    <div class="phone-notch"></div>
    <div class="phone-status"><span>${time}</span><span>5G ▮▮▮</span></div>
    <div class="phone-body">${body}</div>
  </div></div>${cap ? `<div class="phone-cap">${cap}</div>` : ''}</div>`;
}
const phones = (...p) => `<div class="phones">${p.join('')}</div>`;

const SIM_STEPS = ['주소 입력', '자동조회 확인', '사진', '체크리스트', '견적 결과', '수익 시뮬레이션', '리포트'];
function simSteps(cur) {
  return `<div class="stepper">${SIM_STEPS.map((s, i) =>
    `<div class="${i < cur ? 'done' : i === cur ? 'on' : ''}"><b>${i < cur ? '✓' : i + 1}</b>${s}</div>`).join('')}</div>`;
}

function slider(label, val, pct, note = '') {
  return `<div class="slider"><div class="top"><span>${label}</span><b>${val}</b></div>
    <div class="rail"><i style="width:${pct}%"></i><em style="left:${pct}%"></em></div>${note ? `<div class="hint">${note}</div>` : ''}</div>`;
}

const DISCLAIMER = `<div class="notice"><span class="ic">!</span><div>이 결과는 사진·공공데이터 기반 <b>추정치</b>입니다. 정밀 구조 안전진단과 현장 실측 후 확정됩니다.</div></div>`;
