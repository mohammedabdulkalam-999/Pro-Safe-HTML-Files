import { PageContainer } from "@/components/layout/page-container";
import { TranscriptPageContent } from "@/components/calls/transcript-page-content";

interface TranscriptPageProps {
  params: Promise<{ id: string }>;
}

export default async function TranscriptPage({ params }: TranscriptPageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <TranscriptPageContent callId={id} />
    </PageContainer>
  );
}
