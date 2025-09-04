const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState, getFullPlayerQuery, calculateTotalBonuses, calculateCombatStats } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');
const { ATTACKER_MESSAGES, DEFENDER_MESSAGES, ATTACKER_FINISHERS, DEFENDER_FINISHERS, PVP_WIN_SUMMARIES, PVP_LOSE_SUMMARIES } = require('../utils/combatMessages');

const router = express.Router();

// --- Mẫu câu hài hước cho combat log ---
const getRandomMessage = (templates, replacements) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return Object.entries(replacements).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(`{${key}}`, 'g'), value);
    }, template);
};


// GET /api/pvp/opponents - Tìm đối thủ
router.get('/opponents', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const [player] = await conn.query("SELECT realmIndex FROM players WHERE name = ?", [playerName]);
        if (!player) {
            return res.status(404).json({ message: 'Không tìm thấy người chơi.' });
        }

        const opponents = await conn.query(
            "SELECT name, realmIndex FROM players WHERE realmIndex BETWEEN ? AND ? AND name != ? ORDER BY RAND() LIMIT 5",
            [Math.max(0, player.realmIndex - 1), player.realmIndex + 1, playerName]
        );
        res.status(200).json(opponents);
    } catch (err) {
        console.error("Find Opponents Error:", err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tìm đối thủ.' });
    } finally {
        if (conn) conn.release();
    }
});

// GET /api/pvp/history - Lấy lịch sử đấu
router.get('/history', authenticateToken, async (req, res) => {
    const playerName = req.user.name;
    let conn;
    try {
        conn = await pool.getConnection();
        const history = await conn.query(
            `SELECT 
                id, 
                IF(attacker_name = ?, defender_name, attacker_name) as opponent,
                (winner_name = ?) as won,
                funny_summary as summary,
                combat_log as log,
                UNIX_TIMESTAMP(timestamp) as timestamp
            FROM pvp_history 
            WHERE attacker_name = ? OR defender_name = ? 
            ORDER BY timestamp DESC 
            LIMIT 20`,
            [playerName, playerName, playerName, playerName]
        );
        res.status(200).json(history.map(h => ({ ...h, log: h.log || [], timestamp: h.timestamp * 1000 })));
    } catch (err) {
        console.error("Get History Error:", err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải lịch sử đấu.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/pvp/challenge - Khiêu chiến
router.post('/challenge', authenticateToken, async (req, res) => {
    const attackerName = req.user.name;
    const { opponentName } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        
        const gameData = getGameData();

        // Lock both players to prevent concurrent modifications
        const players = await conn.query("SELECT * FROM players WHERE name IN (?, ?) FOR UPDATE", [attackerName, opponentName]);
        const attacker = players.find(p => p.name === attackerName);
        const defender = players.find(p => p.name === opponentName);

        if (!attacker || !defender) {
            throw new Error("Không tìm thấy một trong hai đạo hữu.");
        }

        const lastChallengeTime = attacker.lastChallengeTime || {};
        const lastPvpTime = lastChallengeTime['pvp'] || 0;
        if (Date.now() - lastPvpTime < gameData.PVP_COOLDOWN_SECONDS * 1000) {
            throw new Error('Bạn đang trong thời gian hồi, chưa thể khiêu chiến.');
        }
        
        // --- Cơ chế Chọc Tức Đại Năng ---
        if (attacker.realmIndex < defender.realmIndex) {
            if (Math.random() < 0.01) { // 1% chance
                 const newRealmIndex = Math.max(0, attacker.realmIndex - 1);
                 const newCooldowns = { ...lastChallengeTime, pvp: Date.now() };
                 await updatePlayerState(conn, attackerName, { 
                    realmIndex: newRealmIndex,
                    qi: 0,
                    lastChallengeTime: JSON.stringify(newCooldowns) 
                 });
                 await conn.commit();
                 
                 const [finalPlayerState] = await conn.query(getFullPlayerQuery, [attackerName]);
                 return res.status(200).json({
                    player: finalPlayerState,
                    lastChallengeTime: newCooldowns,
                    log: { message: `Hành động ngu xuẩn của bạn đã chọc tức đại năng! Bạn bị một chưởng đánh bay, tu vi rớt xuống ${gameData.REALMS[newRealmIndex].name}!`, type: 'danger' },
                });
            }
        }

        // --- Combat Simulation ---
        const attackerBonuses = await calculateTotalBonuses(conn, attacker);
        const defenderBonuses = await calculateTotalBonuses(conn, defender);

        const attackerStats = calculateCombatStats(attacker, attackerBonuses);
        const defenderStats = calculateCombatStats(defender, defenderBonuses);

        let attackerHealth = attackerStats.hp;
        let attackerAttack = attackerStats.atk;
        let attackerDef = attackerStats.def;

        let defenderHealth = defenderStats.hp;
        let defenderAttack = defenderStats.atk;
        let defenderDef = defenderStats.def;

        const combatLog = [];
        let turn = 0;

        // Apply PvP Buff from pill
        attacker.pvpBuff = attacker.pvpBuff || null;
        if (attacker.pvpBuff && attacker.pvpBuff.matchesLeft > 0) {
            attackerAttack *= attacker.pvpBuff.multiplier;
            combatLog.push(`(Nhờ hiệu lực của Chiến Thần Đan, công kích của bạn tăng mạnh!)`);
        }

        while (attackerHealth > 0 && defenderHealth > 0 && turn < 50) { // Max 50 turns
            // Attacker's turn
            let damageToDefender = attackerAttack + Math.floor(Math.random() * attackerAttack * 0.2);
            const defenderDamageReduction = defenderDef / (defenderDef + 1000); // Use K=1000 for PvP
            const actualDamageToDefender = Math.max(1, Math.floor(damageToDefender * (1 - defenderDamageReduction)));
            defenderHealth -= actualDamageToDefender;
            combatLog.push(getRandomMessage(ATTACKER_MESSAGES, { attacker: attackerName, defender: opponentName, damage: actualDamageToDefender.toFixed(0) }));
            
            if (defenderHealth <= 0) {
                 combatLog.push(getRandomMessage(ATTACKER_FINISHERS, { attacker: attackerName, defender: opponentName }));
                 break;
            }

            // Defender's turn
            let damageToAttacker = defenderAttack + Math.floor(Math.random() * defenderAttack * 0.2);
            const attackerDamageReduction = attackerDef / (attackerDef + 1000); // Use K=1000 for PvP
            const actualDamageToAttacker = Math.max(1, Math.floor(damageToAttacker * (1 - attackerDamageReduction)));
            attackerHealth -= actualDamageToAttacker;
            combatLog.push(getRandomMessage(DEFENDER_MESSAGES, { defender: opponentName, attacker: attackerName, damage: actualDamageToAttacker.toFixed(0) }));
            
            if (attackerHealth <= 0) {
                combatLog.push(getRandomMessage(DEFENDER_FINISHERS, { defender: opponentName, attacker: attackerName }));
                break;
            }
            turn++;
        }

        // --- Determine Winner & Apply Results ---
        const attackerWon = attackerHealth > 0;
        const winnerName = attackerWon ? attackerName : opponentName;
        
        let summary;
        if (attackerWon) {
            attacker.honorPoints = (attacker.honorPoints || 0) + 2;
            summary = PVP_WIN_SUMMARIES[Math.floor(Math.random() * PVP_WIN_SUMMARIES.length)];
            // --- Logic Ác Nghiệp ---
            if (attacker.realmIndex > defender.realmIndex) {
                const karmaGain = attacker.realmIndex - defender.realmIndex;
                attacker.karma = (attacker.karma || 0) + karmaGain;
                 combatLog.push(`(Hành vi bắt nạt kẻ yếu đã khiến bạn tích lũy ${karmaGain} điểm Ác Nghiệp.)`);
            }
        } else {
            attacker.honorPoints = Math.max(0, (attacker.honorPoints || 0) - 1);
            defender.honorPoints = (defender.honorPoints || 0) + 1;
            summary = PVP_LOSE_SUMMARIES[Math.floor(Math.random() * PVP_LOSE_SUMMARIES.length)];
        }

        // Update attacker cooldown
        const newCooldowns = { ...lastChallengeTime, pvp: Date.now() };

        // Consume PvP buff
        let newPvpBuff = attacker.pvpBuff;
        if (newPvpBuff && newPvpBuff.matchesLeft > 0) {
            newPvpBuff.matchesLeft -= 1;
            if (newPvpBuff.matchesLeft <= 0) {
                newPvpBuff = null; // Clear buff
            }
        }

        // Save history
        await conn.query(
            "INSERT INTO pvp_history (attacker_name, defender_name, winner_name, funny_summary, combat_log) VALUES (?, ?, ?, ?, ?)",
            [attackerName, opponentName, winnerName, summary, JSON.stringify(combatLog)]
        );

        // Update both players' states
        await updatePlayerState(conn, attackerName, { 
            honorPoints: attacker.honorPoints, 
            karma: attacker.karma,
            lastChallengeTime: JSON.stringify(newCooldowns),
            pvpBuff: newPvpBuff ? JSON.stringify(newPvpBuff) : null
        });
        await updatePlayerState(conn, opponentName, { 
            honorPoints: defender.honorPoints,
        });

        await conn.commit();

        // Return the full updated player state and combat log
        const [finalPlayerState] = await conn.query(getFullPlayerQuery, [attackerName]);
        res.status(200).json({
            player: finalPlayerState,
            lastChallengeTime: newCooldowns,
            combatLog: [{ message: `Trận đấu kết thúc. ${summary}`, type: attackerWon ? 'success' : 'danger' }],
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("PVP Challenge Error:", err);
        res.status(400).json({ message: err.message || 'Hành động không hợp lệ.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/pvp/shop/buy - Mua vật phẩm từ cửa hàng vinh dự
router.post('/shop/buy', authenticateToken, async (req, res) => {
    const { itemId } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const shopItems = gameData.HONOR_SHOP_ITEMS || [];
        const item = shopItems.find(i => i.id === itemId);

        if (!item) throw new Error("Vật phẩm không tồn tại.");

        if (item.isUnique && p.purchasedHonorItems.includes(item.id)) {
            throw new Error("Bạn đã mua vật phẩm này rồi.");
        }
        if (p.honorPoints < item.cost) {
            throw new Error("Không đủ điểm vinh dự.");
        }

        const updates = {
            honorPoints: p.honorPoints - item.cost,
        };

        if (item.isUnique) {
            updates.purchasedHonorItems = JSON.stringify([...p.purchasedHonorItems, item.id]);
        }
        
        // FIX: Updated logic to use `inventory` for equipment items
        if (item.type === 'equipment') {
            if (!p.inventory.includes(item.itemId)) {
                updates.inventory = JSON.stringify([...p.inventory, item.itemId]);
            }
        } else if (item.type === 'pill') {
            const newPills = { ...p.pills };
            newPills[item.itemId] = (newPills[item.itemId] || 0) + 1;
            updates.pills = JSON.stringify(newPills);
        }

        await updatePlayerState(conn, p.name, updates);
        resRef.log = { message: `Mua thành công [${item.name}]!`, type: 'success' };
    });
});

module.exports = router;