import { HOUR } from "../../shared/constants";

export class SpamProtector {
  private resetTime = HOUR;
  private maxAttempts = 3;
  private ip = new Map<string, number>();

  constructor(maxAttempts?: number, resetTime?: number) {
    if (resetTime) this.resetTime = HOUR;
    if (maxAttempts) this.maxAttempts = maxAttempts;
  }

  // return true if ip is under limit
  addIP(ip: string): boolean {
    let counter = this.ip.get(ip);
    if (Number.isInteger(counter)) {
      const returnState = counter < this.maxAttempts;
      this.ip.set(ip, ++counter);
      this.resetIP(ip);
      return returnState;
    } else {
      this.ip.set(ip, 0);
      this.resetIP(ip);
      return true;
    }
  }

  private resetIP(ip: string) {
    setTimeout(() => {
      let counter = this.ip.get(ip);
      if (Number.isInteger(counter)) {
        --counter;
        if (counter <= 0) return this.ip.delete(ip);
        else this.ip.set(ip, counter);
      }
    }, this.resetTime);
  }
}
