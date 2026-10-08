"use client";

import { AssumptionEditor } from "./assumption-editor";
import { PriceEditor } from "./price-editor";
import { VersionShell } from "./version-shell";

export function PriceVersionPage({ version }: { version: string }) {
  return (
    <VersionShell kind="price" version={version}>
      {(props) => <PriceEditor {...props} />}
    </VersionShell>
  );
}

export function AssumptionVersionPage({ version }: { version: string }) {
  return (
    <VersionShell kind="assumption" version={version}>
      {(props) => <AssumptionEditor {...props} />}
    </VersionShell>
  );
}
