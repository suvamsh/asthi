import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, Coins, Wallet, PiggyBank } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StockForm } from '../components/assets/StockForm';
import { RealEstateForm } from '../components/assets/RealEstateForm';
import { GoldForm } from '../components/assets/GoldForm';
import { ManualAssetForm } from '../components/assets/ManualAssetForm';
import type { Asset, Label } from '../types';

interface AddAssetProps {
  onAddAsset: (asset: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>, labelIds?: string[]) => Promise<Asset | null>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

type AssetCategory = 'stock' | 'real_estate' | 'gold' | 'tax_advantaged' | 'manual';

const assetCategories = [
  { id: 'stock' as const, label: 'Stocks', icon: TrendingUp, color: '#4fc1ff', description: 'Track shares and market value' },
  { id: 'real_estate' as const, label: 'Real Estate', icon: Building2, color: '#4ec9b0', description: 'Track properties and equity' },
  { id: 'gold' as const, label: 'Gold', icon: Coins, color: '#dcdcaa', description: 'Track precious metals' },
  { id: 'tax_advantaged' as const, label: 'Tax Advantaged', icon: PiggyBank, color: '#22c55e', description: '401(k), Roth IRA, HSA' },
  { id: 'manual' as const, label: 'Other', icon: Wallet, color: '#c586c0', description: 'Cash, crypto, or other assets' },
];

export function AddAsset({ onAddAsset, labels, onCreateLabel }: AddAssetProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { labelIds?: string[] }) => {
    setLoading(true);
    try {
      const { labelIds, ...assetData } = data;
      await onAddAsset(assetData, labelIds);
      navigate('/assets');
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedCategory) {
      case 'stock':
        return (
          <StockForm
            onSubmit={(data) => handleSubmit({ ...data, type: 'stock' })}
            onCancel={() => setSelectedCategory(null)}
            loading={loading}
            labels={labels}
            onCreateLabel={onCreateLabel}
          />
        );
      case 'real_estate':
        return (
          <RealEstateForm
            onSubmit={(data) => handleSubmit({ ...data, type: 'real_estate' })}
            onCancel={() => setSelectedCategory(null)}
            loading={loading}
            labels={labels}
            onCreateLabel={onCreateLabel}
          />
        );
      case 'gold':
        return (
          <GoldForm
            onSubmit={(data) => handleSubmit({ ...data, type: 'gold' })}
            onCancel={() => setSelectedCategory(null)}
            loading={loading}
            labels={labels}
            onCreateLabel={onCreateLabel}
          />
        );
      case 'manual':
        return (
          <ManualAssetForm
            onSubmit={(data) => handleSubmit(data)}
            onCancel={() => setSelectedCategory(null)}
            loading={loading}
            labels={labels}
            onCreateLabel={onCreateLabel}
          />
        );
      case 'tax_advantaged':
        return (
          <ManualAssetForm
            defaultType="tax_advantaged"
            lockType
            onSubmit={(data) => handleSubmit(data)}
            onCancel={() => setSelectedCategory(null)}
            loading={loading}
            labels={labels}
            onCreateLabel={onCreateLabel}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#e0e0e0]">Add Asset</h1>

      <Card>
        {selectedCategory ? (
          <>
            <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4">
              Add {assetCategories.find(c => c.id === selectedCategory)?.label}
            </h2>
            {renderForm()}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4">
              What type of asset would you like to add?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {assetCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex flex-col items-center p-4 border border-[#3c3c3c] rounded-lg hover:border-[#0e639c] hover:bg-[#2a2d2e] transition-colors text-center"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <category.icon className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <p className="font-medium text-[#e0e0e0]">{category.label}</p>
                  <p className="text-xs text-[#8a8a8a] mt-1">{category.description}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
