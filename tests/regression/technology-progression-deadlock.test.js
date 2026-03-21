const { test, expect } = require('../fixtures/coverage');
const { importStageSnapshot } = require('../fixtures/stage-helpers');

// Bug: 多条高阶科技线曾要求尚未可生产的资源，导致量子、反物质、时间线出现死锁。
// Root Cause: 科技成本与建筑解锁门槛互相卡住，玩家无法沿正常流程推进。
// Expected: 每条科技线都能先研究科技，再解锁对应生产建筑，不再要求自身尚未可得的资源。

async function researchTechnology(page, techId) {
  return page.evaluate((targetTechId) => {
    const techsBefore = window.rustGame.get_technologies();
    const before = techsBefore.find((tech) => tech.id === targetTechId);
    const success = window.rustGame.research_technology(targetTechId);
    const techsAfter = window.rustGame.get_technologies();
    const after = techsAfter.find((tech) => tech.id === targetTechId);

    return {
      success,
      beforeResearched: Boolean(before && (before.purchased || before.researched)),
      afterResearched: Boolean(after && (after.purchased || after.researched)),
      buildings: window.rustGame.get_buildings().map((building) => building.name),
    };
  }, techId);
}

test.describe('technology progression deadlock regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForFunction(() => window.gameInitialized === true);
  });

  test('AI technology can unlock quantum computing without requiring quantum computers first', async ({ page }) => {
    await importStageSnapshot(page, {
      stage: 'Collective',
      resources: {
        Gold: 120000,
        Microchip: 1200,
        CircuitBoard: 1200,
        Plastic: 400,
        Crystal: 1200,
        QuantumComputer: 0,
      },
      technologies: [
        'Electronics',
        'AdvancedElectronics',
        'Robotics',
        'ComputerTechnology',
      ],
    });

    const before = await page.evaluate(() => ({
      quantumComputers: window.rustGame.get_resources().QuantumComputer || 0,
      buildingNames: window.rustGame.get_buildings().map((building) => building.name),
    }));

    expect(before.quantumComputers).toBe(0);
    expect(before.buildingNames).not.toContain('量子计算中心');

    const aiResult = await researchTechnology(page, 'AITechnology');
    expect(aiResult.success).toBe(true);
    expect(aiResult.beforeResearched).toBe(false);
    expect(aiResult.afterResearched).toBe(true);

    const quantumResult = await researchTechnology(page, 'QuantumComputing');
    expect(quantumResult.success).toBe(true);
    expect(quantumResult.afterResearched).toBe(true);
    expect(quantumResult.buildings).toContain('量子计算中心');
  });

  test('antimatter energy unlocks its producer without already owning antimatter', async ({ page }) => {
    await importStageSnapshot(page, {
      stage: 'Collective',
      resources: {
        Gold: 500000,
        QuantumComputer: 400,
        Generator: 400,
        Antimatter: 0,
      },
      technologies: [
        'Electronics',
        'AdvancedElectronics',
        'ComputerTechnology',
        'AITechnology',
        'QuantumComputing',
        'AdvancedSmelting',
        'RenewableEnergy',
        'NuclearEnergy',
        'FusionEnergy',
      ],
    });

    const before = await page.evaluate(() => ({
      antimatter: window.rustGame.get_resources().Antimatter || 0,
      buildingNames: window.rustGame.get_buildings().map((building) => building.name),
    }));

    expect(before.antimatter).toBe(0);
    expect(before.buildingNames).not.toContain('反物质反应堆');

    const antimatterResult = await researchTechnology(page, 'AntimatterEnergy');
    expect(antimatterResult.success).toBe(true);
    expect(antimatterResult.afterResearched).toBe(true);
    expect(antimatterResult.buildings).toContain('反物质反应堆');
  });

  test('time manipulation unlocks time crystals after antimatter progression instead of requiring them upfront', async ({ page }) => {
    await importStageSnapshot(page, {
      stage: 'Collective',
      resources: {
        Gold: 1500000,
        QuantumComputer: 800,
        Antimatter: 200,
        TimeCrystal: 0,
      },
      technologies: [
        'Electronics',
        'AdvancedElectronics',
        'ComputerTechnology',
        'AITechnology',
        'QuantumComputing',
        'AdvancedSmelting',
        'RenewableEnergy',
        'NuclearEnergy',
        'FusionEnergy',
        'AntimatterEnergy',
      ],
    });

    const before = await page.evaluate(() => ({
      timeCrystal: window.rustGame.get_resources().TimeCrystal || 0,
      buildingNames: window.rustGame.get_buildings().map((building) => building.name),
    }));

    expect(before.timeCrystal).toBe(0);
    expect(before.buildingNames).not.toContain('时间水晶合成器');

    const timeResult = await researchTechnology(page, 'TimeManipulation');
    expect(timeResult.success).toBe(true);
    expect(timeResult.afterResearched).toBe(true);
    expect(timeResult.buildings).toContain('时间水晶合成器');
  });
});
