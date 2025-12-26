
import { Chess } from 'chess.js';

export interface GameExplanation {
  title: string;
  description: string;
  advantage: number; // -100 (Black wins) to 100 (White wins)
  status: 'white_winning' | 'black_winning' | 'equal' | 'check' | 'mate';
}

/**
 * Converts Stockfish centipawn score to a winning probability (-100 to 100 range for UI bar)
 * Note: Stockfish score is relative to the side to move.
 */
export function calculateAdvantage(centipawns: number, turn: 'w' | 'b'): number {
  // Negate if it's black's turn, so positive is always White advantage, negative is Black
  const absoluteScore = turn === 'w' ? centipawns : -centipawns;
  
  // Sigmoid-like clamping to -100 ~ 100 range
  // 100cp (1 pawn advantage) ~= 20% bar shift
  // 500cp (Rook advantage) ~= 80% bar shift
  const clamped = Math.max(-1000, Math.min(1000, absoluteScore));
  return (clamped / 10); 
}

export function getBeginnerExplanation(
  game: Chess, 
  lastMove: any, 
  advantage: number
): GameExplanation {
  let title = "게임 진행 중";
  let description = "양측이 신중하게 수를 두고 있습니다.";
  let status: GameExplanation['status'] = 'equal';

  // 1. Checkmate / Game Over
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? '흑색' : '백색';
    return {
      title: "체크메이트! 게임 종료",
      description: `${winner}이(가) 승리했습니다. 왕이 더 이상 도망갈 곳이 없습니다.`,
      advantage: game.turn() === 'w' ? -100 : 100,
      status: 'mate'
    };
  }

  if (game.isDraw()) {
    return {
      title: "무승부",
      description: "더 이상 승부를 가릴 수 없는 상태입니다.",
      advantage: 0,
      status: 'equal'
    };
  }

  // 2. Check
  if (game.inCheck()) {
    const victim = game.turn() === 'w' ? '백색' : '흑색';
    return {
      title: "왕이 위험합니다! (체크)",
      description: `${victim} 왕이 공격받고 있습니다. 반드시 피하거나 막아야 합니다!`,
      advantage: advantage,
      status: 'check'
    };
  }

  // 3. Status based on advantage
  if (advantage > 30) {
    status = 'white_winning';
    title = "백색이 유리합니다";
  } else if (advantage < -30) {
    status = 'black_winning';
    title = "흑색이 유리합니다";
  } else {
    title = "박빙의 승부";
  }

  // 4. Move explanation
  if (lastMove) {
    const pieceNames: Record<string, string> = {
      p: '폰(병사)', n: '나이트(기사)', b: '비숍(성직자)', r: '룩(성)', q: '퀸(여왕)', k: '킹(왕)'
    };
    const movedPiece = pieceNames[lastMove.piece] || '기물';
    
    if (lastMove.captured) {
        const capturedPiece = pieceNames[lastMove.captured] || '기물';
        description = `${movedPiece}이(가) 상대방의 ${capturedPiece}을(를) 잡았습니다! 중요한 기물 교환이 일어났습니다.`;
    } else if (lastMove.san.includes('O-O')) {
        description = "캐슬링! 왕을 안전한 구석으로 피신시키고 룩을 중앙으로 배치했습니다.";
    } else if (lastMove.promotion) {
        description = "폰이 체스판 끝까지 도달하여 강력한 기물로 승진했습니다!";
    } else {
        // Simple positional logic text
        if (advantage > 50 && status === 'white_winning') description = "백색이 강력한 공격으로 상대를 압박하고 있습니다.";
        else if (advantage < -50 && status === 'black_winning') description = "흑색이 판을 장악하며 승기를 잡아가고 있습니다.";
        else description = `${movedPiece}이(가) 더 좋은 위치로 이동하여 기회를 엿보고 있습니다.`;
    }
  }

  return { title, description, advantage, status };
}
