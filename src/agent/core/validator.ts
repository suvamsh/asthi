import type { ToolResult, ValidationResult } from './types';
import type { LoopDetector } from './loopDetector';

export function validateStepResults(
  toolResults: ToolResult[],
  loopDetector: LoopDetector,
): ValidationResult {
  const issues: string[] = [];

  // Check if all tool calls errored
  const allErrors = toolResults.length > 0 && toolResults.every(tr => tr.error);
  if (allErrors) {
    issues.push('All tool calls returned errors. Try different tools or parameters.');
  }

  // Check for empty results
  const emptyResults = toolResults.filter(tr => {
    if (tr.error) return false;
    const result = tr.result;
    if (result === null || result === undefined) return true;
    if (typeof result === 'string' && result.trim() === '') return true;
    if (Array.isArray(result) && result.length === 0) return true;
    if (typeof result === 'object' && Object.keys(result as object).length === 0) return true;
    return false;
  });

  if (emptyResults.length === toolResults.length && toolResults.length > 0) {
    issues.push('All tool calls returned empty results. Consider using different tools or queries.');
  }

  // Check for loops
  if (loopDetector.isLooping()) {
    issues.push('Detected repeated tool call pattern. Break the loop by trying a different approach or summarizing what you have.');
  }

  return {
    isValid: issues.length === 0,
    issues,
    needsRefinement: issues.length > 0,
  };
}
