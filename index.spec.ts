import { describe, expect, test } from "vitest"
import { AliveComponent, EquipmentCapacitySystem, EquipmentComponent, EquipmentSystem, ExperienceComponent, ExperienceSystem, Game, Survivor, SurvivorSystem, WoundComponent, WoundSystem } from ".";

describe("Wounds", () => {
  test("Entity starts with 0 wounds", () => {
    const survivor = new Survivor("Bob");
    expect((survivor.get(WoundComponent) as WoundComponent).value).toBe(0);
  })

  test("Entity can take wounds", () => {
    const survivor = new Survivor("Bob");
    WoundSystem.update(survivor);

    expect((survivor.get(WoundComponent) as WoundComponent).value).toBe(1);
  })

  test("Entity can take multiple wounds", () => {
    const survivor = new Survivor("Bob");
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);

    expect((survivor.get(WoundComponent) as WoundComponent).value).toBe(2);
  })

  test("Entity cannot take more wounds than max", () => {
    const survivor = new Survivor("Bob");
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);

    expect((survivor.get(WoundComponent) as WoundComponent).value).toBe(2);
  })
})

describe("Survivor", () => {
  test("Survivor starts alive", () => {
    const survivor = new Survivor("Bob");
    expect(survivor.get(AliveComponent)).toBeDefined();
  })

  test("Survivor can die", () => {
    const survivor = new Survivor("Bob");
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    SurvivorSystem.update(survivor);

    expect(survivor.isAlive).toBe(false);
  })

  test("Survivor can take actions", () => {
    const survivor = new Survivor("Bob");
    SurvivorSystem.startTurn(survivor);
    SurvivorSystem.performAction(survivor);

    expect(survivor.actionsRemaining).toBe(2);
  })

  test("Survivor can take multiple actions", () => {
    const survivor = new Survivor("Bob");
    SurvivorSystem.startTurn(survivor);
    SurvivorSystem.performAction(survivor);
    SurvivorSystem.performAction(survivor);

    expect(survivor.actionsRemaining).toBe(1);
  })

  test("Survivor cannot take more actions than allowed", () => {
    const survivor = new Survivor("Bob");
    SurvivorSystem.startTurn(survivor);
    SurvivorSystem.performAction(survivor);
    SurvivorSystem.performAction(survivor);
    SurvivorSystem.performAction(survivor);
    SurvivorSystem.performAction(survivor);

    expect(survivor.actionsRemaining).toBe(0);
  })

  test("Survivor gains 1 exp for a kill", () => {
    const survivor = new Survivor("Bob");
    survivor.kill();

    expect((survivor.get(ExperienceComponent) as ExperienceComponent).value).toBe(1);
  })
})

describe("Equipment", () => {
  test("Can add/remove in hand equipment", () => {
    const equip = new EquipmentComponent([], []);
    equip.addInHand("Knife");
    equip.addInHand("Pistol");
    equip.removeInHand("Knife");

    expect(equip.inHand).toEqual(["Pistol"]);
  })

  test("Can add/remove in reserve equipment", () => {
    const equip = new EquipmentComponent([], []);
    equip.addInReserve("Knife");
    equip.addInReserve("Pistol");
    equip.removeInReserve("Knife");

    expect(equip.inReserve).toEqual(["Pistol"]);
  })

  test("Capacity is reduced when taking wounds", () => {
    const survivor = new Survivor("Bob");
    const equip = survivor.get(EquipmentComponent) as EquipmentComponent;

    EquipmentSystem.equip(survivor, "Knife", "inReserve");
    EquipmentSystem.equip(survivor, "Water Bottle", "inReserve");
    EquipmentSystem.equip(survivor, "Frying Pan", "inReserve");

    WoundSystem.update(survivor);

    EquipmentCapacitySystem.update(survivor);

    expect(equip.inReserveCapacity).toBe(2);
    expect(equip.inReserve).toEqual(["Knife", "Water Bottle"]);
  })
})

describe("Game", () => {
  test("Can add survivor to game", () => {
    const survivor = new Survivor("Bob");
    const game = new Game();

    game.addSurvivor(survivor);

    expect(game.survivors).toContain(survivor);
  })

  test("Survivors must have unique names", () => {
    const survivor = new Survivor("Bob");
    const game = new Game();

    game.addSurvivor(survivor);
    game.addSurvivor(survivor);

    expect(game.survivors).toEqual([survivor]);
  })

  test("Game is over when all survivors are dead", () => {
    const survivor = new Survivor("Bob");
    const game = new Game();

    game.addSurvivor(survivor);
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    SurvivorSystem.update(survivor);

    expect(game.isGameOver).toBe(true);
  })

  test("Game level matches highest survivor", () => {
    const survivor = new Survivor("Bob");
    const survivor2 = new Survivor("Alice");
    const game = new Game();

    game.addSurvivor(survivor);
    game.addSurvivor(survivor2);
    ExperienceSystem.gain(survivor, 6);
    ExperienceSystem.levelUp(survivor);

    game.levelUp()

    const gameExp = game.get(ExperienceComponent) as ExperienceComponent;

    expect(gameExp.level).toBe("yellow");
  })
})

describe("Experience", () => {
  test("Experience stats with 0 and level blue", () => {
    const exp = new ExperienceComponent()

    expect(exp.value).toBe(0);
    expect(exp.level).toBe("blue");
  })

  test("levels up to yellow at 6 experience", () => {
    const survivor = new Survivor("Bob");
    ExperienceSystem.gain(survivor, 6);
    ExperienceSystem.levelUp(survivor);

    const exp = survivor.get(ExperienceComponent) as ExperienceComponent;

    expect(exp.level).toBe("yellow");
  })

  test("levels up to orange at 18 experience", () => {
    const survivor = new Survivor("Bob");
    ExperienceSystem.gain(survivor, 18);
    ExperienceSystem.levelUp(survivor);

    const exp = survivor.get(ExperienceComponent) as ExperienceComponent;

    expect(exp.level).toBe("orange");
  })

  test("levels up to red at 42 experience", () => {
    const survivor = new Survivor("Bob");
    ExperienceSystem.gain(survivor, 42);
    ExperienceSystem.levelUp(survivor);

    const exp = survivor.get(ExperienceComponent) as ExperienceComponent;

    expect(exp.level).toBe("red");
  })
})

describe("GameEventLog", () => {
  test("Can add event to log", () => {
    const survivor = new Survivor("Bob");
    const game = new Game();

    game.addSurvivor(survivor);
    WoundSystem.update(survivor);

    EquipmentSystem.equip(survivor, "Knife", "inReserve");

    ExperienceSystem.gain(survivor, 6);
    ExperienceSystem.levelUp(survivor);
    game.levelUp()

    WoundSystem.update(survivor);
    WoundSystem.update(survivor);
    SurvivorSystem.update(survivor);

    game.isGameOver

    expect(game.logs).toContain("Game started")
    expect(game.logs).toContain("[Bob]: Joined the game")
    expect(game.logs).toContain("[Bob]: Took a wound")
    expect(game.logs).toContain("[Bob]: Equipped Knife")
    expect(game.logs).toContain("[Bob]: Died")
    expect(game.logs).toContain("[Bob]: Leveled up to yellow")
    expect(game.logs).toContain("[Zombicide]: Leveled up to yellow")
    expect(game.logs).toContain("[Zombicide]: Game over")
  })
})
