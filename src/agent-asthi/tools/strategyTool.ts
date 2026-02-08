import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import {
  calculateStrategyAlignment,
  computeAssetAllocationComparison,
  computeSectorComparison,
  generateAlignmentSuggestions,
} from '../../lib/insights/strategyAnalysis';

export function createStrategyTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_strategy',
      description: 'Get the user\'s investment strategy, alignment score, allocation comparison (actual vs target), sector preference alignment, and rebalancing suggestions. Returns null if no strategy is set.',
      parameters: [],
    },
    execute: async () => {
      const { assetsWithValues, breakdown, totalNetWorth, strategyData } = ctx;

      if (!strategyData) {
        return { hasStrategy: false, message: 'No investment strategy configured yet.' };
      }

      const alignment = calculateStrategyAlignment(
        assetsWithValues, breakdown, totalNetWorth, strategyData
      );
      const allocationComparison = computeAssetAllocationComparison(
        breakdown, totalNetWorth, strategyData.targetAllocation
      );
      const sectorComparison = computeSectorComparison(
        assetsWithValues, totalNetWorth, strategyData.sectorPreferences
      );
      const suggestions = generateAlignmentSuggestions(
        breakdown, totalNetWorth, strategyData
      );

      return {
        hasStrategy: true,
        strategy: {
          philosophy: strategyData.philosophy,
          riskTolerance: strategyData.riskTolerance,
          timeHorizon: strategyData.timeHorizon,
          goals: strategyData.goals.map(g => ({
            type: g.type,
            label: g.label || g.type,
            targetAmount: g.targetAmount || null,
          })),
        },
        alignmentScore: {
          overall: alignment.overall,
          assetAllocation: alignment.assetAllocation,
          sectorAlignment: alignment.sectorAlignment,
          riskConsistency: alignment.riskConsistency,
        },
        allocationComparison: allocationComparison.map(c => ({
          category: c.category,
          actual: `${c.actual}%`,
          target: `${c.target}%`,
          diff: `${c.diff > 0 ? '+' : ''}${c.diff}%`,
        })),
        sectorAlignment: sectorComparison
          .filter(s => s.preference !== 'neutral' || !s.aligned)
          .map(s => ({
            sector: s.sector,
            preference: s.preference,
            actual: `${s.actualPercent}%`,
            aligned: s.aligned,
          })),
        suggestions: suggestions.map(s => ({
          title: s.title,
          description: s.description,
          severity: s.severity,
        })),
      };
    },
  };
}
