import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAssets } from './hooks/useAssets';
import { useNetWorth } from './hooks/useNetWorth';
import { useLabels } from './hooks/useLabels';
import { isSupabaseConfigured } from './lib/supabase';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { AddAsset } from './pages/AddAsset';
import { AssetDetail } from './pages/AssetDetail';
import { Card } from './components/ui/Card';

function SetupRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asthi</h1>
          <p className="text-gray-600">Setup Required</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-800 text-sm">
            Supabase credentials are not configured. Please follow the setup instructions below.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Create a Supabase Project</h3>
            <p className="text-gray-600">
              Go to{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                supabase.com
              </a>{' '}
              and create a new project.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Run the Database Migrations</h3>
            <p className="text-gray-600">
              Run the CLI migration script (no dashboard needed). Set <code className="bg-gray-100 px-1 rounded">SUPABASE_DB_URL</code> and run:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto mt-2">
{`SUPABASE_DB_URL=postgresql://... npm run db:migrate`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. Enable Google OAuth</h3>
            <p className="text-gray-600">
              In Authentication → Providers, enable Google and add your OAuth credentials.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Create .env File</h3>
            <p className="text-gray-600 mb-2">
              Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in the project root:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ALPHA_VANTAGE_API_KEY=your-api-key`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. Restart the Dev Server</h3>
            <p className="text-gray-600">
              After creating the .env file, restart the development server with{' '}
              <code className="bg-gray-100 px-1 rounded">npm run dev</code>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AppContent() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const {
    assets,
    loading: assetsLoading,
    addAsset,
    updateAsset,
    deleteAsset,
    fetchAssets,
  } = useAssets(user?.id);

  const {
    totalNetWorth,
    breakdown,
    assetsWithValues,
    history,
    loadingPrices,
    netWorthChange,
    netWorthChangePercent,
    getHistoryForRange,
    stockPrices,
    goldPrice,
  } = useNetWorth(user?.id, assets);

  const {
    labels,
    createLabel,
    setAssetLabels,
  } = useLabels(user?.id);

  // Wrapper to refetch assets after setting labels
  const handleSetAssetLabels = async (assetId: string, labelIds: string[]) => {
    await setAssetLabels(assetId, labelIds);
    await fetchAssets();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onSignIn={signInWithGoogle} />;
  }

  return (
    <Layout user={user} onSignOut={signOut}>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              totalNetWorth={totalNetWorth}
              netWorthChange={netWorthChange}
              netWorthChangePercent={netWorthChangePercent}
              breakdown={breakdown}
              assetsWithValues={assetsWithValues}
              history={history}
              loadingPrices={loadingPrices}
              loadingAssets={assetsLoading}
              getHistoryForRange={getHistoryForRange}
              onAddAsset={addAsset}
              labels={labels}
              onCreateLabel={createLabel}
              stockPrices={stockPrices}
              goldPrice={goldPrice}
            />
          }
        />
        <Route
          path="/assets"
          element={
            <Assets
              assets={assetsWithValues}
              loading={assetsLoading}
              onAddAsset={addAsset}
              onDeleteAsset={deleteAsset}
              labels={labels}
              onCreateLabel={createLabel}
            />
          }
        />
        <Route
          path="/assets/add"
          element={
            <AddAsset
              onAddAsset={addAsset}
              labels={labels}
              onCreateLabel={createLabel}
            />
          }
        />
        <Route
          path="/assets/:id"
          element={
            <AssetDetail
              assets={assetsWithValues}
              onUpdateAsset={updateAsset}
              onDeleteAsset={deleteAsset}
              labels={labels}
              onCreateLabel={createLabel}
              onSetAssetLabels={handleSetAssetLabels}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
