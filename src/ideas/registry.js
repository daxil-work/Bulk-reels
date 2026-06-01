import { beforeAfterIdea } from '../reel/beforeAfter.jsx';

export const IDEAS = [beforeAfterIdea];

export function getIdea(id) {
  return IDEAS.find((idea) => idea.id === id) || IDEAS[0];
}
