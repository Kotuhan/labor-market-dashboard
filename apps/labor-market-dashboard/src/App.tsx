import { TreePanel } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <TreePanel
          tree={state.tree}
          balanceMode={state.balanceMode}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}
