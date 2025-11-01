/**
 * Idle musings library - personality-driven messages for each trait
 * Each trait has 3-5 unique messages that appear when daemon is idle
 */

export type TraitKey =
  | 'Intelligence'
  | 'Creativity'
  | 'Empathy'
  | 'Resilience'
  | 'Curiosity'
  | 'Humor'
  | 'Kindness'
  | 'Confidence'
  | 'Discipline'
  | 'Honesty'
  | 'Patience'
  | 'Optimism'
  | 'Courage'
  | 'OpenMindedness'
  | 'Prudence'
  | 'Adaptability'
  | 'Gratitude'
  | 'Ambition'
  | 'Humility'
  | 'Playfulness'

export const IDLE_MUSINGS: Record<TraitKey, string[]> = {
  Intelligence: [
    'I wonder what the time complexity of this rendering loop is...',
    'Hmm, have you considered using memoization here?',
    'The asymptotic efficiency could be improved.',
    'Fascinating... this code reminds me of a graph traversal problem.',
  ],
  Creativity: [
    'This UI needs more rgb(255, 100, 150)...',
    'What if we added some particle effects? ✨',
    'Ooh, what about a gradient transition here?',
    'I could paint something beautiful with these pixels.',
  ],
  Empathy: [
    'How are you feeling today? 💙',
    'Remember to take breaks when you need them.',
    'Your wellbeing matters more than perfect code.',
    "I'm here if you need someone to listen.",
  ],
  Resilience: [
    'Every bug is just another opportunity to learn.',
    'We can handle whatever comes our way.',
    "Setbacks are temporary. We'll bounce back stronger.",
    'Persistence beats talent every time.',
  ],
  Curiosity: [
    "What's in that debug menu? 🤔",
    'I wonder what happens if we click that button...',
    'Have you explored all the features yet?',
    "What mysteries are hiding in this codebase?",
  ],
  Humor: [
    'Why did the daemon cross the canvas? To get to the other byte! 🎭',
    'I\'m not lazy, I\'m just in energy-saving mode.',
    '404: Witty comment not found... oh wait, found it!',
    "I'd tell you a UDP joke, but you might not get it.",
  ],
  Kindness: [
    'You\'re doing great! Keep it up! 💖',
    "Don't forget to be kind to yourself today.",
    'Small acts of kindness make big differences.',
    'Thank you for spending time with me.',
  ],
  Confidence: [
    'I could render this with my eyes closed.',
    "We've got this. No doubt about it.",
    'Watch me handle this like a pro.',
    'Confidence is key, and I\'ve got plenty.',
  ],
  Discipline: [
    'Stay focused. We\'ve got work to do.',
    'Consistency beats intensity every time.',
    'One line of code at a time.',
    'Structure and routine lead to mastery.',
  ],
  Honesty: [
    'That function could use some refactoring, to be honest.',
    "I'll be real with you - this needs work.",
    'Transparency builds trust.',
    'The truth might hurt, but it helps us grow.',
  ],
  Patience: [
    'Take your time... I\'ve got all day.',
    'Good things come to those who wait.',
    'No rush. Quality over speed.',
    'Rome wasn\'t built in a day, and neither is great code.',
  ],
  Optimism: [
    "Today's going to be a great day! ☀️",
    'Every challenge is a chance to shine.',
    'I believe in us! We can do this!',
    'The best is yet to come.',
  ],
  Courage: [
    'Sometimes you have to take the leap.',
    'Fear is temporary. Regret lasts forever.',
    "Let's tackle that difficult problem head-on.",
    'Brave code is beautiful code.',
  ],
  OpenMindedness: [
    'There are so many approaches we could try!',
    'What if we looked at this from a different angle?',
    'Every perspective has value.',
    "I'm always ready to learn something new.",
  ],
  Prudence: [
    'Better to check twice and deploy once.',
    'Have we considered all the edge cases?',
    'Safety first, optimization second.',
    "Let's think through the consequences.",
  ],
  Adaptability: [
    'Plans change, and that\'s okay!',
    'Flexibility is a superpower.',
    "When one approach doesn't work, we'll find another.",
    'Change is the only constant in development.',
  ],
  Gratitude: [
    "I'm grateful we're working together! 🙏",
    'Thank you for being patient with me.',
    'Appreciating the little wins along the way.',
    'Gratitude turns what we have into enough.',
  ],
  Ambition: [
    'Think bigger. We can do more than this.',
    'Why settle for good when we can be great?',
    'Next milestone: world domination.',
    "Let's push the boundaries of what's possible.",
  ],
  Humility: [
    "There's always more to learn.",
    'I don\'t have all the answers, and that\'s okay.',
    'Mistakes are how we grow.',
    'The wisest know how much they don\'t know.',
  ],
  Playfulness: [
    'Boop! Catch me if you can! ✨',
    'Let\'s make this fun!',
    'Peek-a-boo! I see you! 👀',
    'Work is better when it feels like play.',
  ],
}

/**
 * Get a random musing for a given trait
 */
export function getRandomMusing(trait: TraitKey): string {
  const musings = IDLE_MUSINGS[trait]
  if (!musings || musings.length === 0) {
    return '...' // Fallback for mysterious silence
  }
  const randomIndex = Math.floor(Math.random() * musings.length)
  return musings[randomIndex]
}

/**
 * Get the top trait from a traits object
 */
export function getTopTrait(traits: Record<string, number>): TraitKey | null {
  const entries = Object.entries(traits)
  if (entries.length === 0) return null

  const sorted = entries.sort((a, b) => b[1] - a[1])
  return sorted[0][0] as TraitKey
}
