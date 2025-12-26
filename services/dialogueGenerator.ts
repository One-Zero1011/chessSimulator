import { MBTI } from '../types';
import { MBTI_TRAITS } from '../constants';
import { MBTI_DIALOGUES, DialogueSet } from '../data/dialogues';
import { RELATIONSHIP_DIALOGUES } from '../data/relationships';

export type DialogueSituation = keyof DialogueSet;

export function generateDialogue(
  playerMbti: MBTI,
  situation: DialogueSituation,
  opponentName: string,
  relationship: string
): string {
  const trait = MBTI_TRAITS[playerMbti];
  
  // Random chance to stay silent based on chatFrequency
  // We reduce silence chance for strong emotions
  const isEmotional = ['happy', 'sad', 'angry', 'fearful'].includes(situation);
  const threshold = isEmotional ? trait.chatFrequency * 1.5 : trait.chatFrequency;

  if (Math.random() > Math.min(threshold, 0.95) && situation === 'generic') {
    return "";
  }

  const mbtiSet = MBTI_DIALOGUES[playerMbti];
  const relationshipSet = RELATIONSHIP_DIALOGUES[relationship];

  let templates: string[] = [];
  const mbtiQuotes = mbtiSet?.[situation] || [];
  const relQuotes = relationshipSet?.[situation] || [];
  
  const hasMbti = mbtiQuotes.length > 0;
  const hasRel = relQuotes.length > 0;

  // Prioritize MBTI (75%) over Relationship (25%)
  if (hasMbti && hasRel) {
      if (Math.random() < 0.75) {
          templates = mbtiQuotes;
      } else {
          templates = relQuotes;
      }
  } else if (hasMbti) {
      templates = mbtiQuotes;
  } else if (hasRel) {
      templates = relQuotes;
  }

  // Fallback to MBTI generic if empty
  if (templates.length === 0) {
      if (mbtiSet && mbtiSet.generic) templates = [...mbtiSet.generic];
      else return "";
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  // Simple interpolation
  return template
    .replace('{name}', opponentName)
    .replace('{relationship}', relationship);
}