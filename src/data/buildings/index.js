export const ALL_BUILDINGS = [
    // Town Center
    { id: 'town_center', name: 'Town Center', hp: 2400, size: 4, cost: { food: 0, wood: 275, gold: 0, stone: 100 }, buildTime: 150, spriteId: 'town_center', trainableUnitIds: ['villager'] },
    // Military
    { id: 'barracks', name: 'Barracks', hp: 1200, size: 3, cost: { food: 0, wood: 175, gold: 0, stone: 0 }, buildTime: 50, spriteId: 'barracks', trainableUnitIds: ['militia', 'man_at_arms', 'long_swordsman', 'two_handed_swordsman', 'champion', 'spearman', 'pikeman', 'halberdier', 'eagle_scout', 'eagle_warrior', 'elite_eagle_warrior'] },
    { id: 'archery_range', name: 'Archery Range', hp: 1200, size: 3, cost: { food: 0, wood: 175, gold: 0, stone: 0 }, buildTime: 50, spriteId: 'archery_range', trainableUnitIds: ['archer', 'crossbowman', 'arbalest', 'skirmisher', 'elite_skirmisher', 'hand_cannoneer', 'cavalry_archer', 'heavy_cavalry_archer'] },
    { id: 'stable', name: 'Stable', hp: 1200, size: 3, cost: { food: 0, wood: 175, gold: 0, stone: 0 }, buildTime: 50, spriteId: 'stable', trainableUnitIds: ['scout_cavalry', 'light_cavalry', 'hussar', 'knight', 'cavalier', 'paladin', 'camel_rider', 'heavy_camel_rider', 'imperial_camel_rider'] },
    { id: 'siege_workshop', name: 'Siege Workshop', hp: 1200, size: 3, cost: { food: 0, wood: 200, gold: 0, stone: 0 }, buildTime: 50, spriteId: 'siege_workshop', trainableUnitIds: ['battering_ram', 'capped_ram', 'siege_ram', 'mangonel', 'onager', 'siege_onager', 'scorpion', 'heavy_scorpion', 'bombard_cannon', 'trebuchet', 'petard'] },
    { id: 'castle', name: 'Castle', hp: 4800, size: 4, cost: { food: 0, wood: 0, gold: 0, stone: 650 }, buildTime: 200, spriteId: 'castle', trainableUnitIds: ['petard', 'trebuchet'] },
    // Economy
    { id: 'house', name: 'House', hp: 550, size: 2, cost: { food: 0, wood: 25, gold: 0, stone: 0 }, buildTime: 25, spriteId: 'house', trainableUnitIds: [] },
    { id: 'mill', name: 'Mill', hp: 1000, size: 2, cost: { food: 0, wood: 100, gold: 0, stone: 0 }, buildTime: 35, spriteId: 'mill', trainableUnitIds: [] },
    { id: 'mining_camp', name: 'Mining Camp', hp: 1000, size: 2, cost: { food: 0, wood: 100, gold: 0, stone: 0 }, buildTime: 35, spriteId: 'mining_camp', trainableUnitIds: [] },
    { id: 'lumber_camp', name: 'Lumber Camp', hp: 1000, size: 2, cost: { food: 0, wood: 100, gold: 0, stone: 0 }, buildTime: 35, spriteId: 'lumber_camp', trainableUnitIds: [] },
    { id: 'farm', name: 'Farm', hp: 1, size: 2, cost: { food: 0, wood: 60, gold: 0, stone: 0 }, buildTime: 15, spriteId: 'farm', trainableUnitIds: [] },
    { id: 'market', name: 'Market', hp: 2100, size: 3, cost: { food: 0, wood: 175, gold: 0, stone: 0 }, buildTime: 60, spriteId: 'market', trainableUnitIds: ['trade_cart'] },
    { id: 'dock', name: 'Dock', hp: 1800, size: 3, cost: { food: 0, wood: 150, gold: 0, stone: 0 }, buildTime: 40, spriteId: 'dock', trainableUnitIds: ['fishing_ship', 'transport_ship', 'galley', 'war_galley', 'galleon', 'fire_galley', 'fire_ship', 'fast_fire_ship', 'demolition_raft', 'demolition_ship', 'heavy_demolition_ship', 'cannon_galleon', 'elite_cannon_galleon'] },
    // Tech
    { id: 'blacksmith', name: 'Blacksmith', hp: 2100, size: 3, cost: { food: 0, wood: 150, gold: 0, stone: 0 }, buildTime: 40, spriteId: 'blacksmith', trainableUnitIds: [] },
    { id: 'university', name: 'University', hp: 2100, size: 3, cost: { food: 0, wood: 200, gold: 0, stone: 0 }, buildTime: 60, spriteId: 'university', trainableUnitIds: [] },
    { id: 'monastery', name: 'Monastery', hp: 2100, size: 3, cost: { food: 0, wood: 175, gold: 0, stone: 0 }, buildTime: 40, spriteId: 'monastery', trainableUnitIds: ['monk', 'missionary'] },
    // Defensive
    { id: 'watch_tower', name: 'Watch Tower', hp: 500, size: 1, cost: { food: 0, wood: 25, gold: 0, stone: 100 }, buildTime: 80, spriteId: 'watch_tower', trainableUnitIds: [] },
    { id: 'guard_tower', name: 'Guard Tower', hp: 1000, size: 1, cost: { food: 0, wood: 0, gold: 0, stone: 0 }, buildTime: 0, spriteId: 'guard_tower', trainableUnitIds: [] },
    { id: 'keep', name: 'Keep', hp: 2000, size: 1, cost: { food: 0, wood: 0, gold: 0, stone: 0 }, buildTime: 0, spriteId: 'keep', trainableUnitIds: [] },
    { id: 'bombard_tower', name: 'Bombard Tower', hp: 2000, size: 1, cost: { food: 0, wood: 0, gold: 0, stone: 0 }, buildTime: 0, spriteId: 'bombard_tower', trainableUnitIds: [] },
    { id: 'palisade_wall', name: 'Palisade Wall', hp: 250, size: 1, cost: { food: 0, wood: 2, gold: 0, stone: 0 }, buildTime: 5, spriteId: 'palisade_wall', trainableUnitIds: [] },
    { id: 'stone_wall', name: 'Stone Wall', hp: 1800, size: 1, cost: { food: 0, wood: 0, gold: 0, stone: 5 }, buildTime: 10, spriteId: 'stone_wall', trainableUnitIds: [] },
    { id: 'gate', name: 'Gate', hp: 3000, size: 1, cost: { food: 0, wood: 0, gold: 0, stone: 30 }, buildTime: 70, spriteId: 'gate', trainableUnitIds: [] },
    { id: 'wonder', name: 'Wonder', hp: 4800, size: 4, cost: { food: 0, wood: 1000, gold: 0, stone: 1000 }, buildTime: 900, spriteId: 'wonder', trainableUnitIds: [] },
];
export const BUILDING_MAP = new Map(ALL_BUILDINGS.map(b => [b.id, b]));
