export interface ISettingsData {
  pivotTypes: Array<string>;
}

export class Settings {
  public pivotTypes: Array<string>;

  constructor(props?: ISettingsData) {
    this.pivotTypes = props?.pivotTypes || ['entity'];
  }

  hasPivotType(type: string) {
    return this.pivotTypes.includes(type);
  }

  toJSON() {
    return {
      pivotTypes: this.pivotTypes,
    };
  }

  static fromJSON(data: ISettingsData): Settings {
    return new Settings(data);
  }
}
