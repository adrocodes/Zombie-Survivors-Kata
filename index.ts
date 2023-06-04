interface Component {}

export class Entity {
  static _id: number = 0;

  public id: number;
  public components: Set<Component> = new Set<Component>();

  constructor() {
    this.id = Entity._id++;
  }
  
  public add(component: Component): Entity {
    this.components.add(component);
    return this
  }

  public remove(component: Component) {
    this.components.delete(component);
  }

  public has(component: Function) {
    return [...this.components].some(c => c instanceof component)
  }

  public get(component: Function) {
    return [...this.components].find(c => c instanceof component)
  }
}

export class NameComponent implements Component {
  constructor(public name: string) {}
}

export class WoundComponent implements Component {
  constructor(public value: number, public max: number) {}
}

export class WoundSystem {
  static update(entity: Entity) {
    const wound = entity.get(WoundComponent) as (WoundComponent | undefined);
    if (!wound) return;

    wound.value = Math.min(wound.max, wound.value + 1);
  }
}

export class AliveComponent implements Component {
  constructor(public alive: boolean) {}
}

export class Survivor extends Entity {
  public static actionsPerTurn = 3;
  public actionsRemaining = Survivor.actionsPerTurn;

  constructor(name: string) {
    super();
    this
      .add(new NameComponent(name))
      .add(new WoundComponent(0, 2))
      .add(new AliveComponent(true));
  }

  get isAlive() {
    return (this.get(AliveComponent) as AliveComponent).alive;
  }
}

export class SurvivorSystem {
  static update(entity: Survivor) {
    const wound = entity.get(WoundComponent) as WoundComponent;
    const alive = entity.get(AliveComponent) as AliveComponent;

    // Survivor is dead
    if (!alive.alive) return;

    // Kill Survivor if wounds are too high
    if (wound.value >= wound.max) {
      alive.alive = false;
      return;
    }
  }

  static startTurn(entity: Survivor) {
    entity.actionsRemaining = Survivor.actionsPerTurn;
  }

  static performAction(entity: Survivor) {
    if (entity.actionsRemaining <= 0 || !entity.isAlive) return;
    entity.actionsRemaining--;
  }
}
