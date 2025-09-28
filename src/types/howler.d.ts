declare module 'howler' {
  export class Howl {
    constructor(opts: any);
    play(): number;
    stop(): void;
    pause(): void;
    mute(v: boolean): void;
    unload(): void;
    loop(v?: boolean): boolean | void;
    volume(v?: number): number | void;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    off(event?: string, listener?: (...args: any[]) => void): this;
    playing(id?: number): boolean;
  }
}
