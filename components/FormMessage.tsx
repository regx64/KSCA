import type { ActionState } from '@/lib/types';

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl bg-[#fde8e8] px-4 py-3 text-[14px] text-[#86000a]">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="rounded-xl bg-[#e8f1fc] px-4 py-3 text-[14px] text-[#00376b]">
        {state.message}
      </p>
    );
  }
  return null;
}
