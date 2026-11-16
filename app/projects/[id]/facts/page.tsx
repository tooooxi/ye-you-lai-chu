import { FactBoard } from "@/components/FactBoard";

export default async function FactsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FactBoard projectId={id} />;
}
