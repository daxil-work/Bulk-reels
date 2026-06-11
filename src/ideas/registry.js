import { beforeAfterIdea } from '../reel/beforeAfter.jsx';
import { freePhotoshootIdea } from '../reel/freePhotoshoot.jsx';

export const IDEAS = [beforeAfterIdea, freePhotoshootIdea];

export function getIdea(id) {
  return IDEAS.find((idea) => idea.id === id) || IDEAS[0];
}
