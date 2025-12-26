/**
 * A class representing a duty cycle, which alternates between an "off" state and an "on" state.
 */
export class DutyCycle {
  private offTime: number;
  private onTime: number;

  /**
   * Creates a new instance of `DutyCycle`.
   *
   * @param options - The configuration for the duty cycle.
   * @param options.every - The duration of the "off" state.
   * @param options.for - The duration of the "on" state.
   */
  constructor(options: { every: number; for: number }) {
    this.offTime = options.every;
    this.onTime = options.for;
  }

  /**
   * Checks if the duty cycle is in the "on" state at a given time.
   *
   * @param currentTime - The current time to check.
   * @returns `true` if the cycle is in the "on" state, `false` otherwise.
   */
  isOn(currentTime: number): boolean {
    const cycleTime = this.offTime + this.onTime;
    const timeInCycle = currentTime % cycleTime;

    return timeInCycle >= this.offTime;
  }
}
