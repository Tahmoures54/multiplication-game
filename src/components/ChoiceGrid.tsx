interface Props {
  choices: number[];
  selected: number | null;
  correct: number;
  disabled: boolean;
  onPick: (choice: number) => void;
}

export function ChoiceGrid({ choices, selected, correct, disabled, onPick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const ring = isSelected
          ? choice === correct
            ? 'ring-4 ring-emerald-200 scale-[0.98]'
            : 'ring-4 ring-rose-200 scale-[0.98]'
          : '';
        return (
          <button
            key={`${choice}-${i}`}
            type="button"
            className={`choice-btn glass-answer py-4 rounded-[1.6rem] text-white font-black text-4xl active:scale-95 transition-all disabled:opacity-70 ${ring}`}
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
