import { cleanTitle } from '../utils/filmTitle.mjs';

describe('cleanTitle', () => {
  it('folds "&" and "and" to the same key', () => {
    // TMDB lists "Pride & Prejudice"; cinemas list "Pride and Prejudice".
    // Matching must not depend on which spelling a source happens to use.
    expect(cleanTitle('Pride & Prejudice')).toBe(
      cleanTitle('Pride and Prejudice')
    );
    expect(cleanTitle('Thelma & Louise')).toBe('thelma and louise');
  });

  it('normalizes "&" consistently wherever it appears', () => {
    expect(cleanTitle('Glued & Screwed #33')).toBe('glued and screwed #33');
    expect(cleanTitle('A & B & C')).toBe('a and b and c');
  });

  it('still strips parentheticals and annotations around an ampersand', () => {
    expect(cleanTitle('Film & Food: Tampopo (incl. ramen)')).toBe(
      'film and food: tampopo'
    );
  });

  it('keeps existing normalization behaviour', () => {
    expect(cleanTitle('Film (ENG subs) | Event')).toBe('film');
    expect(cleanTitle('Quiet Girl, The')).toBe('the quiet girl');
    expect(cleanTitle("L'Étranger")).toBe("l'etranger");
  });
});
