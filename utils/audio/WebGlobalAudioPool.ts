import { GlobalAudioPool } from "@/core/utils/audio/GlobalAudioPool";

export class WebGlobalAudioPool extends GlobalAudioPool<HTMLAudioElement> {
  private audios: Record<string, HTMLAudioElement> = {};
  private promises: Record<string, Promise<void>> = {};

  hasSource(src: string) {
    return src in this.audios;
  }

  get(src: string) {
    if (!this.hasSource(src)) this.load(src);

    return [this.audios[src], this.promises[src]] as const;
  }

  protected playInstant(
    src: string,
    { offset, volume }: { offset: number; volume: number }
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
