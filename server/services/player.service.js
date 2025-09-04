  const pool = require('../config/database');
  const { getGameData } = require('../services/gameData.service');

  // --- Helper Functions ---

  const calculateTotalBonuses = async (conn, player) => {
      const gameData = getGameData();
      const bonuses = { 
        qiMultiplier: 1, 
        breakthroughBonus: 0, 
        qiBonus: 0, 
        qiPerSecondAdd: 0,
        hpAdd: 0,
        atkAdd: 0,
        defAdd: 0,
        hpMul: 1,
        atkMul: 1,
        defMul: 1,
        bodyTemperMultiplier: 1,
        bodyTemperEffectAdd: 0, // Additive bonus for body tempering
        alchemySuccessAdd: 0, // Additive bonus for alchemy
      };

      // Technique bonuses
      if (player.activeTechniqueId) {
          const technique = gameData.TECHNIQUES.find(t => t.id === player.activeTechniqueId);
          technique?.bonuses.forEach(bonus => {
              if (bonus.type === 'qi_per_second_multiplier') bonuses.qiMultiplier *= bonus.value;
              else if (bonus.type === 'breakthrough_chance_add') bonuses.breakthroughBonus += bonus.value;
          });
      }

      // Guild bonuses
      if (player.guildId && player.guildLevel) {
          // Logic for getGuildBonuses inlined here to remove dependency on constants.js
          if (player.guildLevel > 1) {
              const levelBonus = player.guildLevel - 1;
              bonuses.qiBonus += levelBonus * 0.01; // Example: +1% Qi gain per level
              bonuses.breakthroughBonus += levelBonus * 0.002; // Example: +0.2% breakthrough chance per level
          }
      }
      
      // Spiritual Root bonuses
      if (player.spiritualRoot) {
          const root = gameData.SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
          if (root?.bonus.type === 'qi_per_second_add') bonuses.qiPerSecondAdd = root.bonus.value;
          if (root?.bonus.type === 'hp_mul') bonuses.hpMul *= root.bonus.value;
          if (root?.bonus.type === 'atk_mul') bonuses.atkMul *= root.bonus.value;
          if (root?.bonus.type === 'def_mul') bonuses.defMul *= root.bonus.value;
          if (root?.bonus.type === 'body_temper_eff_mul') bonuses.bodyTemperMultiplier = root.bonus.value;
          if (root?.bonus.type === 'alchemy_success_add') bonuses.alchemySuccessAdd += root.bonus.value;
      }

      // FIX: Updated logic to iterate through all equipped items in the new system
      if (player.equipment) {
          Object.values(player.equipment).forEach(itemId => {
              if (!itemId) return;
              const item = gameData.EQUIPMENT.find(t => t.id === itemId);
              item?.bonuses.forEach(bonus => {
                  if (bonus.type === 'qi_per_second_multiplier') bonuses.qiMultiplier *= bonus.value;
                  if (bonus.type === 'breakthrough_chance_add') bonuses.breakthroughBonus += bonus.value;
                  if (bonus.type === 'hp_add') bonuses.hpAdd += bonus.value;
                  if (bonus.type === 'atk_add') bonuses.atkAdd += bonus.value;
                  if (bonus.type === 'def_add') bonuses.defAdd += bonus.value;
                  if (bonus.type === 'hp_mul') bonuses.hpMul *= bonus.value;
                  if (bonus.type === 'atk_mul') bonuses.atkMul *= bonus.value;
                  if (bonus.type === 'def_mul') bonuses.defMul *= bonus.value;
              });
          });
      }

      // Unlocked Insights bonuses
      if (player.unlockedInsights) {
          player.unlockedInsights.forEach(insightId => {
              const insight = gameData.INSIGHTS.find(i => i.id === insightId);
              if (insight?.bonus.type === 'qi_per_second_base_add') bonuses.qiPerSecondAdd += insight.bonus.value;
              if (insight?.bonus.type === 'body_temper_eff_add') bonuses.bodyTemperEffectAdd += insight.bonus.value;
              if (insight?.bonus.type === 'alchemy_success_base_add') bonuses.alchemySuccessAdd += insight.bonus.value;
          });
      }
      
      // NEW: Server-wide Event bonuses
      if (conn) {
        const activeEvents = await conn.query("SELECT bonus_type, bonus_value FROM events WHERE is_active = TRUE AND starts_at <= NOW() AND expires_at >= NOW()");
        activeEvents.forEach(event => {
            if (event.bonus_type === 'qi_multiplier') {
                bonuses.qiMultiplier *= event.bonus_value;
            } else if (event.bonus_type === 'breakthrough_add') {
                bonuses.breakthroughBonus += event.bonus_value;
            }
        });
      }

      return bonuses;
  };
    
  const calculateCombatStats = (player, bonuses) => {
    const gameData = getGameData();
    const realm = gameData.REALMS[player.realmIndex];
    if (!realm) {
        return { hp: 0, atk: 0, def: 0 };
    }

    // Base stats from realm, body strength. ATK no longer depends on mindState.
    const baseHp = realm.baseHp + (player.bodyStrength * 10);
    const baseAtk = realm.baseAtk + (player.bodyStrength * 0.5);
    const baseDef = realm.baseDef + (player.bodyStrength * 1.5);

    // Apply bonuses
    const totalHp = (baseHp + bonuses.hpAdd) * bonuses.hpMul;
    const totalAtk = (baseAtk + bonuses.atkAdd) * bonuses.atkMul;
    const totalDef = (baseDef + bonuses.defAdd) * bonuses.defMul;
    
    return {
        hp: Math.floor(totalHp),
        atk: Math.floor(totalAtk),
        def: Math.floor(totalDef),
    };
};

  const updatePlayerState = async (conn, name, updates) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      if (fields.length === 0) return;

      const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
      const query = `UPDATE players SET ${setClause} WHERE name = ?`;
      await conn.query(query, [...values, name]);
  };

  // A reusable query to get all relevant player data in one go
  const getPlayerQuery = `
      SELECT 
          p.*
      FROM players p 
      WHERE p.name = ?
  `;
  
  // FIX: Updated query to use new equipment fields
  const getFullPlayerQuery = `
      SELECT 
          p.name, p.qi, p.realmIndex, p.bodyStrength, p.karma,
          p.honorPoints, p.linh_thach, p.enlightenmentPoints, p.unlockedInsights,
          p.learnedTechniques, p.activeTechniqueId, p.pills, p.herbs, p.inventory,
          p.equipment, p.guildId, p.purchasedHonorItems, p.pvpBuff,
          p.spiritualRoot, p.explorationStatus, p.lastChallengeTime,
          g.name as guildName, g.level as guildLevel, g.exp as guildExp
      FROM players p 
      LEFT JOIN guilds g ON p.guildId = g.id 
      WHERE p.name = ?
  `;

  const processOfflineGains = async (conn, name) => {
      const gameData = getGameData();
      const rows = await conn.query("SELECT *, UNIX_TIMESTAMP(updated_at) as last_update FROM players WHERE name = ? FOR UPDATE", [name]);
      if (rows.length === 0) throw new Error('Không tìm thấy đạo hữu này.');

      const p = rows[0];
      const now = Date.now();
      const lastUpdate = p.updated_at.getTime();
      const deltaTime = Math.max(0, (now - lastUpdate) / 1000);
      const offlineGains = { qi: 0 };
      let explorationLog;

      // Parse JSON fields safely
      p.herbs = p.herbs || {};
      p.explorationStatus = p.explorationStatus || null;
      p.unlockedInsights = p.unlockedInsights || [];
      p.purchasedHonorItems = p.purchasedHonorItems || [];
      p.equipment = p.equipment || {}; // FIX: Ensure equipment is parsed
      p.pvpBuff = p.pvpBuff || null;
      
      // Complete offline exploration
      if (p.explorationStatus && p.explorationStatus.endTime <= now) {
          const location = gameData.EXPLORATION_LOCATIONS.find(l => l.id === p.explorationStatus.locationId);
          if (location) {
              let rewardsLog = [];
              const root = gameData.SPIRITUAL_ROOTS.find(r => r.id === p.spiritualRoot);
              // Mộc Linh Căn bonus for exploration yield
              const yieldMultiplier = (root && root.bonus.type === 'alchemy_success_add') ? 1.1 : 1; 

              location.rewards.forEach(reward => {
                  if (reward.type === 'qi') {
                      p.qi = Number(p.qi) + reward.amount;
                  }
                  if (reward.type === 'herb') {
                      const amountGained = Math.floor(reward.amount * yieldMultiplier);
                      p.herbs[reward.herbId] = (p.herbs[reward.herbId] || 0) + amountGained;
                      const herb = gameData.HERBS.find(h => h.id === reward.herbId);
                      rewardsLog.push(`${herb?.name} x${amountGained}`);
                  }
              });
              explorationLog = { message: `Thám hiểm ${location.name} hoàn tất! Bạn nhận được: ${rewardsLog.join(', ')}.`, type: 'success' };
          }
          p.explorationStatus = null;
      }

      // Calculate offline cultivation only if not exploring
      if (p.explorationStatus === null && deltaTime > 1) { // Only calc for more than 1s offline
          const currentRealm = gameData.REALMS[p.realmIndex];
          // Need to fetch guild info for accurate bonus calculation
          const guildRows = p.guildId ? await conn.query("SELECT level FROM guilds WHERE id = ?", [p.guildId]) : [];
          const playerWithGuild = { ...p, guildLevel: guildRows[0]?.level };

          const bonuses = await calculateTotalBonuses(conn, playerWithGuild);
          const qiPerSecond = (currentRealm.baseQiPerSecond * bonuses.qiMultiplier * (1 + bonuses.qiBonus)) + bonuses.qiPerSecondAdd;
          const gainedQi = qiPerSecond * deltaTime;
          
          const newQi = Number(p.qi) + gainedQi;
          const qiCap = currentRealm.qiThreshold === Infinity ? newQi : currentRealm.qiThreshold;
          const finalQi = Math.min(newQi, qiCap);
          
          offlineGains.qi = finalQi - Number(p.qi);
          p.qi = finalQi;
      }
      
      // Persist changes
      await updatePlayerState(conn, name, {
          qi: p.qi,
          explorationStatus: p.explorationStatus ? JSON.stringify(p.explorationStatus) : null,
          herbs: JSON.stringify(p.herbs),
          updated_at: new Date(now) // Explicitly set update time
      });

      const finalPlayerDataRows = await conn.query(getFullPlayerQuery, [name]);
      const finalPlayerData = finalPlayerDataRows[0];
      
      return {
          player: {
              ...finalPlayerData,
              // Ensure JSON fields are parsed correctly for the client
              learnedTechniques: finalPlayerData.learnedTechniques || [],
              pills: finalPlayerData.pills || {},
              herbs: finalPlayerData.herbs || {},
              inventory: finalPlayerData.inventory || [],
              equipment: finalPlayerData.equipment || {},
              unlockedInsights: finalPlayerData.unlockedInsights || [],
              purchasedHonorItems: finalPlayerData.purchasedHonorItems || [],
              pvpBuff: finalPlayerData.pvpBuff || null,
          },
          explorationStatus: finalPlayerData.explorationStatus,
          lastChallengeTime: finalPlayerData.lastChallengeTime || {},
          offlineGains,
          explorationLog,
      };
  };

  // A wrapper for all player actions to ensure consistency
  const performAction = async (req, res, actionLogic) => {
      const name = req.user.name;
      let conn;
      try {
          conn = await pool.getConnection();
          await conn.beginTransaction();

          // 1. Process any offline progress before the action
          const offlineData = await processOfflineGains(conn, name);
          if (offlineData.explorationLog) {
              // If an exploration finished, add its log to the response
              res.log = offlineData.explorationLog;
          }
          
          // 2. Get the fresh player state after offline processing
          const rows = await conn.query(getFullPlayerQuery, [name]);
          if (rows.length === 0) throw new Error("Không tìm thấy người chơi.");

          const player = rows[0];
          // Ensure JSON fields are parsed for the logic function
          player.pills = player.pills || {};
          player.herbs = player.herbs || {};
          player.inventory = player.inventory || [];
          player.equipment = player.equipment || {};
          player.lastChallengeTime = player.lastChallengeTime || {};
          player.learnedTechniques = player.learnedTechniques || [];
          player.unlockedInsights = player.unlockedInsights || [];
          player.purchasedHonorItems = player.purchasedHonorItems || [];
          player.pvpBuff = player.pvpBuff || null;


          // 3. Execute the specific action logic
          // The logic function can attach a 'log' or 'combatLog' to the `res` object
          const resRef = {}; // Use a reference object to pass logs back
          await actionLogic(conn, player, req.body, resRef);

          await conn.commit();

          // 4. Get the final updated state to return to client
          const finalRows = await conn.query(getFullPlayerQuery, [name]);
          
          res.status(200).json({
              player: {
                  ...finalRows[0],
                  learnedTechniques: finalRows[0].learnedTechniques || [],
                  pills: finalRows[0].pills || {},
                  herbs: finalRows[0].herbs || {},
                  inventory: finalRows[0].inventory || [],
                  equipment: finalRows[0].equipment || {},
                  unlockedInsights: finalRows[0].unlockedInsights || [],
                  purchasedHonorItems: finalRows[0].purchasedHonorItems || [],
                  pvpBuff: finalRows[0].pvpBuff || null,
              },
              explorationStatus: finalRows[0].explorationStatus,
              lastChallengeTime: finalRows[0].lastChallengeTime || {},
              log: resRef.log || res.log, // Prioritize log from action logic
              combatLog: resRef.combatLog,
          });

      } catch (err) {
          if (conn) await conn.rollback();
          console.error("Action Error:", err.message, err.stack);
          res.status(400).json({ message: err.message || 'Hành động không hợp lệ.' });
      } finally {
          if (conn) conn.release();
      }
  };

  module.exports = {
      calculateTotalBonuses,
      calculateCombatStats,
      updatePlayerState,
      getPlayerQuery,
      getFullPlayerQuery,
      processOfflineGains,
      performAction,
  };