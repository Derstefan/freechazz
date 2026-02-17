import { Connector } from '../connector/Connector';

export abstract class Act {
  connector: Connector | null = null;

  getConnector(): Connector | null {
    return this.connector;
  }

  setConnector(connector: Connector | null): void {
    this.connector = connector;
  }

  createConnector(): Connector {
    this.connector = new Connector(this);
    return this.connector;
  }

  toString(): string {
    return this.constructor.name;
  }
}
