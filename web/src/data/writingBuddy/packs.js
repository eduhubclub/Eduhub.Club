/**
 * Genre-aware prompt packs. Essay sections reuse paragraph-style micro prompts.
 * `{topic}` is replaced at build time.
 */

function p(text, opts = {}) {
  return {
    prompt: text,
    minWords: opts.minWords ?? 3,
    nudgeShort: opts.nudgeShort || 'Can you add a little more?',
    nudgeEmpty: opts.nudgeEmpty || 'Write something before we keep going.',
  };
}

/** @type {Record<string, { sentence: object[], paragraph: object[], essay: { intro: object[], body: object[], conclusion: object[] } }>} */
export const GENRE_PACKS = {
  opinion: {
    sentence: [
      p('In one sentence, what do you think about {topic}?', { minWords: 4 }),
    ],
    paragraph: [
      p('What is your opinion about {topic}?', { minWords: 4 }),
      p('What’s one reason you think that?', { minWords: 4 }),
      p('How can you wrap up your paragraph?', { minWords: 3 }),
    ],
    essay: {
      intro: [
        p('How can you introduce {topic} so a reader cares?', { minWords: 4 }),
        p('What is your main opinion (your thesis)?', { minWords: 4 }),
      ],
      body: [
        p('What’s one reason for your opinion?', { minWords: 4 }),
        p('Tell more about that reason.', { minWords: 4 }),
        p('What’s an example that helps?', { minWords: 3 }),
      ],
      conclusion: [
        p('Restate your opinion in a fresh way.', { minWords: 4 }),
        p('Leave the reader with a final thought.', { minWords: 3 }),
      ],
    },
  },
  narrative: {
    sentence: [
      p('In one sentence, tell the most important thing that happened in {topic}.', {
        minWords: 4,
      }),
    ],
    paragraph: [
      p('Who is in this story about {topic}, and where are they?', { minWords: 4 }),
      p('What happened next?', { minWords: 4 }),
      p('How did it end?', { minWords: 3 }),
    ],
    essay: {
      intro: [
        p('Set the scene for {topic}. Who? Where?', { minWords: 4 }),
        p('What is the story mostly about?', { minWords: 4 }),
      ],
      body: [
        p('What happened in this part of the story?', { minWords: 4 }),
        p('Add a detail a reader can picture.', { minWords: 4 }),
        p('How did a character feel or react?', { minWords: 3 }),
      ],
      conclusion: [
        p('How did the story end?', { minWords: 4 }),
        p('What did someone learn or feel at the end?', { minWords: 3 }),
      ],
    },
  },
  informative: {
    sentence: [
      p('In one sentence, teach one important fact about {topic}.', { minWords: 4 }),
    ],
    paragraph: [
      p('What is {topic} about?', { minWords: 4 }),
      p('Share an important fact or detail.', { minWords: 4 }),
      p('How can you close so a reader remembers?', { minWords: 3 }),
    ],
    essay: {
      intro: [
        p('Hook the reader: why does {topic} matter?', { minWords: 4 }),
        p('What will this writing teach them?', { minWords: 4 }),
      ],
      body: [
        p('What’s one important fact about {topic}?', { minWords: 4 }),
        p('Explain that fact a little more.', { minWords: 4 }),
        p('Add a detail or example that helps.', { minWords: 3 }),
      ],
      conclusion: [
        p('Sum up the most important idea.', { minWords: 4 }),
        p('Leave the reader with something to remember.', { minWords: 3 }),
      ],
    },
  },
};

export function fillTopic(text, topic) {
  const t = String(topic || 'your topic').trim() || 'your topic';
  return String(text || '').replaceAll('{topic}', t);
}
