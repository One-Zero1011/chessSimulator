
// Using a Blob URL to load Stockfish to avoid CORS issues with direct CDN workers in some browsers
const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';

export interface StockfishResult {
  move: string;
  evaluation: number; // Centipawns (relative to side to move)
}

class StockfishService {
  private worker: Worker | null = null;
  private isReady: boolean = false;

  constructor() {
    this.initWorker();
  }

  private async initWorker() {
    try {
      const response = await fetch(STOCKFISH_URL);
      const scriptContent = await response.text();
      const blob = new Blob([scriptContent], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);
      
      this.worker.onmessage = (e) => {
        if (e.data === 'uciok') {
          this.isReady = true;
        }
      };
      
      this.worker.postMessage('uci');
    } catch (error) {
      console.error("Failed to load Stockfish:", error);
    }
  }

  public getBestMove(fen: string, difficulty: number, contempt: number = 0): Promise<StockfishResult> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject("Stockfish not initialized");
        return;
      }

      let bestMove = "";
      let lastScore = 0; // Centipawns

      const handler = (e: MessageEvent) => {
        const msg = e.data;
        
        // Parse evaluation score from "info" line
        // Example: info depth 10 seldepth 15 multipv 1 score cp 53 ...
        if (typeof msg === 'string' && msg.startsWith('info') && msg.includes('score')) {
            const parts = msg.split(' ');
            const scoreIndex = parts.indexOf('score');
            if (scoreIndex !== -1) {
                const type = parts[scoreIndex + 1]; // 'cp' or 'mate'
                const val = parseInt(parts[scoreIndex + 2]);
                
                if (type === 'cp') {
                    lastScore = val;
                } else if (type === 'mate') {
                    // Convert mate score to a high cp value for logic simplicity
                    lastScore = val > 0 ? 10000 : -10000;
                }
            }
        }

        if (typeof msg === 'string' && msg.startsWith('bestmove')) {
          this.worker?.removeEventListener('message', handler);
          bestMove = msg.split(' ')[1];
          resolve({ move: bestMove, evaluation: lastScore });
        }
      };

      this.worker.addEventListener('message', handler);

      // Configure difficulty
      const skillLevel = Math.max(0, Math.min(20, Math.floor(difficulty / 5)));
      
      this.worker.postMessage(`setoption name Contempt value ${contempt}`);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
      this.worker.postMessage(`go movetime ${800}`);
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const stockfish = new StockfishService();
