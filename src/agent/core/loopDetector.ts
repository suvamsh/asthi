import type { ToolCall } from './types';

export class LoopDetector {
  private callPatterns: string[] = [];

  recordCalls(toolCalls: ToolCall[]): void {
    const pattern = toolCalls
      .map(tc => `${tc.name}(${JSON.stringify(tc.arguments)})`)
      .sort()
      .join('|');
    this.callPatterns.push(pattern);
  }

  isLooping(): boolean {
    if (this.callPatterns.length < 2) return false;

    const latest = this.callPatterns[this.callPatterns.length - 1];
    let repeats = 0;

    for (let i = this.callPatterns.length - 2; i >= 0; i--) {
      if (this.callPatterns[i] === latest) {
        repeats++;
      }
    }

    return repeats >= 2;
  }

  reset(): void {
    this.callPatterns = [];
  }
}
