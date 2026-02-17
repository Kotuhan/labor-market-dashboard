// Temporary update for build compatibility -- will be fully rewritten in subtask 8.5

import { TreePanel } from '@/components';
import { useTreeState } from '@/hooks';

export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        {state.tree.children.map((genderNode) => (
          <TreePanel
            key={genderNode.id}
            genderNode={genderNode}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
        ))}
      </div>
    </div>
  );
}
