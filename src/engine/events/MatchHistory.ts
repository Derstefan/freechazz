import { DrawEvent } from './DrawEvent';
import type { Event } from './Event';

class HistoryState {
  drawEvent: DrawEvent = new DrawEvent();
}

export class MatchHistory {
  private historyStates: HistoryState[] = [];

  constructor() {
    this.addState(); // add first state
  }

  addEvent(event: Event): void {
    this.getLastDraw()!.addEvent(event);
  }

  addState(): void {
    this.historyStates.push(new HistoryState());
  }

  getLastDraw(): DrawEvent | null {
    const state = this.getLastState();
    return state ? state.drawEvent : null;
  }

  getDraw(index: number): DrawEvent | null {
    const state = this.getHistoryState(index);
    return state ? state.drawEvent : null;
  }

  removeLastState(): void {
    if (this.historyStates.length > 0) {
      this.historyStates.pop();
    }
  }

  getLastState(): HistoryState | null {
    if (this.historyStates.length > 0) {
      return this.historyStates[this.historyStates.length - 1];
    }
    return null;
  }

  getHistoryState(index: number): HistoryState | null {
    if (this.historyStates.length > index) {
      return this.historyStates[index];
    }
    return null;
  }

  getStateCount(): number {
    return this.historyStates.length;
  }

  copy(): MatchHistory {
    const copy = new MatchHistory();
    return copy;
  }
}
