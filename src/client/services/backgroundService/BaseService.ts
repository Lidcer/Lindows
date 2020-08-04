export abstract class BaseService {
  start(): void | Promise<void> {}
  destroy(): void | Promise<void> {}
}
