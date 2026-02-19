import { DashboardHeader, GenderBarChart, GenderSection } from '@/components';
import { useThrottledValue } from '@/hooks';
import type { DashboardState, TreeAction } from '@/types';

/** Props for the DashboardPage component. */
export interface DashboardPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/** Maximum chart update frequency (ms). */
const CHART_THROTTLE_MS = 300;

/**
 * Dashboard page -- the main "what-if" scenario modeling view.
 *
 * Extracted from the former App.tsx composition root.
 * Renders DashboardHeader + two GenderSection panels (male/female).
 *
 * Throttles tree nodes before passing to GenderBarChart so that
 * memo sees stable references between throttle ticks.
 */
export function DashboardPage({ state, dispatch }: DashboardPageProps) {
  const maleNode = state.tree.children[0];
  const femaleNode = state.tree.children[1];

  // Throttled refs for bar chart -- memo sees same reference between ticks
  const throttledMaleNode = useThrottledValue(maleNode, CHART_THROTTLE_MS);
  const throttledFemaleNode = useThrottledValue(femaleNode, CHART_THROTTLE_MS);

  return (
    <>
      <DashboardHeader
        totalPopulation={state.totalPopulation}
        balanceMode={state.balanceMode}
        dispatch={dispatch}
      />
      <main className="mx-auto w-4/5 py-6">
        <GenderBarChart maleNode={throttledMaleNode} femaleNode={throttledFemaleNode} />
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
