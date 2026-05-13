import WordClient from "./WordClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WordPage({ params }: Props) {
  const { id } = await params;
  return <WordClient id={id} />;
}
