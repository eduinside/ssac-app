import GradeListClient from "./GradeListClient";

export const runtime = "edge";

interface Props {
  params: Promise<{ grade: string }>;
}

export default async function GradeListPage({ params }: Props) {
  const { grade } = await params;
  const gradeNum = parseInt(grade);
  if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
    return <div>잘못된 학년입니다.</div>;
  }
  return <GradeListClient grade={gradeNum} />;
}
