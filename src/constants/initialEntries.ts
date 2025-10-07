import { JournalEntry } from '@types/index';

export const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 1,
    date: 'October 3, 2025',
    title: 'Small Moments of Peace',
    tags: ['mindfulness', 'gratitude'],
    content:
      "Today I realized that the small moments of peace throughout the day are what truly matter. A warm cup of coffee in the morning sunlight, a conversation with a friend who truly listens, the way the evening light filters through the trees.\n\nThese aren't grand moments, but they're the ones that stay with me.",
    mood: 'peaceful',
  },
  {
    id: 2,
    date: 'October 2, 2025',
    title: 'Growth in the Messy Middle',
    tags: ['growth', 'reflection'],
    content:
      "Growth doesn't happen in straight lines. I'm learning to embrace the messy middle, where progress feels invisible but is happening nonetheless.\n\nToday felt like a step backward in some ways, but maybe that's just part of the dance.",
    mood: 'thoughtful',
  },
];
