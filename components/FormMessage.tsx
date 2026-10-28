import type { ActionState } from '@/lib/types';

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
        {state.message}
      </p>
    );
  }
  return null;
}
