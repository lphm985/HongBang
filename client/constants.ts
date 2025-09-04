import type { Realm, Player, Technique, ExplorationLocation, TrialZone, Pill, Recipe, Herb, SpiritualRoot, Equipment, Insight } from './types';

export const REALMS: Realm[] = [
  { name: 'Phàm Nhân', qiThreshold: 100, baseQiPerSecond: 1, breakthroughChance: 1.0, baseHp: 50, baseAtk: 5, baseDef: 0 },
  { name: 'Luyện Khí Kỳ', qiThreshold: 1000, baseQiPerSecond: 5, breakthroughChance: 0.9, baseHp: 200, baseAtk: 15, baseDef: 5 },
  { name: 'Trúc Cơ Kỳ', qiThreshold: 10000, baseQiPerSecond: 25, breakthroughChance: 0.75, baseHp: 1000, baseAtk: 50, baseDef: 20 },
  { name: 'Kim Đan Kỳ', qiThreshold: 100000, baseQiPerSecond: 125, breakthroughChance: 0.6, baseHp: 5000, baseAtk: 200, baseDef: 80 },
  { name: 'Nguyên Anh Kỳ', qiThreshold: 1000000, baseQiPerSecond: 625, breakthroughChance: 0.45, baseHp: 25000, baseAtk: 800, baseDef: 300 },
  { name: 'Hóa Thần Kỳ', qiThreshold: 10000000, baseQiPerSecond: 3125, breakthroughChance: 0.3, baseHp: 125000, baseAtk: 3500, baseDef: 1200 },
  { name: 'Luyện Hư Kỳ', qiThreshold: 100000000, baseQiPerSecond: 15625, breakthroughChance: 0.15, baseHp: 600000, baseAtk: 15000, baseDef: 5000 },
  { name: 'Đại Thừa Kỳ', qiThreshold: Infinity, baseQiPerSecond: 78125, breakthroughChance: 0.05, baseHp: 3000000, baseAtk: 75000, baseDef: 25000 },
];

export const BODY_STRENGTH_REALMS: { [key: number]: string } = {
  0: 'Phàm Thân',
  10: 'Cương Thân',
  50: 'Ngọc Thân',
  200: 'Lưu Ly Thân',
  1000: 'Kim Cương Bất Hoại Thân',
};

export const BODY_STRENGTH_COST = {
  base: 100,
  multiplier: 1.1,
};

export const SPIRITUAL_ROOTS: SpiritualRoot[] = [
    { id: 'kim', name: 'Kim Linh Căn', description: 'Thân thể cứng như kim loại, tăng 15% Phòng Ngự.', bonus: { type: 'def_mul', value: 1.15 } },
    { id: 'moc', name: 'Mộc Linh Căn', description: 'Thân với thảo mộc, tăng 5% tỷ lệ thành công Luyện Đan và 10% sản lượng Thám Hiểm.', bonus: { type: 'alchemy_success_add', value: 0.05 } },
    { id: 'thuy', name: 'Thủy Linh Căn', description: 'Tâm tĩnh như nước, tốc độ hấp thụ linh khí căn bản tăng 0.5 điểm mỗi giây.', bonus: { type: 'qi_per_second_add', value: 0.5 } },
    { id: 'hoa', name: 'Hỏa Linh Căn', description: 'Tính nóng như lửa, tăng 10% Công Kích.', bonus: { type: 'atk_mul', value: 1.1 } },
    { id: 'tho', name: 'Thổ Linh Căn', description: 'Vững như bàn thạch, tăng 15% Sinh Lực.', bonus: { type: 'hp_mul', value: 1.15 } },
];

export const TECHNIQUES: Technique[] = [
  {
    id: 'dan_khi_quyet',
    name: 'Dẫn Khí Quyết',
    description: 'Công pháp nhập môn, giúp tăng tốc độ hấp thụ linh khí cơ bản.',
    requiredRealmIndex: 1, // Luyện Khí Kỳ
    bonuses: [{ type: 'qi_per_second_multiplier', value: 1.2 }], // +20% Qi/s
  },
  {
    id: 'ngung_than_thuat',
    name: 'Ngưng Thần Thuật',
    description: 'Ổn định tâm cảnh, giúp tăng nhẹ khả năng thành công khi đột phá.',
    requiredRealmIndex: 2, // Trúc Cơ Kỳ
    bonuses: [{ type: 'breakthrough_chance_add', value: 0.05 }], // +5% chance
  },
  {
    id: 'hon_nguyen_cong',
    name: 'Hỗn Nguyên Công',
    description: 'Công pháp thượng thừa, tăng mạnh tốc độ tu luyện nhưng khiến linh khí không ổn định, giảm nhẹ tỷ lệ đột phá.',
    requiredRealmIndex: 3, // Kim Đan Kỳ
    bonuses: [
      { type: 'qi_per_second_multiplier', value: 1.5 }, // +50% Qi/s
      { type: 'breakthrough_chance_add', value: -0.05 }, // -5% chance
    ],
  },
    {
    id: 'van_kiem_quyet',
    name: 'Vạn Kiếm Quyết',
    description: 'Lấy kiếm ý rèn luyện tâm ma, tăng mạnh hiệu suất tu luyện và khả năng đột phá.',
    requiredRealmIndex: 4, // Nguyên Anh Kỳ
    bonuses: [
      { type: 'qi_per_second_multiplier', value: 1.3 }, // +30% Qi/s
      { type: 'breakthrough_chance_add', value: 0.1 }, // +10% chance
    ],
  },
];

export const HERBS: Herb[] = [
    { id: 'linh_thao', name: 'Linh Thảo', description: 'Loại cỏ dại phổ biến, chứa một ít linh khí.' },
    { id: 'huyet_tham', name: 'Huyết Sâm', description: 'Loại sâm quý mọc ở nơi âm khí nặng, có tác dụng bổ khí huyết.' },
    { id: 'tinh_nguyet_hoa', name: 'Tinh Nguyệt Hoa', description: 'Bông hoa chỉ nở vào đêm trăng tròn, hấp thụ tinh hoa của trời đất.'}
];

export const EXPLORATION_LOCATIONS: ExplorationLocation[] = [
  {
    id: 'thanh_son_mach',
    name: 'Thanh Sơn Mạch',
    description: 'Dãy núi gần nhất, linh khí tuy mỏng manh nhưng an toàn cho người mới tu luyện.',
    requiredRealmIndex: 1,
    requiredBodyStrength: 0,
    durationSeconds: 60,
    rewards: [{ type: 'herb', herbId: 'linh_thao', amount: 3 }],
  },
  {
    id: 'hac_phong_son',
    name: 'Hắc Phong Sơn',
    description: 'Nơi yêu thú cấp thấp hoành hành, có cơ duyên nhưng cũng đầy rẫy nguy hiểm.',
    requiredRealmIndex: 2,
    requiredBodyStrength: 10,
    durationSeconds: 300,
    rewards: [
        { type: 'herb', herbId: 'linh_thao', amount: 5 },
        { type: 'herb', herbId: 'huyet_tham', amount: 1 }
    ],
  },
  {
    id: 'u_vu_dam',
    name: 'U Vụ Đầm Lầy',
    description: 'Đầm lầy chướng khí, nghe đồn có linh thảo hiếm nhưng rất khó tìm.',
    requiredRealmIndex: 3,
    requiredBodyStrength: 50,
    durationSeconds: 900,
    rewards: [
        { type: 'herb', herbId: 'huyet_tham', amount: 3 },
        { type: 'herb', herbId: 'tinh_nguyet_hoa', amount: 1 }
    ],
  },
];

export const TRIAL_ZONES: TrialZone[] = [
  {
    id: 'van_thu_coc',
    name: 'Vạn Thú Cốc',
    description: 'Nơi tập trung của các yêu thú cấp thấp, thích hợp cho tu sĩ Luyện Khí Kỳ rèn luyện.',
    requiredRealmIndex: 1, // Luyện Khí Kỳ
    cooldownSeconds: 60,
    monster: {
      name: 'Yêu Hổ',
      health: 200,
      attack: 10,
    },
    rewards: [
      { type: 'qi', amount: 50 },
      { type: 'herb', herbId: 'linh_thao', amount: 1 }
    ],
  },
  {
    id: 'hac_phong_trai',
    name: 'Hắc Phong Trại',
    description: 'Một nhóm tán tu chiếm núi làm vua, tu sĩ Trúc Cơ Kỳ có thể đến tiêu diệt chúng.',
    requiredRealmIndex: 2, // Trúc Cơ Kỳ
    cooldownSeconds: 180,
    monster: {
      name: 'Tặc Đầu',
      health: 1500,
      attack: 50,
    },
    rewards: [
      { type: 'qi', amount: 200 },
      { type: 'herb', herbId: 'huyet_tham', amount: 1 }
    ],
  },
  {
    id: 'kiem_mo',
    name: 'Kiếm Mộ',
    description: 'Nơi chôn cất của vô số kiếm tu, kiếm ý còn sót lại hóa thành ma linh.',
    requiredRealmIndex: 3, // Kim Đan Kỳ
    cooldownSeconds: 600,
    monster: {
      name: 'Kiếm Hồn',
      health: 10000,
      attack: 250,
    },
    rewards: [
      { type: 'qi', amount: 2500 },
      { type: 'herb', herbId: 'tinh_nguyet_hoa', amount: 1 },
      { type: 'equipment', equipmentId: 'tu_linh_chau' },
    ],
  },
];

export const PILLS: Pill[] = [
  {
    id: 'hoi_khi_dan',
    name: 'Hồi Khí Đan',
    description: 'Đan dược cấp thấp, có thể ngay lập tức bổ sung một lượng nhỏ linh khí.',
    effect: { type: 'instant_qi', amount: 500 },
  },
  {
    id: 'tinh_nguyen_dan',
    name: 'Tinh Nguyên Đan',
    description: 'Đan dược trung cấp, luyện hóa từ tinh hoa linh thảo, bổ sung lượng lớn linh khí.',
    effect: { type: 'instant_qi', amount: 10000 },
  },
  {
    id: 'chien_than_dan',
    name: 'Chiến Thần Đan',
    description: 'Đan dược đặc biệt, dùng trước khi Đấu Pháp sẽ tăng 20% sát thương trong trận đấu tiếp theo.',
    effect: { type: 'pvp_attack_buff', value: 1.2, duration_matches: 1 },
  },
];

export const EQUIPMENT: Equipment[] = [
  {
    id: 'tu_linh_chau',
    name: 'Tụ Linh Châu',
    description: 'Một viên châu có khả năng tụ tập linh khí trời đất, giúp tăng tốc độ tu luyện.',
    slot: 'accessory',
    bonuses: [{ type: 'qi_per_second_multiplier', value: 1.1 }], // +10%
  },
  {
    id: 'ho_than_phu',
    name: 'Hộ Thân Phù',
    description: 'Lá bùa hộ mệnh, tăng cường sinh lực cho người mang nó khi chiến đấu.',
    slot: 'accessory',
    bonuses: [{ type: 'hp_add', value: 500 }], // +500 HP
  },
  {
    id: 'pha_quan_giap',
    name: 'Phá Quân Giáp',
    description: 'Chiến giáp được rèn từ máu của vạn quân địch, tăng 10% công và 10% thủ khi Đấu Pháp.',
    slot: 'armor',
    bonuses: [{ type: 'atk_mul', value: 1.1 }, { type: 'def_mul', value: 1.1 }],
  },
  {
    id: 'huyen_thiet_kiem',
    name: 'Huyền Thiết Kiếm',
    description: 'Một thanh trọng kiếm đơn giản nhưng đầy uy lực.',
    slot: 'weapon',
    bonuses: [{ type: 'atk_add', value: 100 }],
  },
];


export const RECIPES: Recipe[] = [
  {
    id: 'recipe_hoi_khi_dan',
    pillId: 'hoi_khi_dan',
    name: 'Đan Phương: Hồi Khí Đan',
    description: 'Một phương pháp luyện đan đơn giản, phổ biến trong giới tu tiên Luyện Khí Kỳ.',
    requiredRealmIndex: 1, // Luyện Khí Kỳ
    qiCost: 100,
    herbCosts: { 'linh_thao': 5 },
    successChance: 0.8, // 80%
  },
  {
    id: 'recipe_tinh_nguyen_dan',
    pillId: 'tinh_nguyen_dan',
    name: 'Đan Phương: Tinh Nguyên Đan',
    description: 'Đan phương phức tạp hơn, yêu cầu tu vi Trúc Cơ Kỳ để có thể khống hỏa luyện chế.',
    requiredRealmIndex: 2, // Trúc Cơ Kỳ
    qiCost: 2000,
    herbCosts: { 'huyet_tham': 3, 'tinh_nguyet_hoa': 1 },
    successChance: 0.6, // 60%
  },
];

export const INSIGHTS: Insight[] = [
    {
        id: 'basic_understanding',
        name: 'Sơ Khuy Môn Kính',
        description: 'Bước đầu lĩnh ngộ thiên địa, tăng nhẹ tốc độ hấp thụ linh khí cơ bản.',
        cost: 1,
        requiredInsightIds: [],
        bonus: { type: 'qi_per_second_base_add', value: 0.2 },
    },
    {
        id: 'body_harmony',
        name: 'Nhục Thân Tương Hợp',
        description: 'Hiểu rõ hơn về cơ thể, tăng nhẹ hiệu quả của việc tôi luyện thân thể.',
        cost: 3,
        requiredInsightIds: ['basic_understanding'],
        bonus: { type: 'body_temper_eff_add', value: 0.05 },
    },
    {
        id: 'alchemy_intuition',
        name: 'Đan Đạo Trực Giác',
        description: 'Tâm thần hợp nhất với đan lô, tăng nhẹ tỷ lệ thành công khi luyện đan.',
        cost: 3,
        requiredInsightIds: ['basic_understanding'],
        bonus: { type: 'alchemy_success_base_add', value: 0.02 },
    },
];

export const HONOR_SHOP_ITEMS = [
    {
        id: 'honor_equipment_1',
        type: 'equipment',
        itemId: 'pha_quan_giap',
        name: 'Phá Quân Giáp',
        description: 'Trang bị PvP, tăng 10% công và thủ khi Đấu Pháp. (Mua một lần)',
        cost: 50,
        isUnique: true,
    },
    {
        id: 'honor_pill_1',
        type: 'pill',
        itemId: 'chien_than_dan',
        name: 'Chiến Thần Đan',
        description: 'Tăng 20% sát thương trong trận Đấu Pháp tiếp theo.',
        cost: 5,
        isUnique: false,
    },
    // Future item example
    // {
    //     id: 'honor_title_1',
    //     type: 'title',
    //     itemId: 'bach_thang_vuong',
    //     name: 'Danh Hiệu: Bách Thắng Vương',
    //     description: 'Danh hiệu chứng tỏ thực lực PvP của bạn. (Mua một lần)',
    //     cost: 200,
    //     isUnique: true,
    // }
];

export const INITIAL_PLAYER: Player = {
  name: 'Đạo Hữu',
  qi: 0,
  realmIndex: 0,
  bodyStrength: 0,
  karma: 0, 
  honorPoints: 0,
  linh_thach: 0,
  learnedTechniques: [],
  activeTechniqueId: null,
  pills: {},
  herbs: {},
  spiritualRoot: null,
  inventory: [],
  equipment: {},
  enlightenmentPoints: 0,
  unlockedInsights: [],
  purchasedHonorItems: [],
  pvpBuff: null,
  guildId: null,
  guildName: null,
  guildLevel: null,
  guildExp: null,
};

export const GAME_TICK_MS = 1000;
export const GUILD_CREATION_COST = 100000; // Chi phí tạo Tông Môn
export const PVP_COOLDOWN_SECONDS = 300; // 5 minutes cooldown for PvP
export const MARKET_TAX_RATE = 0.05; // 5% tax
export const MARKET_LISTING_DURATION_HOURS = 24;


export const getGuildNextLevelExp = (currentLevel: number): number => {
    // Starts at 1,000,000 for level 1->2, and increases by 50% each level
    return Math.floor(500000 * Math.pow(1.5, currentLevel));
};

/**
 * NEW: Calculates the maximum number of members a guild can have at a certain level.
 * @param level The guild's level.
 * @returns The maximum number of members.
 */
export const getGuildMemberLimit = (level: number): number => {
    if (level <= 0) return 0;
    // Base 10 members at level 1, +2 members for each subsequent level.
    return 10 + (level - 1) * 2;
};


/**
 * Formats a large number into a readable string with suffixes (K, Triệu, Tỷ).
 * @param num The number to format.
 * @returns A formatted string.
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const n = Math.floor(num);

  if (n < 1000) {
    return n.toLocaleString('vi-VN');
  }
  if (n >= 1_000_000_000) {
    // Show up to 3 decimal places for billions, e.g. 1.234 Tỷ
    return `${parseFloat((n / 1_000_000_000).toFixed(3))} Tỷ`;
  }
  if (n >= 1_000_000) {
    // Show up to 2 decimal places for millions, e.g. 1.23 Triệu
    return `${parseFloat((n / 1_000_000).toFixed(2))} Triệu`;
  }
  // Show up to 1 decimal place for thousands, e.g. 1.2K
  return `${parseFloat((n / 1000).toFixed(1))}K`;
};


export const getGuildBonuses = (guildLevel: number | null) => {
    if (!guildLevel || guildLevel <= 1) return { qiBonus: 0, breakthroughBonus: 0 };
    // Example: +1% Qi gain and +0.2% breakthrough chance per level after level 1
    const levelBonus = guildLevel - 1;
    return {
        qiBonus: levelBonus * 0.01,
        breakthroughBonus: levelBonus * 0.002,
    };
};