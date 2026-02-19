import { DashboardHeader, GenderSection } from '@/components';
import type { DashboardState, TreeAction } from '@/types';

/** Props for the DashboardPage component. */
export interface DashboardPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Dashboard page -- the main "what-if" scenario modeling view.
 *
 * Extracted from the former App.tsx composition root.
 * Renders DashboardHeader + two GenderSection panels (male/female).
 */
export function DashboardPage({ state, dispatch }: DashboardPageProps) {
  const maleNode = state.tree.children[0];
  const femaleNode = state.tree.children[1];

  return (
    <>
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
            mirrored={false}
          />
          <GenderSection
            genderNode={femaleNode}
            genderSiblings={state.tree.children}
            balanceMode={state.balanceMode}
            dispatch={dispatch}
            mirrored={true}
          />
        </div>
      </main>
    </>
  );
}
