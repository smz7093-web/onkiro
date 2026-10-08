import { AssumptionVersionPage } from "@/components/admin/version-pages";

export default async function Page(
  props: PageProps<"/admin/assumptions/[version]">,
) {
  const { version } = await props.params;
  return <AssumptionVersionPage version={decodeURIComponent(version)} />;
}
