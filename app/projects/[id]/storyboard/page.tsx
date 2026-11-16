import { StoryboardEditor } from "@/components/StoryboardEditor";

export default async function StoryboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StoryboardEditor projectId={id} />;
}
