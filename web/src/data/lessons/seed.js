/**
 * Demo lesson resources keyed by class id.
 * Icon keys map to lucide names in the shell / panel builders.
 */
export const LESSONS_SEED_REVISION = 1;

/** @typedef {{ id: string, label: string, desc: string, icon: string, link: string }} LessonResource */

/** @type {Record<string, LessonResource[]>} */
export const SEED_LESSONS_BY_CLASS = {
  'demo-3rd-grade': [
    {
      id: 'lesson-desmos',
      label: 'Graphing Calculator',
      desc: 'Desmos Tool',
      icon: 'ExternalLink',
      link: 'https://www.desmos.com/calculator',
    },
    {
      id: 'lesson-phet',
      label: 'Build an Atom',
      desc: 'PhET Interactive Sim',
      icon: 'MonitorPlay',
      link: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html',
    },
    {
      id: 'lesson-wiki',
      label: 'Cell Structure',
      desc: 'Wikipedia Reference',
      icon: 'ExternalLink',
      link: 'https://en.wikipedia.org/wiki/Cell_(biology)',
    },
  ],
};
