export abstract class GlobalAudioPool<T = any> {
  abstract get(src: string): readonly [T, Promise<void>];

  protected abstract playInstant(
    src: string,
    options: {
      offset: number;
      volume: number;
    }
  ): void;

  async play(
    src: string,
    {
      offset = 0,
      volume = 100,
    }: {
      offset?: number | (() => number);
      volume?: number | (() => number);
    } = {}
  ) {
    const [_, promise] = this.get(src);

    await promise;

    offset = typeof offset === "function" ? offset() : offset;
    volume = typeof volume === "function" ? volume() : volume;

    this.playInstant(src, { offset, volume });
  }
}
