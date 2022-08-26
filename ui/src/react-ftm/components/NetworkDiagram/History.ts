import { IGraphLayoutData } from './layout';
import { EntityChanges } from 'react-ftm/components/common/types';

interface IHistoryObject {
  layout: IGraphLayoutData;
  entityChanges?: EntityChanges;
}

export class History {
  static BACK = -1;
  static FORWARD = 1;
  isPooling = false;
  stack: Array<IHistoryObject> = [];
  current?: IHistoryObject;
  state = 0;

  push(item: IHistoryObject) {
    if (this.isPooling) return undefined;
    this.stack.splice(this.state + 1, this.stack.length, item);
    this.state = this.stack.length - 1;
    this.current = this.stack[this.state];
  }

  // entity mutations are stored alongside their resulting layout (in the forward direction)
  go(factor: number): IHistoryObject {
    const nextPossibleState = (this.state += factor);
    const currState = this.state;
    let nextState;
    let entityChanges;

    if (factor > 0) {
      nextState = Math.min(nextPossibleState, this.stack.length - 1);
      entityChanges = this.stack[nextState].entityChanges;
    } else {
      nextState = Math.max(nextPossibleState, 0);
      entityChanges = this.stack[currState + 1].entityChanges;
    }

    this.state = nextState;
    this.current = this.stack[this.state];
    return { layout: this.current.layout, entityChanges };
  }

  getRevertedDistance(): number {
    return this.stack.length - this.state;
  }

  canGoTo(factor: number): boolean {
    const nextPossibleState = this.state + factor;
    if (!factor) {
      return true;
    } else if (factor > 0) {
      return nextPossibleState <= this.stack.length - 1;
    } else {
      return nextPossibleState >= 0;
    }
  }

  back() {
    return this.go(History.BACK);
  }

  forward() {
    return this.go(History.FORWARD);
  }
}
