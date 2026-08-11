import { LiveCallContent } from "@/components/calls/live-call-content";

interface LiveCallPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveCallPage({ params }: LiveCallPageProps) {
  const { id } = await params;

  return <LiveCallContent callId={id} />;
}
