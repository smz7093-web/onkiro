import {
  CONSENT_ITEMS,
  type ConsentItem,
  type ConsentType,
} from "./definitions";

// Firestore users/{uid}/consents/{id}에 쌓이는 동의 기록 한 건 (덮어쓰지 않고 추가만 한다).
export interface ConsentRecord {
  type: ConsentType;
  version: string;
  agreed: boolean;
  agreedAt: Date;
}

export interface ConsentStatus {
  // 필수 항목을 모두 현재 버전으로 동의했는가
  complete: boolean;
  // 아직 동의하지 않았거나 예전 버전에만 동의한 필수 항목
  missingRequired: ConsentType[];
  // 예전 버전에 동의한 기록이 있는 필수 항목 (재동의 안내용)
  outdatedRequired: ConsentType[];
  // 선택 항목의 현재 동의 여부 (가장 최근 기록 기준)
  optional: Partial<Record<ConsentType, boolean>>;
}

// 항목별로 가장 최근 기록만 본다.
function latestByType(records: readonly ConsentRecord[]) {
  const latest = new Map<ConsentType, ConsentRecord>();
  for (const r of records) {
    const prev = latest.get(r.type);
    if (!prev || r.agreedAt.getTime() >= prev.agreedAt.getTime()) {
      latest.set(r.type, r);
    }
  }
  return latest;
}

export function evaluateConsents(
  records: readonly ConsentRecord[],
  items: readonly ConsentItem[] = CONSENT_ITEMS,
): ConsentStatus {
  const latest = latestByType(records);
  const missingRequired: ConsentType[] = [];
  const outdatedRequired: ConsentType[] = [];
  const optional: Partial<Record<ConsentType, boolean>> = {};

  for (const item of items) {
    const record = latest.get(item.type);
    if (item.required) {
      const ok = record?.agreed === true && record.version === item.version;
      if (!ok) {
        missingRequired.push(item.type);
        if (record?.agreed && record.version !== item.version) {
          outdatedRequired.push(item.type);
        }
      }
    } else {
      optional[item.type] = record?.agreed === true;
    }
  }

  return {
    complete: missingRequired.length === 0,
    missingRequired,
    outdatedRequired,
    optional,
  };
}
