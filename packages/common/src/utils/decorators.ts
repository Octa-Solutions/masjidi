/**
 * A decorator that debounces a promise-returning function.
 * If the function is called while a previous promise is still pending, the new call returns the pending promise.
 *
 * @typeParam T - The type of the function being decorated.
 * @param fn - The function to debounce.
 * @returns A decorated function that returns the pending promise if one exists, or calls the original function.
 */
export function PromiseDebounceBase<
  T extends (this: any, ...args: any[]) => Promise<any>,
>(fn: T): T {
  let leadingPromise: Promise<any> | undefined = undefined;

  // @ts-ignore
  return async function (this: any, ...args: any[]): Promise<any> {
    if (leadingPromise !== undefined) {
      return await leadingPromise;
    }

    const currentPromise = fn.apply(this, arguments as any);
    leadingPromise = currentPromise;

    return await currentPromise.finally(() => {
      leadingPromise = undefined;
    });
  };
}
