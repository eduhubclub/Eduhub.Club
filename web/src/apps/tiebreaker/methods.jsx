import { Coins, Eye, Footprints, ThumbsUp } from 'lucide-react';
import { APP_NESTED_CARD } from '../../shared/layout';
import { TYPE } from '../../shared/typography';

/** Static method cards used by Random Tiebreaker (app + widget). */
export const TIEBREAKER_METHODS = [
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    desc: 'Classic hand gesture challenge.',
    rules:
      "On the count of three, show Rock (fist), Paper (flat hand), or Scissors (two fingers). Rock smashes Scissors, Scissors cut Paper, and Paper covers Rock!",
  },
  {
    id: 'stare',
    title: 'Staring Contest',
    desc: 'First to blink or laugh loses!',
    rules:
      "Look right into your opponent's eyes! The first person to blink, look away, or giggle loses the game!",
  },
  {
    id: 'thumb',
    title: 'Thumb War',
    desc: '1, 2, 3, 4... I declare a thumb war!',
    rules:
      "Lock hands and tuck your thumbs. Say '1, 2, 3, 4, I declare a thumb war!' Try to pin your opponent's thumb down for 3 seconds!",
  },
  {
    id: 'balance',
    title: 'Balance Challenge',
    desc: 'Stand on one foot. Last one standing wins.',
    rules:
      "Stand on one foot like a flamingo! You can't hop around, hold onto anything, or put your foot down. The last person standing wins!",
  },
  {
    id: 'odds',
    title: 'Odds or Evens',
    desc: 'Shoot fingers. Winner determined by the sum.',
    rules:
      "One person picks 'Odds', the other 'Evens'. Say 'Shoot!' and hold out 1 or 2 fingers. Add them up—if it's 2 or 4, Evens win! If it's 3, Odds win!",
  },
  {
    id: 'coin',
    title: 'Coin Toss',
    desc: 'A quick 50/50 gravity check.',
    rules:
      "One person calls 'Heads' or 'Tails' while the coin is in the air. Whatever it lands on is the winner!",
  },
  {
    id: 'dice',
    title: 'Dice Duel',
    desc: 'Highest roll determines the winner.',
    rules:
      "Each person rolls a dice. Whoever gets the highest number wins! If it's a tie, roll again!",
  },
];

export function MethodPreview({ methodId, theme, isDarkMode }) {
  const soft = isDarkMode
    ? 'bg-slate-800 border-slate-600'
    : `${theme.colorPrimaryContainer} border-transparent`;
  const softText = theme.colorOnPrimaryContainer;

  if (methodId === 'rps') {
    return (
      <div className="flex flex-col items-center w-full">
        <div className="flex justify-center items-end gap-2.5 sm:gap-3.5 w-full">
          {[
            { emoji: '✊', label: 'Rock' },
            { emoji: '✋', label: 'Paper' },
            { emoji: '✌', label: 'Scissors' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1.5 w-[4rem] sm:w-[4.75rem] md:w-[5.25rem] shrink-0"
            >
              <div
                className={`w-full aspect-[5/7] ${APP_NESTED_CARD} flex flex-col items-center justify-center ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-600'
                    : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-2xl sm:text-3xl leading-none">{item.emoji}</span>
              </div>
              <span
                className={`${TYPE.labelMicro} ${theme.text}`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (methodId === 'stare') {
    return (
      <div className="flex gap-4 sm:gap-6 py-2 items-center w-full justify-center">
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 shadow-sm flex items-center justify-center animate-pulse ${soft}`}
        >
          <Eye size={40} className={softText} />
        </div>
        <div className="text-xl font-black text-slate-300 px-1">VS</div>
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 shadow-sm flex items-center justify-center animate-pulse ${
            isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
          }`}
          style={{ animationDelay: '0.5s' }}
        >
          <Eye size={40} className="text-slate-400" />
        </div>
      </div>
    );
  }

  if (methodId === 'thumb') {
    return (
      <div className="flex gap-3 sm:gap-5 py-2 items-center justify-center w-full h-full min-h-0">
        <ThumbsUp
          strokeWidth={1.75}
          className={`w-[min(10rem,42%)] h-auto aspect-square shrink-0 rotate-[18deg] ${softText}`}
          aria-hidden
        />
        <ThumbsUp
          strokeWidth={1.75}
          className="w-[min(10rem,42%)] h-auto aspect-square shrink-0 -rotate-[18deg] scale-x-[-1] text-slate-400"
          aria-hidden
        />
      </div>
    );
  }

  if (methodId === 'balance') {
    return (
      <div className="flex flex-col items-center py-2 w-full justify-center">
        <div
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center shadow-sm relative overflow-hidden ${soft}`}
        >
          <Footprints size={44} className={`${softText} -translate-y-2 animate-bounce`} />
          <div className={`absolute bottom-0 w-full h-8 opacity-20 ${theme.colorPrimary}`} />
        </div>
      </div>
    );
  }

  if (methodId === 'odds') {
    return (
      <div className="flex gap-4 sm:gap-6 py-2 items-center w-full justify-center">
        {[
          { n: '1', label: 'Odd' },
          { n: '2', label: 'Even' },
        ].map((item) => (
          <div
            key={item.label}
            className={`w-20 h-20 sm:w-24 sm:h-24 ${APP_NESTED_CARD} flex flex-col items-center justify-center ${
              isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
            }`}
          >
            <span className={`text-3xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {item.n}
            </span>
            <span className={`${TYPE.labelMicro} text-slate-400 mt-0.5`}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (methodId === 'coin') {
    return (
      <div className="flex flex-col items-center py-2 w-full justify-center">
        <div
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center animate-bounce shadow-lg ${theme.colorPrimary}`}
        >
          <Coins size={44} className={theme.colorOnPrimary} />
        </div>
      </div>
    );
  }

  // dice
  return (
    <div className="flex gap-4 sm:gap-6 py-2 items-center w-full justify-center">
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 ${APP_NESTED_CARD} rotate-12 flex items-center justify-center ${
          isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-full ${
            isDarkMode ? 'bg-slate-300' : 'bg-black'
          }`}
        />
      </div>
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 ${APP_NESTED_CARD} -rotate-12 flex items-center justify-center ${
          isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
        }`}
      >
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-[70%] place-items-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full ${isDarkMode ? 'bg-slate-300' : 'bg-black'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
