import { describe, expect, it } from 'vitest';
import {
  dictionaryEntriesToCsv,
  parseDictionaryWords,
} from './parseDictionaryWords';

describe('parseDictionaryWords', () => {
  it('parses pasted lines and commas', () => {
    expect(parseDictionaryWords('thus\nhappy, poem')).toEqual([
      { word: 'thus', note: '', definition: null },
      { word: 'happy', note: '', definition: null },
      { word: 'poem', note: '', definition: null },
    ]);
  });

  it('parses CSV with headers', () => {
    const text = 'word,note,definition\nthus,pointing,Something here\nHappy,,';
    expect(parseDictionaryWords(text)).toEqual([
      { word: 'thus', note: 'pointing', definition: 'Something here' },
      { word: 'happy', note: '', definition: null },
    ]);
  });

  it('exports CSV rows', () => {
    const csv = dictionaryEntriesToCsv([
      {
        word: 'thus',
        partOfSpeech: 'noun',
        pronunciation: '/ðəs/',
        definition: 'Something here',
        note: 'demo',
      },
    ]);
    expect(csv).toContain('word,partOfSpeech,pronunciation,definition,note');
    expect(csv).toContain('thus,noun,/ðəs/,Something here,demo');
  });
});
