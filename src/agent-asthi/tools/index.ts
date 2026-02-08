import { ToolRegistry } from '../../agent/tools/registry';
import type { ToolContext } from '../types';
import { createPortfolioTool } from './portfolioTool';
import { createInsightsTool } from './insightsTool';
import { createNewsTool } from './newsTool';
import { createStrategyTool } from './strategyTool';
import { createSectorTool } from './sectorTool';
import { createPriceTool } from './priceTool';
import { createNewsImpactTool } from './newsImpactTool';
import { createPerformanceTool } from './calculationTool';

export function createAsthiToolRegistry(ctx: ToolContext): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(createPortfolioTool(ctx));
  registry.register(createInsightsTool(ctx));
  registry.register(createNewsTool(ctx));
  registry.register(createStrategyTool(ctx));
  registry.register(createSectorTool(ctx));
  registry.register(createPriceTool(ctx));
  registry.register(createNewsImpactTool(ctx));
  registry.register(createPerformanceTool(ctx));

  return registry;
}
