function endOfMonth(year: number, month: number): number {
  // Months in ECMAScript are zero-based:
  // new Date(2000, 0, 1) // Jan 1st
  //
  // Setting the day to zero will return the last day of the previous month:
  // new Date(2000, 1, 0) // Jan 31st
  // new Date(2000, 12, 0) // Dec 31st
  const date = new Date(year, month, 0);

  return date.getDate();
}

/**
 * FollowTheMoney allows dates with different degress of precision, e.g. `2022`,
 * `2022-01`, and `2022-01-01` are all valid dates. This class parses FtM date strings
 * and provides utility methods to work with imprecise dates, e.g. to get the earliest
 * or latest possible date.
 */
class ImpreciseDate {
  readonly year?: number;
  readonly month?: number;
  readonly day?: number;

  constructor(raw: string) {
    const yearRegex = /(?<year>\d{4})/.source;
    const monthRegex = /(?<month>0?[1-9]|1[0-2])/.source;
    const dayRegex = /(?<day>0?[1-9]|[1-2][0-9]|3[0-1])/.source;

    const regex = new RegExp(
      `^${yearRegex}(?:-${monthRegex}(?:-${dayRegex})?)?$`
    );

    const result = regex.exec(raw);
    const groups = result?.groups;

    if (!groups) {
      return;
    }

    this.year = groups.year ? parseInt(groups.year, 10) : undefined;
    this.month = groups.month ? parseInt(groups.month, 10) : undefined;
    this.day = groups.day ? parseInt(groups.day, 10) : undefined;
  }

  isValid(): boolean {
    if (!this.year) {
      return false;
    }

    if (
      this.month &&
      this.day &&
      endOfMonth(this.year, this.month) < this.day
    ) {
      return false;
    }

    return true;
  }

  getEarliest(): Date | undefined {
    if (!this.isValid() || !this.year) {
      return;
    }

    return new Date(this.year, this.month ? this.month - 1 : 0, this.day || 1);
  }

  getLatest(): Date | undefined {
    if (!this.isValid() || !this.year) {
      return;
    }

    const month = this.month || 12;
    const day = this.day || endOfMonth(this.year, month);

    return new Date(this.year, month - 1, day);
  }
}

export { ImpreciseDate };
