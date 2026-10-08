import { PriceVersionPage } from "@/components/admin/version-pages";

export default async function Page(
  props: PageProps<"/admin/prices/[version]">,
) {
  const { version } = await props.params;
  return <PriceVersionPage version={decodeURIComponent(version)} />;
}
