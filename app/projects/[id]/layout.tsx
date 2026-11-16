import { ProjectFrame } from "@/components/ProjectFrame";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectFrame projectId={id}>{children}</ProjectFrame>;
}
