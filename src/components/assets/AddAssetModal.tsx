import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Building2, Coins, Wallet, PiggyBank } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { StockForm } from './StockForm';
import { RealEstateForm } from './RealEstateForm';
import { GoldForm } from './GoldForm';
import { ManualAssetForm } from './ManualAssetForm';
import { TaxAdvantagedAccountForm } from './TaxAdvantagedAccountForm';
import type { Asset, AssetType, Label } from '../../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: {
    name: string;
    type: AssetType;
    ticker?: string;
    shares?: number;
    purchase_price?: number;
    purchase_date?: string;
    down_payment?: number;
    mortgage_amount?: number;
    current_value?: number;
    weight_oz?: number;
    manual_value?: number;
    is_account?: boolean;
    parent_asset_id?: string;
    notes?: string;
    labelIds?: string[];
  }) => Promise<Asset | null>;
  labels: Label[];
  onCreateLabel: (name: string) => Promise<Label | null>;
}

type AssetCategory = 'stock' | 'real_estate' | 'gold' | 'tax_advantaged' | 'manual';

const assetCategories = [
  { id: 'stock' as const, label: 'Stocks', icon: TrendingUp, description: 'Track shares and market value' },
  { id: 'real_estate' as const, label: 'Real Estate', icon: Building2, description: 'Track properties and equity' },
  { id: 'gold' as const, label: 'Gold', icon: Coins, description: 'Track precious metals' },
  { id: 'tax_advantaged' as const, label: 'Tax Advantaged', icon: PiggyBank, description: '401(k), Roth IRA, HSA accounts' },
  { id: 'manual' as const, label: 'Other', icon: Wallet, description: 'Cash, crypto, or other assets' },
];

export function AddAssetModal({ isOpen, onClose, onAdd, labels, onCreateLabel }: AddAssetModalProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setSelectedCategory(null);
    onClose();
  };

  const handleSubmit = async (data: Parameters<typeof onAdd>[0]) => {
    setLoading(true);
    try {
      const created = await onAdd(data);
      handleClose();
      if (created?.is_account) {
        navigate(`/assets/${created.id}`);
      }
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (data: { account: Parameters<typeof onAdd>[0]; positions: Array<{
    name: string;
    pricing_mode: 'live' | 'manual';
    ticker?: string;
    shares?: number;
    manual_value?: number;
    cost_basis?: number;
    notes?: string;
  }> }) => {
    setLoading(true);
    try {
      const created = await onAdd(data.account);
      if (created?.id) {
        for (const position of data.positions) {
          await onAdd({
            name: position.name,
            type: 'tax_advantaged',
            account_type: created.account_type,
            parent_asset_id: created.id,
            ticker: position.pricing_mode === 'live' ? position.ticker : undefined,
            shares: position.pricing_mode === 'live' ? position.shares : undefined,
            manual_value: position.pricing_mode === 'manual' ? position.manual_value : undefined,
            cost_basis: position.cost_basis,
            notes: position.notes,
          });
        }
      }
      handleClose();
      if (created?.is_account) {
        navigate(`/assets/${created.id}`);
      }
    } catch (error) {
      console.error('Error adding account:', error);
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
          <TaxAdvantagedAccountForm
            onSubmit={(data) => handleAccountSubmit(data)}
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCategory ? `Add ${assetCategories.find(c => c.id === selectedCategory)?.label}` : 'Add Asset'}
      size="md"
    >
      {selectedCategory ? (
        renderForm()
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {assetCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex flex-col items-center p-4 border border-[#3c3c3c] rounded-lg hover:border-[#0e639c] hover:bg-[#2a2d2e] transition-colors text-center"
            >
              <category.icon className="w-8 h-8 text-[#8a8a8a] mb-2" />
              <p className="font-medium text-[#e0e0e0]">{category.label}</p>
              <p className="text-xs text-[#6e6e6e] mt-1">{category.description}</p>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
