export class DutyCycle {
  private offTime: number;
  private onTime: number;

  constructor(options: { every: number; for: number }) {
    this.offTime = options.every;
    this.onTime = options.for;
  }

  isOn(currentTime: number): boolean {
    const cycleTime = this.offTime + this.onTime;
    const timeInCycle = currentTime % cycleTime;

    return timeInCycle >= this.offTime;
  }
}
