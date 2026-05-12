import WordClient from "./WordClient";
export const runtime = 'edge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WordPage({ params }: Props) {
  const { id } = await params;
  return <WordClient id={id} />;
}
