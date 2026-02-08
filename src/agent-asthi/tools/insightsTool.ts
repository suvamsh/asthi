import type { AgentTool } from '../../agent/tools/types';
import type { ToolContext } from '../types';
import {
  calculateHealthScore,
  generateConcentrationInsights,
  generateSectorInsights,
  generateAssetTypeInsights,
  generateRebalancingInsights,
  generatePerformanceInsights,
  generateTaxInsights,
} from '../../lib/insights/portfolioAnalysis';

const VALID_CATEGORIES = [
  'all', 'health', 'concentration', 'sector', 'asset_type',
  'rebalancing', 'performance', 'tax',
] as const;

export function createInsightsTool(ctx: ToolContext): AgentTool {
  return {
    definition: {
      name: 'get_insights',
      description: 'Get portfolio analysis insights including health score, concentration risks, sector analysis, asset type balance, rebalancing opportunities, performance highlights, and tax-loss harvesting. Filter by category to get specific insights.',
      parameters: [
        {
          name: 'category',
          type: 'string',
          description: 'Filter insights by category. Use "all" for everything.',
          required: false,
          enum: [...VALID_CATEGORIES],
        },
      ],
    },
    execute: async (args) => {
      const { assetsWithValues, breakdown, totalNetWorth } = ctx;
      const category = (args.category as string) || 'all';

      const result: Record<string, unknown> = {};

      if (category === 'all' || category === 'health') {
        result.healthScore = calculateHealthScore(assetsWithValues, breakdown, totalNetWorth);
      }

      const insights = [];

      if (category === 'all' || category === 'concentration') {
        insights.push(...generateConcentrationInsights(assetsWithValues, totalNetWorth));
      }
      if (category === 'all' || category === 'sector') {
        insights.push(...generateSectorInsights(assetsWithValues, totalNetWorth));
      }
      if (category === 'all' || category === 'asset_type') {
        insights.push(...generateAssetTypeInsights(breakdown, totalNetWorth));
      }
      if (category === 'all' || category === 'rebalancing') {
        insights.push(...generateRebalancingInsights(assetsWithValues, totalNetWorth));
      }
      if (category === 'all' || category === 'performance') {
        insights.push(...generatePerformanceInsights(assetsWithValues));
      }
      if (category === 'all' || category === 'tax') {
        insights.push(...generateTaxInsights(assetsWithValues));
      }

      if (insights.length > 0) {
        result.insights = insights.map(i => ({
          severity: i.severity,
          category: i.category,
          title: i.title,
          description: i.description,
          metric: i.metric || null,
        }));
      }

      return result;
    },
  };
}
