import { DashboardHeader, GenderSection } from '@/components';
import { useTreeState } from '@/hooks';

/**
 * Dashboard composition root.
 *
 * Wires useTreeState hook and distributes state/dispatch to:
 * - DashboardHeader: sticky top bar with title, population input, mode toggle, reset
 * - GenderSection (x2): male and female tree + pie chart panels
 *
 * App.tsx contains no business logic -- it is purely compositional.
 * All behavior is tested via individual component test suites.
 */
export function App() {
  const { state, dispatch } = useTreeState();

  const maleNode = state.tree.children[0];
  const femaleNode = state.tree.children[1];

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        totalPopulation={state.totalPopulation}
        balanceMode={state.balanceMode}
        dispatch={dispatch}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GenderSection
            genderNode={maleNode}
            genderSiblings={state.tree.children}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
          <GenderSection
            genderNode={femaleNode}
            genderSiblings={state.tree.children}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
          />
        </div>
      </main>
    </div>
  );
}
