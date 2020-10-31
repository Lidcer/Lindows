export class Collection<A, B> extends Map<A, B> {
  find(predicate: (item: B) => boolean): B | null {
    if (!predicate) return null;
    for (const [_, item] of this) {
      if (predicate(item)) {
        return item;
      }
    }
    return null;
  }
  filter(predicate: (item: B) => boolean): B[] {
    const arry: B[] = [];
    if (!predicate) return arry;
    for (const [_, item] of this) {
      if (predicate(item)) {
        arry.push(item);
      }
    }
    return arry;
  }
  map<D = any>(callback: (item: B, index: number) => D): D[] {
    const arry: D[] = [];
    if (!callback) return arry;
    let i = 0;
    for (const [_, item] of this) {
      arry.push(callback(item, i++));
    }
    return arry;
  }
}
