/**
 * A generic event listener class that allows subscribing to and dispatching events.
 *
 * @typeParam TEvents - A record where keys are event names and values are arrays of arguments for the event listener.
 */
export class EventListener<TEvents extends Record<any, any[]>> {
  private events: {
    [K in keyof TEvents]?: Set<(...args: TEvents[K]) => void>;
  } = {};

  /**
   * Subscribes a listener to a specific event.
   *
   * @param type - The event type to subscribe to.
   * @param listener - The function to be called when the event is dispatched.
   * @returns A function that, when called, unsubscribes the listener.
   */
  on<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void,
  ): () => void {
    if (!this.events[type]) {
      this.events[type] = new Set();
    }
    this.events[type]!.add(listener);
    return () => this.off(type, listener);
  }

  /**
   * Unsubscribes a listener from a specific event.
   *
   * @param type - The event type to unsubscribe from.
   * @param listener - The listener function to remove.
   */
  off<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void,
  ) {
    this.events[type]?.delete(listener);
  }

  /**
   * Subscribes a listener to a specific event, but the listener is removed after it is called once.
   *
   * @param type - The event type to subscribe to.
   * @param listener - The function to be called when the event is dispatched.
   * @returns A function that, when called, unsubscribes the listener.
   */
  once<T extends keyof TEvents>(
    type: T,
    listener: (...args: TEvents[T]) => void,
  ): () => void {
    const wrapper = (...args: TEvents[T]) => {
      this.off(type, wrapper);
      listener(...args);
    };
    return this.on(type, wrapper);
  }

  /**
   * Dispatches an event, invoking all subscribed listeners with the provided arguments.
   *
   * @param type - The event type to dispatch.
   * @param args - The arguments to pass to the listeners.
   */
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

  /**
   * Removes all listeners for all events.
   */
  removeAllListeners() {
    this.events = {};
  }
}
