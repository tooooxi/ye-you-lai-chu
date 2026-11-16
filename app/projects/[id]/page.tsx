import { IntakeForm } from "@/components/IntakeForm";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IntakeForm projectId={id} />;
}
