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

export class EquipmentComponent implements Component {
  public inHandCapacity = 2;
  public inReserveCapacity = 3;

  constructor(public inHand: string[], public inReserve: string[]) {}

  public addInHand(item: string) {
    if (this.inHand.length >= this.inHandCapacity) return;
    this.inHand.push(item);
  }

  public removeInHand(item: string) {
    this.inHand = this.inHand.filter(i => i !== item);
  }

  public addInReserve(item: string) {
    if (this.inReserve.length >= this.inReserveCapacity) return;
    this.inReserve.push(item);
  }

  public removeInReserve(item: string) {
    this.inReserve = this.inReserve.filter(i => i !== item);
  }
}

export class EquipmentSystem {
  static equip(entity: Entity, item: string, hand: "inHand" | "inReserve") {
    const equipment = entity.get(EquipmentComponent) as (EquipmentComponent | undefined);

    if (!equipment) return;
    
    if (hand === "inHand") {
      equipment.addInHand(item);
    }

    if (hand === "inReserve") {
      equipment.addInReserve(item);
    }
  }

  static unequip(entity: Entity, item: string, hand: "inHand" | "inReserve") {
    const equipment = entity.get(EquipmentComponent) as (EquipmentComponent | undefined);

    if (!equipment) return;
    
    if (hand === "inHand") {
      equipment.removeInHand(item);
    }

    if (hand === "inReserve") {
      equipment.removeInReserve(item);
    }
  }
}

export class EquipmentCapacitySystem {
  static update(entity: Entity) {
    const equipment = entity.get(EquipmentComponent) as (EquipmentComponent | undefined);
    const wounds = entity.get(WoundComponent) as (WoundComponent | undefined);

    if (!equipment || !wounds) return;
    if (wounds.value === 0) return;

    const inHandCapacity = equipment.inHandCapacity;
    const inReserveCapacity = equipment.inReserveCapacity;

    if (inReserveCapacity > 0) {
      equipment.inReserveCapacity = Math.max(0, inReserveCapacity - wounds.value);

      if (equipment.inReserve.length > equipment.inReserveCapacity) {
        equipment.inReserve = equipment.inReserve.slice(0, equipment.inReserveCapacity);
      }
    }

    if (inHandCapacity > 0) {
      equipment.inHandCapacity = Math.max(0, inHandCapacity - wounds.value);

      if (equipment.inHand.length > equipment.inHandCapacity) {
        equipment.inHand = equipment.inHand.slice(0, equipment.inHandCapacity);
      }
    }
  }
}

export class ExperienceComponent implements Component {
  public value = 0;
  public level: "blue" | "yellow" | "orange" | "red" = "blue";
}

export class ExperienceSystem {
  static gain(entity: Entity, amount: number) {
    const experience = entity.get(ExperienceComponent) as (ExperienceComponent | undefined);

    if (!experience) return;

    experience.value += amount;
  }

  static levelUp(entity: Entity) {
    const experience = entity.get(ExperienceComponent) as (ExperienceComponent | undefined);

    if (!experience) return;

    if (experience.value >= 6) {
      experience.level = "yellow";
    }

    if (experience.value >= 18) {
      experience.level = "orange";
    }

    if (experience.value >= 42) {
      experience.level = "red";
    }
  }
}

export class Survivor extends Entity {
  public static actionsPerTurn = 3;
  public actionsRemaining = Survivor.actionsPerTurn;

  constructor(name: string) {
    super();
    this
      .add(new NameComponent(name))
      .add(new WoundComponent(0, 2))
      .add(new AliveComponent(true))
      .add(new EquipmentComponent([], []))
      .add(new ExperienceComponent());
  }

  get isAlive() {
    return (this.get(AliveComponent) as AliveComponent).alive;
  }

  public kill() {
    ExperienceSystem.gain(this, 1);
    ExperienceSystem.levelUp(this);
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

export class Game extends Entity {
  public survivors: Survivor[] = []

  constructor() {
    super()
    this.add(new ExperienceComponent());
  }

  public addSurvivor(survivor: Survivor) {
    const newName = survivor.get(NameComponent) as NameComponent;
    const existingSurvivor = this.survivors.some((value) => {
      const name = value.get(NameComponent) as NameComponent;
      return name.name === newName.name;
    })

    if (existingSurvivor) return

    this.survivors.push(survivor);
  }

  public get isGameOver() {
    return this.survivors.every(s => !s.isAlive);
  }

  public levelUp() {
    const highestExperience = this.survivors.reduce((highest, survivor) => {
      const experience = survivor.get(ExperienceComponent) as ExperienceComponent;
      return Math.max(highest, experience.value);
    }, 0)

    ExperienceSystem.gain(this, highestExperience);
    ExperienceSystem.levelUp(this);
  }
}
