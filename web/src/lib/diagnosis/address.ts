import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/client";
import type { LookupSource, Outcome, PropertyLookup } from "./lookup";

// 주소 검색 (SIM-01, task.md 4.2)·빈집 정보 조회(4.3~4.5)는 서버 함수가 외부 API를 부른다.
// 함수가 없거나(배포 전) 실패하면 AddressSearchUnavailable을 던지고, 화면은 직접 입력으로 계속한다.

export interface AddressCandidate {
  addressRoad: string;
  addressJibun: string | null;
  pnu: string | null;
  lat: number | null;
  lng: number | null;
}

export class AddressSearchUnavailable extends Error {
  constructor(reason?: string) {
    super(reason ?? "주소 검색을 쓸 수 없습니다");
  }
}

export async function searchAddress(
  keyword: string,
): Promise<{ candidates: AddressCandidate[]; source: LookupSource }> {
  if (keyword.trim().length < 2) return { candidates: [], source: "juso" };
  let res: Outcome<AddressCandidate[]>;
  try {
    res = (
      await httpsCallable<{ keyword: string }, Outcome<AddressCandidate[]>>(
        functions,
        "searchAddress",
      )({ keyword: keyword.trim() })
    ).data;
  } catch (e) {
    throw new AddressSearchUnavailable(
      e instanceof Error ? e.message : String(e),
    );
  }
  if (!res.ok) throw new AddressSearchUnavailable(res.error);
  return { candidates: res.value, source: res.source };
}

// 빈집 정보 조회. 함수가 없으면 null (화면은 직접 입력으로 계속)
export async function lookupProperty(input: {
  pnu: string | null;
  lat: number | null;
  lng: number | null;
}): Promise<PropertyLookup | null> {
  if (!input.pnu && (input.lat === null || input.lng === null)) return null;
  try {
    return (
      await httpsCallable<typeof input, PropertyLookup>(
        functions,
        "lookupProperty",
      )(input)
    ).data;
  } catch {
    return null;
  }
}
