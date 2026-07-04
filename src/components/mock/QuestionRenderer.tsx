import { useMemo } from "react";

export interface MockQuestion {
  id: string;
  part_id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  options: any;
  correct_answer: any;
  group_label?: string | null;
  points: number;
  extra?: any;
}

interface Props {
  q: MockQuestion;
  value: any;
  onChange: (v: any) => void;
  readOnly?: boolean;
  showCorrect?: boolean;
}

const inputCls =
  "px-2 py-1 rounded-md border border-border bg-background text-sm min-w-[80px] focus:outline-none focus:ring-2 focus:ring-primary/40";

export function QuestionRenderer({ q, value, onChange, readOnly, showCorrect }: Props) {
  const opts: string[] = Array.isArray(q.options) ? q.options : [];

  switch (q.question_type) {
    case "multiple_choice": {
      const correct = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
      return (
        <div className="space-y-1.5">
          {opts.map((o, i) => {
            const isPicked = value === o;
            const isRight = showCorrect && o === correct;
            return (
              <label
                key={i}
                className={`flex items-start gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isRight
                    ? "border-emerald-400 bg-emerald-500/10"
                    : isPicked
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  className="mt-0.5"
                  disabled={readOnly}
                  checked={isPicked}
                  onChange={() => onChange(o)}
                />
                <span className="text-sm">
                  <b className="mr-1">{String.fromCharCode(65 + i)}.</b>
                  {o}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    case "multiple_choice_multi": {
      const arr: string[] = Array.isArray(value) ? value : [];
      const correct: string[] = Array.isArray(q.correct_answer) ? q.correct_answer : [];
      return (
        <div className="space-y-1.5">
          {opts.map((o, i) => {
            const isPicked = arr.includes(o);
            const isRight = showCorrect && correct.includes(o);
            return (
              <label
                key={i}
                className={`flex items-start gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  isRight ? "border-emerald-400 bg-emerald-500/10" : isPicked ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  disabled={readOnly}
                  checked={isPicked}
                  onChange={(e) => {
                    const next = e.target.checked ? [...arr, o] : arr.filter((x) => x !== o);
                    onChange(next);
                  }}
                />
                <span className="text-sm">
                  <b className="mr-1">{String.fromCharCode(65 + i)}.</b>
                  {o}
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    case "true_false_notgiven":
    case "yes_no_notgiven": {
      const choices =
        q.question_type === "true_false_notgiven"
          ? ["TRUE", "FALSE", "NOT GIVEN"]
          : ["YES", "NO", "NOT GIVEN"];
      const correct = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
      return (
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => {
            const picked = value === c;
            const right = showCorrect && c === correct;
            return (
              <button
                key={c}
                type="button"
                disabled={readOnly}
                onClick={() => onChange(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  right ? "border-emerald-400 bg-emerald-500/15 text-emerald-700" : picked ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      );
    }

    case "sentence_completion":
    case "note_completion":
    case "short_answer": {
      // Render question_text; if it contains ___ replace with input; otherwise show single input below.
      const parts = useMemo(() => q.question_text.split(/_{2,}/), [q.question_text]);
      if (parts.length > 1) {
        return (
          <p className="text-sm leading-relaxed">
            {parts.map((p, i) => (
              <span key={i}>
                {p}
                {i < parts.length - 1 && (
                  <input
                    type="text"
                    className={inputCls + " inline-block mx-1"}
                    value={value ?? ""}
                    disabled={readOnly}
                    onChange={(e) => onChange(e.target.value)}
                  />
                )}
              </span>
            ))}
            {showCorrect && (
              <span className="ml-2 text-xs text-emerald-600 font-semibold">
                ✓ {String(Array.isArray(q.correct_answer) ? q.correct_answer.join(" / ") : q.correct_answer)}
              </span>
            )}
          </p>
        );
      }
      return (
        <div>
          <p className="text-sm mb-2">{q.question_text}</p>
          <input
            type="text"
            className={inputCls}
            value={value ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
          {showCorrect && (
            <span className="ml-2 text-xs text-emerald-600 font-semibold">
              ✓ {String(Array.isArray(q.correct_answer) ? q.correct_answer.join(" / ") : q.correct_answer)}
            </span>
          )}
        </div>
      );
    }

    case "matching_headings":
    case "matching_features":
    case "matching_information": {
      // options are the choices (headings/features); question_text is the item to match
      const correct = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
      return (
        <div className="flex items-start gap-2">
          <p className="text-sm flex-1">{q.question_text}</p>
          <select
            className={inputCls}
            value={value ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">—</option>
            {opts.map((o, i) => (
              <option key={i} value={o}>
                {o}
              </option>
            ))}
          </select>
          {showCorrect && (
            <span className="text-xs text-emerald-600 font-semibold self-center">
              ✓ {String(correct)}
            </span>
          )}
        </div>
      );
    }

    case "writing_task": {
      const words = (value || "").trim().split(/\s+/).filter(Boolean).length;
      const min = q.extra?.min_words || 150;
      return (
        <div>
          <p className="text-sm mb-2 whitespace-pre-wrap">{q.question_text}</p>
          <textarea
            className="w-full min-h-[280px] px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={value ?? ""}
            disabled={readOnly}
            placeholder="Please input"
            onChange={(e) => onChange(e.target.value)}
          />
          <p className={`text-xs mt-1 ${words >= min ? "text-emerald-600" : "text-muted-foreground"}`}>
            Words: {words} / min {min}
          </p>
        </div>
      );
    }

    case "speaking_question": {
      return (
        <div>
          <p className="text-sm mb-2 whitespace-pre-wrap font-medium">{q.question_text}</p>
          <p className="text-xs text-muted-foreground">
            Speaking javoblari admin tomonidan qo'lda baholanadi (v1). Yozib olish tez orada.
          </p>
        </div>
      );
    }

    default:
      return <p className="text-sm text-muted-foreground italic">Nomaʼlum savol turi: {q.question_type}</p>;
  }
}

// Auto-grader — returns true/false for a single question
export function isCorrect(q: MockQuestion, value: any): boolean {
  const norm = (s: any) => String(s ?? "").trim().toLowerCase();
  const correct = q.correct_answer;
  switch (q.question_type) {
    case "multiple_choice":
    case "true_false_notgiven":
    case "yes_no_notgiven":
    case "matching_headings":
    case "matching_features":
    case "matching_information": {
      const c = Array.isArray(correct) ? correct[0] : correct;
      return norm(value) === norm(c);
    }
    case "multiple_choice_multi": {
      const arr: string[] = Array.isArray(value) ? value.map(norm) : [];
      const c: string[] = Array.isArray(correct) ? correct.map(norm) : [];
      if (arr.length !== c.length) return false;
      return c.every((x) => arr.includes(x));
    }
    case "sentence_completion":
    case "note_completion":
    case "short_answer": {
      const accepted: string[] = Array.isArray(correct) ? correct.map(norm) : [norm(correct)];
      return accepted.includes(norm(value));
    }
    default:
      return false;
  }
}

export const AUTO_GRADED = new Set([
  "multiple_choice",
  "multiple_choice_multi",
  "true_false_notgiven",
  "yes_no_notgiven",
  "matching_headings",
  "matching_features",
  "matching_information",
  "sentence_completion",
  "note_completion",
  "short_answer",
]);