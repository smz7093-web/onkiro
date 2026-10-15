"use client";

import { useState } from "react";
import {
  AddressSearchUnavailable,
  searchAddress,
  type AddressCandidate,
} from "@/lib/diagnosis/address";
import { saveAddress } from "@/lib/diagnosis/store";
import { useDiagnosis } from "./diagnosis-context";
import { btnPrimary, btnSecondary, card, info, input, notice } from "./styles";
import { Pill } from "../ui";

// 1단계 주소 입력 (SIM-01, task.md 6.2). 검색이 안 되면 직접 입력으로 계속 진행한다 (prd.md 1.2 원칙 4).
export function AddressStep() {
  const { assessment, property, reload, go } = useDiagnosis();
  const [keyword, setKeyword] = useState("");
  const [candidates, setCandidates] = useState<AddressCandidate[] | null>(null);
  const [fromDemo, setFromDemo] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [picked, setPicked] = useState<AddressCandidate | null>(null);
  const [road, setRoad] = useState(property?.addressRoad ?? "");
  const [jibun, setJibun] = useState(property?.addressJibun ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setSearchFailed(false);
    setCandidates(null);
    try {
      const r = await searchAddress(keyword);
      setCandidates(r.candidates);
      setFromDemo(r.source === "demoFixture");
    } catch (e) {
      setSearchFailed(true);
      if (!(e instanceof AddressSearchUnavailable)) console.error(e);
    }
  }

  function pick(c: AddressCandidate) {
    setPicked(c);
    setRoad(c.addressRoad);
    setJibun(c.addressJibun ?? "");
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      // 후보를 고른 뒤 주소를 손으로 바꾸면 필지 정보(PNU·좌표)는 버린다
      const usePicked = picked && picked.addressRoad === road.trim();
      await saveAddress(assessment, {
        addressRoad: road.trim(),
        addressJibun: jibun.trim() || null,
        pnu: usePicked ? picked.pnu : (property?.pnu ?? null),
        lat: usePicked ? picked.lat : (property?.lat ?? null),
        lng: usePicked ? picked.lng : (property?.lng ?? null),
      });
      await reload();
      go("confirm");
    } catch {
      setError("저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          진단할 빈집의 주소를 입력하세요
        </h1>
        <p className="text-base text-ink-2">
          건축물대장·토지 정보를 자동으로 불러옵니다. 등기가 없는 집도 진단할 수
          있어요.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <label className="sr-only" htmlFor="address-search">
          주소 검색
        </label>
        <input
          id="address-search"
          className={input}
          placeholder="도로명 또는 지번 · 예) 홍성군 홍북읍 ○○로 12"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          type="submit"
          className={btnSecondary}
          disabled={keyword.trim().length < 2}
        >
          검색
        </button>
      </form>

      {searchFailed && (
        <p className={notice} role="status">
          지금은 주소 검색을 쓸 수 없습니다. 아래에 주소를 직접 입력하면 계속
          진행할 수 있어요.
        </p>
      )}
      {candidates && candidates.length === 0 && (
        <p className="text-base text-muted">
          검색 결과가 없습니다. 아래에 직접 입력해 주세요.
        </p>
      )}
      {candidates && candidates.length > 0 && fromDemo && (
        <Pill tone="warn">시연용 저장 데이터</Pill>
      )}
      {candidates && candidates.length > 0 && (
        <ul className={card}>
          {candidates.map((c) => (
            <li
              key={`${c.addressRoad}-${c.pnu}`}
              className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-base font-semibold">{c.addressRoad}</span>
                <span className="text-sm text-muted">
                  {c.addressJibun ?? ""} {c.pnu ? `· PNU ${c.pnu}` : ""}
                </span>
              </div>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => pick(c)}
              >
                선택
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className={card}>
        <h2 className="text-lg font-semibold">주소</h2>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          도로명 주소 (필수)
          <input
            className={input}
            value={road}
            onChange={(e) => setRoad(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-2">
          지번 주소 (선택)
          <input
            className={input}
            value={jibun}
            onChange={(e) => setJibun(e.target.value)}
          />
        </label>
      </section>

      <p className={info}>
        주소와 필지가 연결되지 않으면 다음 단계에서 면적·구조·연식을 직접 입력할
        수 있습니다.
      </p>
      {error && (
        <p role="alert" className="text-base text-crit">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || road.trim().length < 5}
          onClick={save}
        >
          {busy ? "저장 중…" : "다음"}
        </button>
      </div>
    </div>
  );
}
