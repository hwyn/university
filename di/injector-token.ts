export class InjectorToken<T = any> {
  static get(_desc: string): InjectorToken {
    return new InjectorToken(_desc);
  }

  constructor(protected _desc: string) { }

  toString(): string {
    return `Token ${this._desc}`;
  }
}
