import { IS_DEV } from "./config";

export function attachDebugMethod(value: string, method: any) {
  if (IS_DEV) {
    (global as any)[value] = method;
  }
}
