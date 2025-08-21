// --- Game Configuration & Master Data ---

// Supabase credentials
export const SUPABASE_URL = 'https://yqnyinreoamegbahoxzq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbnlpbnJlb2FtZWdiYWhveHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzgxNjMsImV4cCI6MjA3MDcxNDE2M30.GjzEs-MNYlk1JUncO_A4wimYdD6JXfiqKZvI1ugR47o';

// The number of characters to display per page
export const PAGE_SIZE = 12;

// URLs for battle background images
export const battleBackgrounds = [
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/producerbp-1-2022-10-24.jpg',
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/producerbp-1-2021-02-16.jpg',
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/producerbp-1-2020-06-10.jpg',
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/producerbp-1-2019-07-26.jpg',
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/producerbp-1-2019-03-13.jpg',
    'https://yqnyinreoamegbahoxzq.supabase.co/storage/v1/object/public/battle_images/2021-pokemon-battle-pokemon-unite-online-video-game-wallpaper-2560x1600-74929_7.jpg'
];

// Type effectiveness chart
export const typeChart = { Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 }, Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 }, Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 }, Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 }, Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 }, Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 }, Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Darkness: 2, Steel: 2, Fairy: 0.5 }, Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 }, Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 }, Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 }, Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Darkness: 2, Steel: 0.5 }, Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Darkness: 2, Steel: 0.5, Fairy: 0.5 }, Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 }, Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Darkness: 0.5, Light: 2 }, Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 }, Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2, Light: 0.5 }, Fairy: { Fighting: 2, Poison: 0.5, Dragon: 2, Darkness: 2, Steel: 0.5 }, Light: { Ghost: 2, Darkness: 2, Grass: 0.5, Steel: 0.5, Fire: 0.5 }, Darkness: { Psychic: 2, Ghost: 2, Light: 2, Fighting: 0.5, Fairy: 0.5 } };

// Korean translations for types
export const typeTranslations = { Normal: '노말', Fire: '불꽃', Water: '물', Electric: '전기', Grass: '풀', Ice: '얼음', Fighting: '격투', Poison: '독', Ground: '땅', Flying: '비행', Psychic: '에스퍼', Bug: '벌레', Rock: '바위', Ghost: '고스트', Dragon: '드래곤', Darkness: '악', Steel: '강철', Fairy: '페어리', Light: '빛' };

// Master list of all available skills in the game
export const MASTER_SKILL_LIST = {
    // Damage
    'DMG_PHY_S': { type: 'damage', category: 'Physical', power: 40, text: '기본 물리 공격' },
    'DMG_SPE_S': { type: 'damage', category: 'Special', power: 40, text: '기본 특수 공격' },
    'DMG_PHY_M': { type: 'damage', category: 'Physical', power: 80, text: '강한 물리 공격' },
    'DMG_SPE_M': { type: 'damage', category: 'Special', power: 80, text: '강한 특수 공격' },
    'DMG_PHY_L': { type: 'damage', category: 'Physical', power: 120, text: '매우 강한 물리 공격' },
    'DMG_SPE_L': { type: 'damage', category: 'Special', power: 120, text: '매우 강한 특수 공격' },
    // High-Risk High-Reward
    'DMG_PHY_XL_RECOIL': { type: 'damage', category: 'Physical', power: 150, recoil: 0.33, text: '초강력 물리 공격, 준 데미지의 33%를 반동 데미지로 받음' },
    'DMG_SPE_DEBUFF_SELF': { type: 'damage', category: 'Special', power: 140, selfDebuff: { stat: 'sp_atk', amount: 0.75, turns: 99 }, text: '초강력 특수 공격, 사용 후 자신의 특공이 영구히 하락' },
    // Priority
    'DMG_PHY_PRIORITY': { type: 'damage', category: 'Physical', power: 40, priority: 1, text: '위력은 낮지만 반드시 선제공격' },
    // Conditional
    'DMG_SPE_CONDITIONAL_STATUS': { type: 'damage', category: 'Special', power: 70, conditional: 'status', multiplier: 2, text: '상대가 상태 이상일 때 위력 2배' },
    'DMG_PHY_LOW_HP_BOOST': { type: 'damage', category: 'Physical', power: 60, conditional: 'low_hp', text: '자신의 HP가 1/3 이하일 때 위력 2.5배' },
    // Healing (NERFED)
    'HEAL_S': { type: 'heal', power: 0.15, text: '자신 최대 HP의 15% 회복' },
    'HEAL_M': { type: 'heal', power: 0.30, text: '자신 최대 HP의 30% 회복' },
    // Buffs (Self)
    'BUFF_ATK_S': { type: 'buff', stat: 'attack', amount: 1.5, turns: 3, text: '자신 공격 상승 (3턴)' },
    'BUFF_DEF_S': { type: 'buff', stat: 'defense', amount: 1.5, turns: 3, text: '자신 방어 상승 (3턴)' },
    'BUFF_SPD_S': { type: 'buff', stat: 'speed', amount: 1.5, turns: 3, text: '자신 속도 상승 (3턴)' },
    'BUFF_ALL_S': { type: 'buff', stat: 'all', amount: 1.2, turns: 2, text: '자신 모든 능력치 상승 (2턴)' },
    // Debuffs (Opponent)
    'DEBUFF_ATK_S': { type: 'debuff', stat: 'attack', amount: 0.75, turns: 3, text: '상대 공격 하락 (3턴)' },
    'DEBUFF_DEF_S': { type: 'debuff', stat: 'defense', amount: 0.75, turns: 3, text: '상대 방어 하락 (3턴)' },
    'DEBUFF_SPD_S': { type: 'debuff', stat: 'speed', amount: 0.75, turns: 3, text: '상대 속도 하락 (3턴)' },
    // Status Effects
    'STATUS_POISON': { type: 'status', effect: 'poison', chance: 0.3, text: '30% 확률로 상대를 중독 상태로 만듦' },
    'STATUS_PARALYSIS': { type: 'status', effect: 'paralysis', chance: 0.3, text: '30% 확률로 상대를 마비 상태로 만듦' },
    'STATUS_SLEEP': { type: 'status', effect: 'sleep', chance: 0.3, text: '30% 확률로 상대를 수면 상태로 만듦' },
    // Damage over Time (DoT)
    'DOT_POISON_S': { type: 'dot', effect: 'poison', damage: 0.0625, turns: 4, text: '4턴간 매 턴 상대 최대 HP의 1/16 독 데미지' },
    // Shield
    'SHIELD_S': { type: 'shield', amount: 0.25, text: '자신 최대 HP의 25%만큼 보호막 생성' },
};

// Master list of all available abilities in the game
export const MASTER_ABILITY_LIST = {
    'INTIMIDATE': { text: '등장 시 상대의 공격을 1단계 하락시킨다.' },
    'SPEED_BOOST': { text: '매 턴이 끝날 때마다 자신의 속도가 1단계 상승한다.' },
    'REGENERATOR': { text: '매 턴이 끝날 때마다 최대 체력의 1/16을 회복한다.' },
    'GUTS': { text: '상태 이상에 걸리면 공격이 1.5배 상승한다.' },
    'TECHNICIAN': { text: '위력 60 이하 기술의 위력이 1.5배가 된다.' },
};

