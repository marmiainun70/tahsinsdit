import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { SoalCBT } from "@/types/cbt";

interface CBTQuestionViewerProps {
  soal: SoalCBT;
  index: number;
  currentAnswer: string | null;
  onAnswerChange: (answer: string) => void;
}

export function CBTQuestionViewer({
  soal,
  index,
  currentAnswer,
  onAnswerChange,
}: CBTQuestionViewerProps) {
  const isPilihanGanda = soal.tipe_soal === "Pilihan Ganda";

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">
            {soal.soal}
          </p>
        </div>
      </div>

      <div className="pl-12 pt-4">
        {isPilihanGanda ? (
          <RadioGroup
            value={currentAnswer || ""}
            onValueChange={onAnswerChange}
            className="space-y-3"
          >
            {[
              { value: "A", label: soal.opsi_a },
              { value: "B", label: soal.opsi_b },
              { value: "C", label: soal.opsi_c },
              { value: "D", label: soal.opsi_d },
            ].map(
              (opsi) =>
                opsi.label && (
                  <div
                    key={opsi.value}
                    className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onAnswerChange(opsi.value)}
                  >
                    <RadioGroupItem value={opsi.value} id={`opsi-${opsi.value}`} className="mt-1" />
                    <Label
                      htmlFor={`opsi-${opsi.value}`}
                      className="font-normal cursor-pointer leading-snug flex-1"
                    >
                      <span className="font-semibold mr-2">{opsi.value}.</span>
                      {opsi.label}
                    </Label>
                  </div>
                )
            )}
          </RadioGroup>
        ) : (
          <div className="space-y-2">
            <Label>Jawaban Anda:</Label>
            <Textarea
              placeholder="Ketik jawaban Anda di sini..."
              className="min-h-[150px] resize-y"
              value={currentAnswer || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Jawaban akan tersimpan otomatis saat Anda mengetik atau pindah soal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
