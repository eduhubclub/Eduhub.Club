import { Backpack, School, Shield, Users } from 'lucide-react';
import { ROLE_PRIMARY } from '../roleTheme';
import { bestOnColor } from '../../shared/colorContrast';
import { PRIMARY_SOLID_HEX } from '../../shared/theme';
import { TYPE } from '../../shared/typography';
import { paperCard, popFillStyle } from './landingStyle';

/** A small desktop window, not the full browser. */
const DEMO_BLUE = '#2563eb';
const DEMO_ON = bestOnColor(DEMO_BLUE);

const VIEWS = [
  { id: 'admin', label: 'Admin', Icon: Shield },
  { id: 'teacher', label: 'Teacher', Icon: School },
  { id: 'student', label: 'Student', Icon: Backpack },
  { id: 'parent', label: 'Parent', Icon: Users },
];

/**
 * Opens the same role sign-in, with the demo account filled in.
 */
export function DemoSection({ onChooseRole }) {
  return (
    <section id="demo" className="scroll-mt-20 px-4 py-16 sm:px-8">
      <div
        className="mx-auto flex h-[40rem] w-full max-w-5xl items-center rounded-3xl px-6 sm:px-10"
        style={{ backgroundColor: DEMO_BLUE, color: DEMO_ON.hex }}
      >
        <div className="w-full">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Try a demo</h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed sm:text-lg">
          Pick a role. The sign-in form is filled in so you can look around.
        </p>
        <ul className="mt-10 grid grid-cols-4 gap-4">
          {VIEWS.map(({ id, label, Icon }) => {
            const pop = PRIMARY_SOLID_HEX[ROLE_PRIMARY[id]];
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChooseRole(id)}
                  className={`edu-control flex w-full flex-col items-center gap-3 rounded-3xl border-[1.5px] px-3 py-5 text-center shadow-sm ${paperCard}`}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={popFillStyle(pop)}
                  >
                    <Icon size={22} />
                  </span>
                  <span className={TYPE.titleSm}>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </section>
  );
}
