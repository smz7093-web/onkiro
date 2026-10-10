// 주소 검색 (SIM-01). 도로명주소 API 연동(task.md 4.2) 전까지는 검색을 쓸 수 없고 직접 입력으로 진행한다.
// 4.2에서 Cloud Functions 프록시를 부르도록 searchAddress 본문만 바꾼다.

export interface AddressCandidate {
  addressRoad: string;
  addressJibun: string | null;
  pnu: string | null;
  lat: number | null;
  lng: number | null;
}

export class AddressSearchUnavailable extends Error {
  constructor() {
    super("주소 검색을 쓸 수 없습니다");
  }
}

export async function searchAddress(
  keyword: string,
): Promise<AddressCandidate[]> {
  if (keyword.trim().length < 2) return [];
  throw new AddressSearchUnavailable();
}
