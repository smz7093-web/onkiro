import {
  parseLegalText,
  splitBold,
  type LegalBlock,
} from "@/lib/site-content/legal";

function Inline({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((t, i) =>
        t.bold ? <b key={i}>{t.text}</b> : <span key={i}>{t.text}</span>,
      )}
    </>
  );
}

function Block({ b }: { b: LegalBlock }) {
  switch (b.type) {
    case "h2":
      return (
        <h2 className="pt-4 text-xl font-semibold">
          <Inline text={b.text} />
        </h2>
      );
    case "h3":
      return (
        <h3 className="pt-2 text-lg font-semibold">
          <Inline text={b.text} />
        </h3>
      );
    case "p":
      return (
        <p className="text-base leading-7">
          <Inline text={b.text} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = b.type;
      return (
        <List
          className={`flex flex-col gap-1 pl-6 text-base leading-7 ${
            b.type === "ul" ? "list-disc" : "list-decimal"
          }`}
        >
          {b.items.map((t, i) => (
            <li key={i}>
              <Inline text={t} />
            </li>
          ))}
        </List>
      );
    }
    case "table":
      // 휴대폰에서는 표만 옆으로 밀어 본다
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border border-line bg-surface-2 px-2 py-2 text-left font-semibold"
                  >
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, k) => (
                    <td
                      key={k}
                      className="border border-line px-2 py-2 align-top leading-6"
                    >
                      <Inline text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

// 약관·처리방침 본문 (빈칸은 미리 채운 글을 받는다)
export function LegalText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3">
      {parseLegalText(text).map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </div>
  );
}
