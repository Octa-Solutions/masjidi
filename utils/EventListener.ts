export class EventListener<TEvents extends Record<any, any[]>> {
  private events: {
    [K in keyof TEvents]?: Set<(...args: TEvents[K]) => void>;
  } = {};

  on<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void
  ): () => void {
    if (!this.events[type]) {
      this.events[type] = new Set();
    }
    this.events[type]!.add(listener);
    return () => this.off(type, listener);
  }

  off<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void
  ) {
    this.events[type]?.delete(listener);
  }

  once<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void
  ): () => void {
    const wrapper = (...args: TEvents[T]) => {
      this.off(type, wrapper);
      listener(...args);
    };
    return this.on(type, wrapper);
  }

  protected dispatch<T extends keyof TEvents>(type: T, ...args: TEvents[T]) {
    // console.info(`Dispatching event '${String(type)}'.`, args);

    this.events[type]?.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for '${String(type)}':`, error);
      }
    });
  }
}
