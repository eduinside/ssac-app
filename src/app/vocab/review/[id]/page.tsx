import ReviewClient from "./ReviewClient";

export const runtime = "edge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  return <ReviewClient id={id} />;
}
