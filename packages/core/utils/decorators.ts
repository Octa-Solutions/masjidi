export function PromiseDebounceBase<
  T extends (this: any, ...args: any[]) => Promise<any>
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
