/**
 * An abstract class representing a global audio pool for managing and playing audio resources.
 *
 * @typeParam T - The type of the audio resource (e.g., HTMLAudioElement).
 */
export abstract class GlobalAudioPool<T = any> {
  /**
   * Retrieves an audio resource and a promise that resolves when the resource is ready.
   *
   * @param src - The source URL of the audio.
   * @returns A tuple containing the audio resource and a promise that resolves when it's ready.
   */
  abstract get(src: string): readonly [T, Promise<void>];

  /**
   * Plays the audio instantly with the specified options.
   * This method should be implemented by subclasses to handle the actual playback logic.
   *
   * @param src - The source URL of the audio.
   * @param options - The playback options.
   * @param options.offset - The starting offset in seconds.
   * @param options.volume - The volume level (0-100).
   */
  protected abstract playInstant(
    src: string,
    options: {
      offset: number;
      volume: number;
    },
  ): void;

  /**
   * Plays the audio, waiting for it to be ready if necessary.
   *
   * @param src - The source URL of the audio.
   * @param options - The playback options.
   * @param options.offset - The starting offset in seconds, or a function returning it. Defaults to 0.
   * @param options.volume - The volume level (0-100), or a function returning it. Defaults to 100.
   */
  async play(
    src: string,
    {
      offset = 0,
      volume = 100,
    }: {
      offset?: number | (() => number);
      volume?: number | (() => number);
    } = {},
  ) {
    const [_, promise] = this.get(src);

    await promise;

    offset = typeof offset === "function" ? offset() : offset;
    volume = typeof volume === "function" ? volume() : volume;

    this.playInstant(src, { offset, volume });
  }
}
