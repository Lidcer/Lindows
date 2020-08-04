export abstract class BaseSystemService {
  start(): void | Promise<void> {}
  destroy(): void | Promise<void> {}
  get ok(): boolean {
    return true;
  }
}
