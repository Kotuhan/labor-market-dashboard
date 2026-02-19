import type { DashboardState, TreeAction } from '@/types';

import { ConfigGenderSection } from './ConfigGenderSection';

/** Props for the ConfigPage component. */
export interface ConfigPageProps {
  /** Dashboard state from useTreeState */
  state: DashboardState;
  /** Dispatch function from useTreeState */
  dispatch: React.Dispatch<TreeAction>;
}

/**
 * Configuration page for managing industries and subcategories.
 *
 * Renders two ConfigGenderSection panels (male/female) in a
 * responsive grid. Simple composition root with no local state.
 */
export function ConfigPage({ state, dispatch }: ConfigPageProps) {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Налаштування
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ConfigGenderSection
          genderNode={state.tree.children[0]}
          dispatch={dispatch}
        />
        <ConfigGenderSection
          genderNode={state.tree.children[1]}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}
