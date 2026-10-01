interface Props {
  choices: number[];
  selected: number | null;
  correct: number;
  disabled: boolean;
  onPick: (choice: number) => void;
}

export function ChoiceGrid({ choices, selected, correct, disabled, onPick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md mx-auto">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const ring = isSelected
          ? choice === correct
            ? 'ring-3 ring-emerald-200 bg-emerald-400/25 scale-[0.97]'
            : 'ring-3 ring-rose-200 bg-rose-400/25 scale-[0.97]'
          : '';
        return (
          <button
            key={`${choice}-${i}`}
            type="button"
            className={`choice-btn glass-answer min-h-14 sm:min-h-16 py-2 px-3 rounded-2xl text-white font-black text-3xl sm:text-4xl active:scale-95 transition-all disabled:opacity-60 ${ring}`}
            onClick={() => onPick(choice)}
            disabled={disabled}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
