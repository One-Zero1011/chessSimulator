import { MBTI } from './types';

// Contempt: Stockfish option (-100 to 100). High = Aggressive/Avoid Draw, Low = Defensive/Accept Draw.
// ChatFrequency: 0.0 to 1.0. Probability of chatting on a move.
export const MBTI_TRAITS: Record<MBTI, { style: string; chatFrequency: number; contempt: number }> = {
  // Analysts (전략가형)
  [MBTI.INTJ]: { style: '용의주도한 전략가', chatFrequency: 0.3, contempt: 20 },
  [MBTI.INTP]: { style: '논리적인 사색가', chatFrequency: 0.2, contempt: 10 },
  [MBTI.ENTJ]: { style: '대담한 통솔자', chatFrequency: 0.7, contempt: 60 },
  [MBTI.ENTP]: { style: '뜨거운 논쟁을 즐기는 변론가', chatFrequency: 0.9, contempt: 50 },

  // Diplomats (외교관형)
  [MBTI.INFJ]: { style: '선의의 옹호자', chatFrequency: 0.2, contempt: 0 },
  [MBTI.INFP]: { style: '열정적인 중재자', chatFrequency: 0.4, contempt: -10 },
  [MBTI.ENFJ]: { style: '정의로운 사회운동가', chatFrequency: 0.6, contempt: 30 },
  [MBTI.ENFP]: { style: '재기발랄한 활동가', chatFrequency: 0.8, contempt: 20 },

  // Sentinels (관리자형)
  [MBTI.ISTJ]: { style: '청렴결백한 논리주의자', chatFrequency: 0.1, contempt: -30 },
  [MBTI.ISFJ]: { style: '용감한 수호자', chatFrequency: 0.2, contempt: -50 },
  [MBTI.ESTJ]: { style: '엄격한 관리자', chatFrequency: 0.5, contempt: 40 },
  [MBTI.ESFJ]: { style: '사교적인 외교관', chatFrequency: 0.6, contempt: -10 },

  // Explorers (탐험가형)
  [MBTI.ISTP]: { style: '만능 재주꾼', chatFrequency: 0.2, contempt: 30 },
  [MBTI.ISFP]: { style: '호기심 많은 예술가', chatFrequency: 0.3, contempt: 0 },
  [MBTI.ESTP]: { style: '모험을 즐기는 사업가', chatFrequency: 0.8, contempt: 80 },
  [MBTI.ESFP]: { style: '자유로운 영혼의 연예인', chatFrequency: 0.9, contempt: 40 },
};

export const RELATIONSHIP_OPTIONS = [
  "라이벌",
  "절친",
  "동료",
  "원수",
  "연인",
  "가족",
  "남남",
  "스승",
  "제자",
  "팬",
  "스타",
  "짝사랑",
  "갑",
  "을"
];

// Define reciprocal relationships for 'Mutual' mode
export const MUTUAL_RELATIONSHIP_MAP: Record<string, string> = {
  "라이벌": "라이벌",
  "절친": "절친",
  "동료": "동료",
  "원수": "원수",
  "연인": "연인",
  "가족": "가족",
  "남남": "남남",
  "스승": "제자",
  "제자": "스승",
  "팬": "스타",
  "스타": "팬",
  "짝사랑": "무관심", // Creative mapping
  "무관심": "짝사랑",
  "갑": "을",
  "을": "갑"
};