import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AsesmenJawaban } from "@/types/cbt";

interface CBTQuestionNavProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answers: AsesmenJawaban[];
  onSelectQuestion: (index: number) => void;
  soalIds: string[];
}

export function CBTQuestionNav({
  totalQuestions,
  currentQuestionIndex,
  answers,
  onSelectQuestion,
  soalIds,
}: CBTQuestionNavProps) {
  // Check if a question is answered
  const isAnswered = (index: number) => {
    const soalId = soalIds[index];
    const answer = answers.find((a) => a.soal_id === soalId);
    return answer && answer.jawaban !== null && answer.jawaban.trim() !== '';
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: totalQuestions }).map((_, index) => {
        const active = currentQuestionIndex === index;
        const answered = isAnswered(index);

        return (
          <Button
            key={index}
            variant={active ? "default" : answered ? "outline" : "secondary"}
            className={cn(
              "w-full h-10 p-0 font-medium",
              active && "ring-2 ring-primary ring-offset-2",
              !active && answered && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
              !active && !answered && "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            onClick={() => onSelectQuestion(index)}
          >
            {index + 1}
          </Button>
        );
      })}
    </div>
  );
}
