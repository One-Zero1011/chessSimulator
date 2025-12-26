
import { DialogueSet } from './dialogues';
import { RIVAL } from './relationships/rival';
import { BEST_FRIEND } from './relationships/bestFriend';
import { COLLEAGUE } from './relationships/colleague';
import { ENEMY } from './relationships/enemy';
import { LOVER } from './relationships/lover';
import { FAMILY } from './relationships/family';
import { STRANGER } from './relationships/stranger';
import { MASTER } from './relationships/master';
import { DISCIPLE } from './relationships/disciple';
import { FAN } from './relationships/fan';
import { STAR } from './relationships/star';
import { CRUSH } from './relationships/crush';
import { BOSS } from './relationships/boss';
import { SUBORDINATE } from './relationships/subordinate';

export const RELATIONSHIP_DIALOGUES: Record<string, Partial<DialogueSet>> = {
  "라이벌": RIVAL,
  "절친": BEST_FRIEND,
  "동료": COLLEAGUE,
  "원수": ENEMY,
  "연인": LOVER,
  "가족": FAMILY,
  "남남": STRANGER,
  "스승": MASTER,
  "제자": DISCIPLE,
  "팬": FAN,
  "스타": STAR,
  "짝사랑": CRUSH,
  "갑": BOSS,
  "을": SUBORDINATE
};
