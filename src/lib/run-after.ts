import { after } from "next/server";

/**
 * Run work after the response is sent (Next.js `after`). Outside a request
 * (scripts, tests) `after` throws, so the work runs detached instead.
 */
export function runAfter(task: () => Promise<unknown> | unknown) {
  try {
    after(task);
  } catch {
    void Promise.resolve()
      .then(task)
      .catch(() => undefined);
  }
}
