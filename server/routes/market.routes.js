const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { performAction, updatePlayerState } = require('../services/player.service');
const { getGameData } = require('../services/gameData.service');

const router = express.Router();

// GET /api/market/listings - Lấy danh sách vật phẩm đang bán
router.get('/listings', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        // Lấy tất cả các listing chưa hết hạn
        const listings = await conn.query(
            "SELECT * FROM market_listings WHERE expires_at > NOW() ORDER BY created_at DESC"
        );
        
        // Lấy thông tin chi tiết của từng item
        const gameData = getGameData();
        const detailedListings = listings.map(listing => {
            const item = gameData.EQUIPMENT.find(eq => eq.id === listing.item_id);
            return { ...listing, item };
        }).filter(listing => !!listing.item); // Lọc ra những listing có item không tồn tại (phòng trường hợp dữ liệu game thay đổi)

        res.status(200).json(detailedListings);
    } catch (err) {
        console.error("Get Market Listings Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải dữ liệu Chợ Giao Dịch.' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/market/list - Đăng bán vật phẩm
router.post('/list', authenticateToken, async (req, res) => {
    const { itemId, price } = req.body;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        if (!p.inventory.includes(itemId)) {
            throw new Error("Bạn không sở hữu vật phẩm này.");
        }
        if (!price || price <= 0) {
            throw new Error("Giá bán không hợp lệ.");
        }

        // Xóa vật phẩm khỏi túi đồ
        const newInventory = p.inventory.filter(id => id !== itemId);

        // Tạo listing mới
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + gameData.MARKET_LISTING_DURATION_HOURS);

        await conn.query(
            "INSERT INTO market_listings (seller_name, item_id, price, expires_at) VALUES (?, ?, ?, ?)",
            [p.name, itemId, price, expiresAt]
        );

        await updatePlayerState(conn, p.name, { inventory: JSON.stringify(newInventory) });

        const item = gameData.EQUIPMENT.find(i => i.id === itemId);
        resRef.log = { message: `Bạn đã đăng bán [${item?.name}] với giá ${price} Linh Thạch.`, type: 'success' };
    });
});

// POST /api/market/buy/:id - Mua vật phẩm
router.post('/buy/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const [listing] = await conn.query("SELECT * FROM market_listings WHERE id = ? AND expires_at > NOW() FOR UPDATE", [listingId]);
        
        if (!listing) {
            throw new Error("Vật phẩm không còn tồn tại hoặc đã hết hạn.");
        }
        if (listing.seller_name === p.name) {
            throw new Error("Bạn không thể mua vật phẩm của chính mình.");
        }
        if (p.linh_thach < listing.price) {
            throw new Error("Không đủ Linh Thạch.");
        }

        const tax = Math.floor(listing.price * gameData.MARKET_TAX_RATE);
        const amountToSeller = BigInt(listing.price) - BigInt(tax);

        // Cập nhật người mua
        const newInventory = [...p.inventory, listing.item_id];
        await updatePlayerState(conn, p.name, {
            linh_thach: BigInt(p.linh_thach) - BigInt(listing.price),
            inventory: JSON.stringify(newInventory),
        });

        // Cập nhật người bán
        await conn.query(
            "UPDATE players SET linh_thach = linh_thach + ? WHERE name = ?",
            [amountToSeller.toString(), listing.seller_name]
        );

        // Xóa listing
        await conn.query("DELETE FROM market_listings WHERE id = ?", [listingId]);

        const item = gameData.EQUIPMENT.find(i => i.id === listing.item_id);
        resRef.log = { message: `Mua thành công [${item?.name}]!`, type: 'success' };
    });
});

// POST /api/market/cancel/:id - Hủy bán vật phẩm
router.post('/cancel/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    await performAction(req, res, async (conn, p, body, resRef) => {
        const gameData = getGameData();
        const [listing] = await conn.query("SELECT * FROM market_listings WHERE id = ? FOR UPDATE", [listingId]);
        if (!listing || listing.seller_name !== p.name) {
            throw new Error("Đây không phải vật phẩm của bạn.");
        }
        
        // Trả vật phẩm về túi
        const newInventory = [...p.inventory, listing.item_id];
        await updatePlayerState(conn, p.name, { inventory: JSON.stringify(newInventory) });

        // Xóa listing
        await conn.query("DELETE FROM market_listings WHERE id = ?", [listingId]);
        
        const item = gameData.EQUIPMENT.find(i => i.id === listing.item_id);
        resRef.log = { message: `Bạn đã hủy bán [${item?.name}].`, type: 'info' };
    });
});

// GET /api/market/my-listings - Lấy danh sách vật phẩm của tôi
router.get('/my-listings', authenticateToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const listings = await conn.query(
            "SELECT * FROM market_listings WHERE seller_name = ? ORDER BY created_at DESC",
            [req.user.name]
        );

        const gameData = getGameData();
        const detailedListings = listings.map(listing => {
            const item = gameData.EQUIPMENT.find(eq => eq.id === listing.item_id);
            return { ...listing, item };
        }).filter(listing => !!listing.item);

        res.status(200).json(detailedListings);
    } catch (err) {
        console.error("Get My Listings Error:", err);
        res.status(500).json({ message: 'Lỗi khi tải danh sách vật phẩm đang bán.' });
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;
