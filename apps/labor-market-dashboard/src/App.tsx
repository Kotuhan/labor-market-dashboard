import { Route, Router, Switch } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';

import { DashboardPage } from '@/components/DashboardPage';
import { AppLayout } from '@/components/layout';
import { useTreeState } from '@/hooks';

/**
 * Application root -- router boundary.
 *
 * `useTreeState()` is called ABOVE the Router so that state persists
 * across route transitions. AppLayout provides the sidebar + content shell.
 * Each route receives state/dispatch via props (no Context needed).
 */
export function App() {
  const { state, dispatch } = useTreeState();

  return (
    <Router hook={useHashLocation}>
      <AppLayout>
        <Switch>
          <Route path="/">
            <DashboardPage state={state} dispatch={dispatch} />
          </Route>
          <Route path="/config">
            <div className="p-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Configuration
              </h1>
              <p className="mt-2 text-slate-600">
                Configuration page coming soon.
              </p>
            </div>
          </Route>
        </Switch>
      </AppLayout>
    </Router>
  );
}
