import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AsesmenJawaban } from "@/types/cbt";

interface CBTQuestionNavProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answers: AsesmenJawaban[];
  visitedQuestions: number[];
  onSelectQuestion: (index: number) => void;
  soalIds: string[];
}

export function CBTQuestionNav({
  totalQuestions,
  currentQuestionIndex,
  answers,
  visitedQuestions,
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
        const visited = visitedQuestions.includes(index);

        return (
          <Button
            key={index}
            variant="outline"
            className={cn(
              "w-full h-10 p-0 font-medium border",
              active && "ring-2 ring-primary ring-offset-2",
              answered 
                ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 hover:text-white"
                : visited 
                  ? "bg-red-500 text-white border-red-600 hover:bg-red-600 hover:text-white"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
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
