import { MBTI } from '../types';
import { INTJ } from './mbti/INTJ';
import { INTP } from './mbti/INTP';
import { ENTJ } from './mbti/ENTJ';
import { ENTP } from './mbti/ENTP';
import { INFJ } from './mbti/INFJ';
import { INFP } from './mbti/INFP';
import { ENFJ } from './mbti/ENFJ';
import { ENFP } from './mbti/ENFP';
import { ISTJ } from './mbti/ISTJ';
import { ISFJ } from './mbti/ISFJ';
import { ESTJ } from './mbti/ESTJ';
import { ESFJ } from './mbti/ESFJ';
import { ISTP } from './mbti/ISTP';
import { ISFP } from './mbti/ISFP';
import { ESTP } from './mbti/ESTP';
import { ESFP } from './mbti/ESFP';

export type DialogueSet = {
  opening: string[];
  check: string[];
  capture: string[];
  winning: string[];
  losing: string[];
  generic: string[];
  // Emotions
  happy: string[];
  sad: string[];
  angry: string[];
  fearful: string[];
  anxious: string[];
};

export const MBTI_DIALOGUES: Record<MBTI, DialogueSet> = {
  [MBTI.INTJ]: INTJ,
  [MBTI.INTP]: INTP,
  [MBTI.ENTJ]: ENTJ,
  [MBTI.ENTP]: ENTP,
  [MBTI.INFJ]: INFJ,
  [MBTI.INFP]: INFP,
  [MBTI.ENFJ]: ENFJ,
  [MBTI.ENFP]: ENFP,
  [MBTI.ISTJ]: ISTJ,
  [MBTI.ISFJ]: ISFJ,
  [MBTI.ESTJ]: ESTJ,
  [MBTI.ESFJ]: ESFJ,
  [MBTI.ISTP]: ISTP,
  [MBTI.ISFP]: ISFP,
  [MBTI.ESTP]: ESTP,
  [MBTI.ESFP]: ESFP,
};