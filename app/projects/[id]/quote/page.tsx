import { QuoteEditor } from "@/components/QuoteEditor";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteEditor projectId={id} />;
}
