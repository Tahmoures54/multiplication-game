import { CHOICE_GRADIENTS } from '../constants';

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
            ? 'ring-4 ring-emerald-300 scale-[0.98]'
            : 'ring-4 ring-rose-400 scale-[0.98]'
          : '';
        return (
          <button
            key={`${choice}-${i}`}
            type="button"
            className={`choice-btn py-5 rounded-[1.6rem] text-white font-black text-4xl shadow-lg active:scale-95 transition-all disabled:opacity-70 ${ring}`}
            style={{ background: CHOICE_GRADIENTS[i % CHOICE_GRADIENTS.length] }}
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
