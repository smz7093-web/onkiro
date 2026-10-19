"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildTodo, type TodoItem } from "@/lib/admin/todo";
import { listBranches } from "@/lib/branches/store";
import { countReceived } from "@/lib/consult/store";
import type { PriceTable } from "@/lib/engine/types";
import { loadPermitContent, loadPhotoGuides } from "@/lib/site-content/store";
import { listVersions } from "@/lib/versions/store";
import { Card, Pill } from "../ui";
import { DTag } from "./d-tag";
import { useStaff } from "./staff-context";

// 관리자 첫 화면 '시연 전 준비 현황': 끝난 일·남은 일을 한 카드에 (UX기준 21·22). 남은 일을 위로 올린다
export function AdminTodo() {
  const { permissions } = useStaff();
  const [items, setItems] = useState<TodoItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const seesConsults =
    permissions.role === "admin" || permissions.consultAccess === "all";

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listVersions("price"),
      listVersions("assumption"),
      loadPermitContent(),
      loadPhotoGuides(),
      listBranches(),
      seesConsults ? countReceived() : Promise.resolve(null),
    ])
      .then(([prices, assumptions, permits, guides, branches, received]) => {
        if (cancelled) return;
        const active = prices.find((v) => v.status === "active");
        setItems(
          buildTodo({
            activePrice: (active?.data as PriceTable) ?? null,
            priceDrafts: prices
              .filter((v) => v.status === "draft")
              .map((v) => v.id),
            assumptionDrafts: assumptions
              .filter((v) => v.status === "draft")
              .map((v) => v.id),
            permitsSaved: permits.updatedAt !== null,
            photoGuidesSaved: guides.updatedAt !== null,
            branchCount: branches.length,
            receivedConsults: received,
          }),
        );
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [seesConsults]);

  if (failed)
    return (
      <Card variant="flat">
        <p className="text-base text-ink-2">준비 현황을 불러오지 못했습니다.</p>
      </Card>
    );
  // 불러오는 동안 자리를 잡아 아래 메뉴가 밀리지 않게 한다 (UX기준 0번)
  if (!items)
    return <div className="h-96 rounded-lg bg-surface-2" aria-busy="true" />;

  const done = items.filter((i) => i.done).length;
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done));
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">시연 전 준비 현황</h2>
        <span className="text-base text-ink-2">
          {items.length}개 중 <b className="text-ink">{done}개</b> 완료
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-label="준비 진행률"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={done}
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col">
        {sorted.map((i) => (
          <li key={i.id} className="border-b border-line last:border-0">
            <Link
              href={i.href}
              className="flex min-h-12 flex-wrap items-center gap-2 px-1 py-2 hover:bg-surface-2"
            >
              <Pill tone={i.done ? "good" : "warn"}>
                {i.done ? "완료" : "할 일"}
              </Pill>
              <span
                className={`flex-1 text-base ${i.done ? "text-ink-2" : "text-ink"}`}
              >
                {i.text}
              </span>
              <DTag ids={i.d} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
