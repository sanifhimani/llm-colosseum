export class BaseAgent {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.model = config.model;
    this.provider = config.provider;
  }

  async call(_prompt, _options) {
    throw new Error(`${this.constructor.name}.call() not implemented`);
  }
}
