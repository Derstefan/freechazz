import type { Event } from './Event';

export class DrawEvent {
  private events: Event[] = [];

  addEvent(event: Event): void {
    this.events.push(event);
  }

  getEvents(): Event[] {
    return this.events;
  }

  getLastEvent(): Event | null {
    if (this.events.length > 0) {
      return this.events[this.events.length - 1];
    }
    return null;
  }

  removeLastEvent(): void {
    if (this.events.length > 0) {
      this.events.pop();
    }
  }

  getEventCount(): number {
    return this.events.length;
  }
}
