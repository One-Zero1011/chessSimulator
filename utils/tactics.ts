import { Chess } from 'chess.js';

export interface TacticResult {
  name: string;
  color: string; // CSS Color or Class
  description: string;
  squaresToHighlight: string[];
}

// Helper to get piece value
const getPieceValue = (type: string) => {
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  return values[type] || 0;
};

export function analyzeMoveTactics(game: Chess, move: any): TacticResult | null {
  const tactics: TacticResult[] = [];
  const to = move.to;
  const from = move.from;
  
  // 1. CHECKMATE
  if (game.isCheckmate()) {
    return {
      name: "CHECKMATE",
      color: "bg-red-600 text-white border-red-900",
      description: "게임 종료",
      squaresToHighlight: [to, game.board().flat().find((p) => p && p.type === 'k' && p.color !== move.color)?.square || '']
    };
  }

  // 2. CHECK
  if (game.inCheck()) {
    // Check for "Discovered Check" heuristic? 
    // Simplify: Just return Check for now, handled visually by the King glowing red
    tactics.push({
      name: "CHECK!",
      color: "bg-orange-600 text-white",
      description: "왕이 위협받고 있습니다",
      squaresToHighlight: [to]
    });
  }

  // 3. CASTLING
  if (move.san.includes('O-O')) {
    return {
      name: "CASTLING",
      color: "bg-blue-600 text-white",
      description: "왕과 룩의 협동 작전",
      squaresToHighlight: [from, to]
    };
  }

  // 4. PROMOTION
  if (move.promotion) {
    return {
      name: "PROMOTION",
      color: "bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)]",
      description: "폰의 화려한 변신",
      squaresToHighlight: [to]
    };
  }

  // 5. EN PASSANT
  if (move.flags.includes('e')) {
    return {
      name: "EN PASSANT",
      color: "bg-purple-600 text-white",
      description: "특별한 폰 잡기 규칙",
      squaresToHighlight: [from, to]
    };
  }

  // 6. FORK (Knight Heuristic)
  // If a knight moves and attacks 2+ major pieces (K, Q, R, B)
  if (move.piece === 'n') {
    let attackCount = 0;
    const attackedSquares: string[] = [];
    
    // Simple board scan for knight attacks from 'to'
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    const fileMap: Record<string, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
    const rankMap: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8 };
    const fileRev = ['x', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    const currentFile = fileMap[to[0]];
    const currentRank = rankMap[to[1]];

    knightMoves.forEach(([df, dr]) => {
      const f = currentFile + df;
      const r = currentRank + dr;
      if (f >= 1 && f <= 8 && r >= 1 && r <= 8) {
        const sq = `${fileRev[f]}${r}`;
        const piece = game.get(sq as any);
        if (piece && piece.color !== move.color) {
          if (['k', 'q', 'r', 'b'].includes(piece.type)) {
            attackCount++;
            attackedSquares.push(sq);
          }
        }
      }
    });

    if (attackCount >= 2) {
      return {
        name: "FORK!",
        color: "bg-emerald-600 text-white",
        description: "두 기물을 동시에 공격!",
        squaresToHighlight: [to, ...attackedSquares]
      };
    }
  }

  // 7. CAPTURE (High value)
  if (move.captured) {
    const value = getPieceValue(move.captured);
    if (value >= 5) { // Rook or Queen capture
      return {
        name: "BIG CAPTURE!",
        color: "bg-pink-600 text-white",
        description: "중요 기물 제압",
        squaresToHighlight: [to]
      };
    }
  }

  // Return the highest priority tactic if multiple
  if (tactics.length > 0) return tactics[0];

  return null;
}