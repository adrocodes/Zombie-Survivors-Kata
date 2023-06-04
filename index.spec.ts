import { describe, expect, test } from "vitest"
import { AliveComponent, EquipmentCapacitySystem, EquipmentComponent, EquipmentSystem, Survivor, SurvivorSystem, WoundComponent, WoundSystem } from ".";

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
