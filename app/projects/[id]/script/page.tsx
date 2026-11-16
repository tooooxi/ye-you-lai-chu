import { ScriptSheet } from "@/components/ScriptSheet";

export default async function ScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScriptSheet projectId={id} />;
}
