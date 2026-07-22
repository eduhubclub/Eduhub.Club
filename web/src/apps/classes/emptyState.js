/**
 * Empty-state copy (and future art) for the Classes app.
 *
 * To swap in an illustration later:
 *   import emptyArt from '../../assets/empty-classes.svg'
 *   illustration: <img src={emptyArt} alt="" className="w-full h-auto" />
 *
 * Leave illustration null to keep the dashed placeholder frame.
 */
export const classesEmptyStates = {
  list: {
    message: 'No classes yet. Tap + to create your first class.',
    illustration: null,
  },
  archive: {
    message: 'No archived classes.',
    illustration: null,
  },
};
