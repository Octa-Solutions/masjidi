import { GlobalAudioPool } from "@/utils/audio/GlobalAudioPool";

/**
 * A concrete implementation of `GlobalAudioPool` for the web environment using `HTMLAudioElement`.
 */
export class WebGlobalAudioPool extends GlobalAudioPool<HTMLAudioElement> {
  private audios: Record<string, HTMLAudioElement> = {};
  private promises: Record<string, Promise<void>> = {};

  /**
   * Checks if the audio source is already loaded in the pool.
   *
   * @param src - The source URL of the audio.
   * @returns `true` if the source exists, `false` otherwise.
   */
  hasSource(src: string) {
    return src in this.audios;
  }

  /**
   * Retrieves the `HTMLAudioElement` and its loading promise for the given source.
   * If the source is not loaded, it initiates the loading process.
   *
   * @param src - The source URL of the audio.
   * @returns A tuple containing the `HTMLAudioElement` and a promise that resolves when metadata is loaded.
   */
  get(src: string) {
    if (!this.hasSource(src)) this.load(src);

    return [this.audios[src], this.promises[src]] as const;
  }

  protected playInstant(
    src: string,
    { offset, volume }: { offset: number; volume: number },
  ) {
    const [audio, _] = this.get(src);

    if (offset < 0 || offset >= audio.duration) return;

    audio.currentTime = offset;
    audio.volume = volume / 100;
    audio.play();
  }

  private load(src: string) {
    this.audios[src] = new Audio(src);

    this.promises[src] = new Promise<void>((resolve, reject) => {
      const removeHandlers = () => {
        this.audios[src].removeEventListener("loadedmetadata", loadHandler);
        this.audios[src].removeEventListener("error", errorHandler);
      };

      const loadHandler = () => {
        removeHandlers();
        resolve();
      };

      const errorHandler = (err: ErrorEvent) => {
        removeHandlers();
        reject(err);
      };

      this.audios[src].addEventListener("loadedmetadata", loadHandler, {
        once: true,
      });
      this.audios[src].addEventListener("error", errorHandler, {
        once: true,
      });
    });
  }
}
