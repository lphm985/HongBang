export interface Realm {
  name: string;
  qiThreshold: number;
  baseQiPerSecond: number;
  breakthroughChance: number;
  // NEW: Base combat stats
  baseHp: number;
  baseAtk: number;
  baseDef: number;
}

export type TechniqueBonus =
  | { type: 'qi_per_second_multiplier'; value: number }
  | { type: 'breakthrough_chance_add'; value: number };

export interface Technique {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  bonuses: TechniqueBonus[];
}

export interface Herb {
  id: string;
  name: string;
  description: string;
}

export type Reward = 
  | { type: 'qi'; amount: number }
  | { type: 'herb'; herbId: string; amount: number }
  | { type: 'equipment'; equipmentId: string };


export interface ExplorationLocation {
  id: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  requiredBodyStrength: number;
  durationSeconds: number;
  rewards: Reward[];
}

export interface TrialZone {
  id:string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  cooldownSeconds: number;
  monster: {
    name: string;
    health: number;
    attack: number;
  };
  rewards: Reward[];
}

export type PillEffect = 
  | { type: 'instant_qi'; amount: number }
  | { type: 'pvp_attack_buff'; value: number; duration_matches: number };

export interface Pill {
  id: string;
  name: string;
  description: string;
  effect: PillEffect;
}

export interface Recipe {
  id: string;
  pillId: string;
  name: string;
  description: string;
  requiredRealmIndex: number;
  qiCost: number;
  herbCosts: { [herbId: string]: number };
  successChance: number;
}

export type SpiritualRootId = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';

export interface SpiritualRoot {
  id: SpiritualRootId;
  name: string;
  description: string;
  bonus: {
    type: 'qi_per_second_add' | 'alchemy_success_add' | 'exploration_yield_mul' | 'atk_mul' | 'hp_mul' | 'def_mul' | 'body_temper_eff_mul';
    value: number;
  };
}

export type EquipmentBonus =
  | { type: 'qi_per_second_multiplier'; value: number }
  | { type: 'breakthrough_chance_add'; value: number }
  | { type: 'hp_add'; value: number }
  | { type: 'atk_add'; value: number }
  | { type: 'def_add'; value: number }
  | { type: 'hp_mul'; value: number }
  | { type: 'atk_mul'; value: number }
  | { type: 'def_mul'; value: number };

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  bonuses: EquipmentBonus[];
}


export type InsightBonus =
  | { type: 'qi_per_second_base_add'; value: number }
  | { type: 'body_temper_eff_add'; value: number }
  | { type: 'alchemy_success_base_add'; value: number };

export interface Insight {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in enlightenment points
  requiredInsightIds: string[];
  bonus: InsightBonus;
}

export interface Player {
  name: string;
  qi: number;
  realmIndex: number;
  bodyStrength: number; // Điểm rèn luyện thân thể
  karma: number; // Ác Nghiệp
  honorPoints: number; // Điểm vinh dự từ PvP
  linh_thach: number; // NEW: Spirit Stones for marketplace
  learnedTechniques: string[]; // IDs of learned techniques
  activeTechniqueId: string | null;
  pills: { [pillId: string]: number }; // Kho chứa đan dược
  herbs: { [herbId: string]: number }; // Kho chứa nguyên liệu
  spiritualRoot: SpiritualRootId | null;
  inventory: string[]; // IDs of owned equipment
  equipment: { [slot in EquipmentSlot]?: string }; // IDs of equipped items
  enlightenmentPoints: number;
  unlockedInsights: string[];
  purchasedHonorItems: string[]; // Items bought from honor shop (one-time)
  pvpBuff: { multiplier: number; matchesLeft: number } | null; // NEW: For pill effects
  // Guild Info
  guildId: number | null;
  guildName: string | null;
  guildLevel: number | null;
  guildExp: number | null;
}

export interface InspectPlayer {
  name: string;
  realmIndex: number;
  bodyStrength: number;
  karma: number;
  activeTechniqueId: string | null;
  spiritualRoot: SpiritualRootId | null;
  // NEW: Calculated combat stats
  calculatedHp: number;
  calculatedAtk: number;
  calculatedDef: number;
}


export interface GameEvent {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: number;
}

export interface ActiveEvent {
  id: number;
  title: string;
  description: string;
  bonus_type: string;
  bonus_value: number;
  expires_at: string;
}


export interface ChatMessage {
  id: number;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface MatchHistoryItem {
    id: number;
    opponent: string;
    won: boolean;
    summary: string;
    log: string[];
    timestamp: number;
}

export interface MarketListing {
    id: number;
    seller_name: string;
    item_id: string;
    price: number;
    expires_at: string;
    // FIX: Add missing created_at property which is returned by the API and used for sorting.
    created_at: string;
    // Joined data from equipment table
    item: Equipment;
}


// --- Guild War Types ---
export interface GuildWar {
  id: number;
  name: string;
  start_time: string;
  status: 'PENDING' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface GuildWarMatch {
    id: number;
    war_id: number;
    current_round: number;
    guild1_id: number;
    guild1_round_wins: number;
    guild2_id: number;
    guild2_round_wins: number;
    status: 'PENDING_LINEUP' | 'IN_PROGRESS' | 'COMPLETED';
    winner_guild_id: number | null;
    opponent: {
        id: number;
        name: string;
    };
    my_lineup_submitted: boolean;
    opponent_lineup_submitted: boolean;
}

export interface GuildWarFightResult {
    id: number;
    round_number: number;
    guild1_player: string;
    guild2_player: string;
    winner_player: string;
    fight_order: number;
    combat_log: string[]; // NEW: Add combat log to the type
}

export interface GuildWarState {
    current_war: GuildWar | null;
    is_registered: boolean;
    my_match: GuildWarMatch | null;
    fight_results: GuildWarFightResult[];
    is_leader: boolean; // NEW: To check if the current player is the guild leader
}

export interface GuildMember {
    name: string;
    realmIndex: number;
}