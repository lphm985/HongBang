import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player, GameEvent, ChatMessage, SpiritualRootId } from './types';
import { REALMS, INITIAL_PLAYER, TECHNIQUES, BODY_STRENGTH_COST, getGuildBonuses, formatNumber, GUILD_CREATION_COST, getGuildNextLevelExp, SPIRITUAL_ROOTS, EQUIPMENT, INSIGHTS, BODY_STRENGTH_REALMS } from './constants';
import Header from './components/Header';
import Auth from './components/Auth';
import PlayerInspectModal from './components/PlayerInspectModal';
import ConfirmationModal from './components/ConfirmationModal';
import Modal from './components/Modal';
import GameLog from './components/GameLog';
import ChatPanel from './components/ChatPanel';


// Import panel components for use in modals
import TechniquesPanel from './components/TechniquesPanel';
import BodyTemperingPanel from './components/BodyTemperingPanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import GuildPanel from './components/GuildPanel';
import TrialGroundsPanel from './components/TrialGroundsPanel';
import AlchemyPanel from './components/AlchemyPanel';
import EquipmentPanel from './components/EquipmentPanel';
import SystemPanel from './components/SystemPanel';
import EnlightenmentPanel from './components/EnlightenmentPanel';
import PvpPanel from './components/PvpPanel';
import MatchHistoryPanel from './components/MatchHistoryPanel';
import MatchDetailsModal from './components/MatchDetailsModal';
import MarketPanel from './components/MarketPanel';
import GuildWarPanel from './components/GuildWarPanel';
// FIX: Correctly import all required icon components.
import { CauldronIcon, ScrollIcon, BodyIcon, SwordIcon, TreasureIcon, EnlightenmentIcon, GuildIcon, LeaderboardIcon, PvpIcon, DesktopIcon, MobileIcon, ChatIcon, ShopIcon, GuildWarIcon } from './components/Icons';


const API_BASE_URL = 'https://hongbang.onrender.com';
const SYNC_INTERVAL_MS = 5000; 

interface ExplorationStatus {
  locationId: string;
  endTime: number; 
}

// --- NEW COMPONENT FOR PC OVERHAUL ---
const PlayerStatus = ({ 
    player, 
    displayQi, 
    qiPerSecond,
    currentRealm, 
    nextRealm, 
    qiProgress,
    combatStats,
    onBreakthrough,
    onAvatarClick,
    avatarRef
}: { 
    player: Player, 
    displayQi: number, 
    qiPerSecond: number,
    currentRealm: any, 
    nextRealm: any, 
    qiProgress: number,
    combatStats: { hp: number, atk: number, def: number },
    onBreakthrough: () => void,
    onAvatarClick: () => void,
    avatarRef: React.RefObject<HTMLDivElement>
}) => {
    const canBreakthrough = player.qi >= currentRealm.qiThreshold && !!nextRealm;
    const spiritualRoot = SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);

    return (
        <div className="panel col-span-12" style={{ gridRow: 'span 2' }}>
            <div className="flex flex-col md:flex-row gap-6 p-4">
                {/* Left Side - Character Info */}
                <div ref={avatarRef} onClick={onAvatarClick} className="flex-shrink-0 flex items-center gap-4 cursor-pointer group">
                    <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-200 group-hover:border-cyan-300 transition-colors">
                        {/* Placeholder for character avatar */}
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">{player.name}</h2>
                        <p className="text-lg text-emerald-400">{currentRealm.name}</p>
                        <p className="text-md text-yellow-400 mt-1 font-semibold">L.Thạch: {formatNumber(player.linh_thach)}</p>
                    </div>
                </div>

                {/* Middle - Stats */}
                <div className="flex-grow grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="stat-item"><span className="text-slate-400">Sinh Lực (HP):</span><span className="font-semibold text-red-400">{formatNumber(combatStats.hp)}</span></div>
                    <div className="stat-item"><span className="text-slate-400">Công Kích (ATK):</span><span className="font-semibold text-orange-400">{formatNumber(combatStats.atk)}</span></div>
                    <div className="stat-item"><span className="text-slate-400">Phòng Ngự (DEF):</span><span className="font-semibold text-sky-400">{formatNumber(combatStats.def)}</span></div>
                    <div className="stat-item"><span className="text-slate-400">Ác Nghiệp:</span><span className="font-semibold text-purple-400">{player.karma}</span></div>
                    <div className="stat-item"><span className="text-slate-400">Linh Căn:</span><span className="font-semibold text-yellow-300">{spiritualRoot?.name || 'Chưa thức tỉnh'}</span></div>
                    <div className="stat-item"><span className="text-slate-400">Vinh Dự:</span><span className="font-semibold text-rose-400">{formatNumber(player.honorPoints)}</span></div>
                </div>

                {/* Right Side - Breakthrough */}
                <div className="w-full md:w-1/3 flex flex-col justify-center space-y-2">
                     <div className="w-full">
                        <div className="flex justify-between items-baseline mb-1 text-xs">
                            <span className="text-slate-400 font-semibold">Linh Khí (+{formatNumber(qiPerSecond)}/s):</span>
                            <span className="font-mono text-white">{formatNumber(displayQi)} / {nextRealm ? formatNumber(currentRealm.qiThreshold) : 'MAX'}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${qiProgress}%` }}></div>
                        </div>
                    </div>
                    <button
                        onClick={onBreakthrough}
                        disabled={!canBreakthrough}
                        className={`w-full px-4 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                        ${canBreakthrough
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white animate-pulse focus:ring-cyan-300'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                          Đột Phá
                      </button>
                </div>
            </div>
        </div>
    );
};

// NEW: Profile Dropdown Component
const ProfileDropdown = ({ onLogout, dropdownRef }: { onLogout: () => void; dropdownRef: React.RefObject<HTMLDivElement> }) => (
    <div ref={dropdownRef} className="absolute top-16 left-4 lg:left-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-48 z-50 animate-fade-in-down">
        <ul className="p-1">
            {/* Future items can be added here */}
            <li>
                <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 text-sm rounded-md text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Đăng Xuất
                </button>
            </li>
        </ul>
    </div>
);


const parsePlayer = (playerData: any): Player => {
    const parsed = { ...INITIAL_PLAYER, ...playerData };
    parsed.qi = Number(parsed.qi || 0);
    parsed.realmIndex = Number(parsed.realmIndex || 0);
    parsed.bodyStrength = Number(parsed.bodyStrength || 0);
    parsed.karma = Number(parsed.karma || 0);
    parsed.honorPoints = Number(parsed.honorPoints || 0);
    parsed.linh_thach = Number(parsed.linh_thach || 0);
    parsed.pills = parsed.pills || {};
    parsed.herbs = parsed.herbs || {};
    parsed.inventory = parsed.inventory || [];
    parsed.equipment = parsed.equipment || {};
    parsed.unlockedInsights = parsed.unlockedInsights || [];
    parsed.purchasedHonorItems = parsed.purchasedHonorItems || [];
    parsed.enlightenmentPoints = Number(parsed.enlightenmentPoints || 0);
    parsed.spiritualRoot = parsed.spiritualRoot || null;
    if (parsed.guildLevel) parsed.guildLevel = Number(parsed.guildLevel);
    if (parsed.guildExp) parsed.guildExp = Number(parsed.guildExp);
    return parsed;
};

type ModalType = 'guild' | 'system' | 'market' | 'guild_war'; // NEW: Add guild_war modal type
type RightPanelTab = 'chat' | 'log' | 'pvp' | 'trial' | 'leaderboard';
type MobilePanelType = 'techniques' | 'body' | 'enlightenment' | 'alchemy' | 'equipment' | 'guild' | 'leaderboard' | 'pvp' | 'trial' | 'market' | 'guild_war';


function App() {
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [displayQi, setDisplayQi] = useState<number>(0);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [explorationStatus, setExplorationStatus] = useState<ExplorationStatus | null>(null);
  const [lastChallengeTime, setLastChallengeTime] = useState<{ [key: string]: number }>({});
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024); // Changed breakpoint
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('chat');
  const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanelType | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [mobileTab, setMobileTab] = useState<'chat' | 'log'>('chat');

  const nextEventId = useRef(0);
  const syncIntervalIdRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const addEvent = useCallback((message: string, type: GameEvent['type']) => {
    setEvents(prevEvents => [
      { id: nextEventId.current++, message, type, timestamp: Date.now() },
      ...prevEvents,
    ].slice(0, 100));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setPlayer(INITIAL_PLAYER);
    setDisplayQi(0);
    setExplorationStatus(null);
    setLastChallengeTime({});
    setEvents([]);
    setIsInitializing(false);
    setIsProfileDropdownOpen(false); // Close dropdown on logout
  }, []);

  // Effect to handle clicking outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isProfileDropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                avatarRef.current &&
                !avatarRef.current.contains(event.target as Node)
            ) {
                setIsProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

  const processServerResponse = useCallback((data: any) => {
    if (data.player) {
      const updatedPlayer = parsePlayer(data.player);
      setPlayer(updatedPlayer);
      setDisplayQi(updatedPlayer.qi);
    }
    if (data.hasOwnProperty('explorationStatus')) setExplorationStatus(data.explorationStatus || null);
    if (data.hasOwnProperty('lastChallengeTime')) setLastChallengeTime(data.lastChallengeTime || {});
    if (data.log) addEvent(data.log.message, data.log.type || 'info');
    if (data.combatLog && Array.isArray(data.combatLog)) {
        data.combatLog.forEach((log: any) => addEvent(log.message, log.type || 'info'));
    }
  }, [addEvent]);

  const syncGame = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/load`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        handleLogout();
        setError('Mất kết nối với máy chủ hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      const data = await response.json();
      processServerResponse(data);
      if(data.player) setDisplayQi(parsePlayer(data.player).qi);
    } catch (err) {
      console.error("Periodic sync failed:", err);
    }
  }, [handleLogout, processServerResponse]);

  const stopSync = useCallback(() => {
    if (syncIntervalIdRef.current) clearInterval(syncIntervalIdRef.current);
    syncIntervalIdRef.current = null;
  }, []);

  const startSync = useCallback(() => {
    stopSync();
    const tokenFromStorage = localStorage.getItem('token');
    if (tokenFromStorage) {
        syncIntervalIdRef.current = window.setInterval(() => syncGame(tokenFromStorage), SYNC_INTERVAL_MS);
    }
  }, [stopSync, syncGame]);

  const sendAction = async (endpoint: string, body?: object) => {
    if (!token) return false;
    stopSync();
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Hành động thất bại.');
        }
        processServerResponse(data);
        return true;
    } catch (err) {
        addEvent((err as Error).message, 'danger');
        return false;
    } finally {
        startSync();
    }
  };

  const onLoginSuccess = useCallback((token: string, playerName: string) => {
    localStorage.setItem('token', token);
    setToken(token);
    setIsAuthenticated(true);
    setIsInitializing(true);

    const loadInitialData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/load`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load initial data.');
            const data = await response.json();
            
            if (data.player.spiritualRoot === null) {
                addEvent(`Bạn đã được trời ban ${SPIRITUAL_ROOTS.find(r => r.id === data.player.spiritualRoot)?.name || 'Linh Căn'}.`, 'success');
            }
            processServerResponse(data);
            startSync();
        } catch (err) {
            console.error(err);
            setError("Không thể tải dữ liệu người chơi. Vui lòng thử lại.");
            handleLogout();
        } finally {
            setIsInitializing(false);
        }
    };
    loadInitialData();
  }, [processServerResponse, startSync, handleLogout]);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('token');
    if (tokenFromStorage) {
      onLoginSuccess(tokenFromStorage, '');
    } else {
      setIsInitializing(false);
    }
     const handleResize = () => setIsMobileView(window.innerWidth < 1024);
     window.addEventListener('resize', handleResize);
     return () => window.removeEventListener('resize', handleResize);
  }, [onLoginSuccess]);
  
  const currentRealm = useMemo(() => REALMS[player.realmIndex], [player.realmIndex]);
  const nextRealm = useMemo(() => REALMS[player.realmIndex + 1], [player.realmIndex]);
  
  const bonuses = useMemo(() => {
    let qiMultiplier = 1;
    let breakthroughBonus = 0;
    let qiPerSecondAdd = 0;

    if (player.activeTechniqueId) {
        const tech = TECHNIQUES.find(t => t.id === player.activeTechniqueId);
        tech?.bonuses.forEach(b => {
            if (b.type === 'qi_per_second_multiplier') qiMultiplier *= b.value;
            if (b.type === 'breakthrough_chance_add') breakthroughBonus += b.value;
        });
    }
     if (player.guildId && player.guildLevel) {
        const guildBonus = getGuildBonuses(player.guildLevel);
        qiMultiplier *= (1 + guildBonus.qiBonus);
        breakthroughBonus += guildBonus.breakthroughBonus;
    }
     if (player.spiritualRoot) {
        const root = SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
        if (root?.bonus.type === 'qi_per_second_add') qiPerSecondAdd += root.bonus.value;
    }
    
    Object.values(player.equipment).forEach(itemId => {
        if (!itemId) return;
        const item = EQUIPMENT.find(t => t.id === itemId);
        item?.bonuses.forEach(b => {
            if (b.type === 'qi_per_second_multiplier') qiMultiplier *= b.value;
            if (b.type === 'breakthrough_chance_add') breakthroughBonus += b.value;
        });
    });

     if (player.unlockedInsights) {
        player.unlockedInsights.forEach(id => {
            const insight = INSIGHTS.find(i => i.id === id);
            if (insight?.bonus.type === 'qi_per_second_base_add') qiPerSecondAdd += insight.bonus.value;
        });
    }

    return { qiMultiplier, breakthroughBonus, qiPerSecondAdd };
  }, [player.activeTechniqueId, player.guildId, player.guildLevel, player.spiritualRoot, player.equipment, player.unlockedInsights]);


  const qiPerSecond = useMemo(() => {
    if (explorationStatus) return 0;
    return (currentRealm.baseQiPerSecond * bonuses.qiMultiplier) + bonuses.qiPerSecondAdd;
  }, [currentRealm, bonuses, explorationStatus]);
  
    const combatStats = useMemo(() => {
    const realm = REALMS[player.realmIndex];
    if (!realm) return { hp: 0, atk: 0, def: 0 };
    
    // Calculate base stats
    const baseHp = realm.baseHp + (player.bodyStrength * 10);
    const baseAtk = realm.baseAtk + (player.bodyStrength * 0.5); // Rebalanced ATK
    const baseDef = realm.baseDef + (player.bodyStrength * 1.5);

    // Apply bonuses
    let hpMul = 1, atkMul = 1, defMul = 1;
    let hpAdd = 0, atkAdd = 0, defAdd = 0;

    // Spiritual Root
    const root = SPIRITUAL_ROOTS.find(r => r.id === player.spiritualRoot);
    if (root) {
        if (root.bonus.type === 'hp_mul') hpMul *= root.bonus.value;
        if (root.bonus.type === 'atk_mul') atkMul *= root.bonus.value;
        if (root.bonus.type === 'def_mul') defMul *= root.bonus.value;
    }
    
    // Equipped Equipment
    Object.values(player.equipment).forEach(itemId => {
        if (!itemId) return;
        const item = EQUIPMENT.find(eq => eq.id === itemId);
        if (item) {
            item.bonuses.forEach(b => {
                if (b.type === 'hp_add') hpAdd += b.value;
                if (b.type === 'atk_add') atkAdd += b.value;
                if (b.type === 'def_add') defAdd += b.value;
                if (b.type === 'hp_mul') hpMul *= b.value;
                if (b.type === 'atk_mul') atkMul *= b.value;
                if (b.type === 'def_mul') defMul *= b.value;
            });
        }
    });

    return {
        hp: Math.floor((baseHp + hpAdd) * hpMul),
        atk: Math.floor((baseAtk + atkAdd) * atkMul),
        def: Math.floor((baseDef + defAdd) * defMul),
    };
  }, [player.realmIndex, player.bodyStrength, player.spiritualRoot, player.equipment]);


  useEffect(() => {
    const timer = setInterval(() => {
      setPlayer(prev => {
        const newQi = prev.qi + qiPerSecond;
        const qiCap = currentRealm.qiThreshold === Infinity ? newQi : currentRealm.qiThreshold;
        return { ...prev, qi: Math.min(newQi, qiCap) };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qiPerSecond, currentRealm]);
  
  useEffect(() => {
    setDisplayQi(player.qi);
  }, [player.qi]);

  const handleBreakthrough = useCallback(async () => {
    if (player.qi < currentRealm.qiThreshold || !nextRealm) return;
    await sendAction('/breakthrough');
  }, [player.qi, currentRealm, nextRealm, sendAction]);

  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmation({ isOpen: true, title, message, onConfirm });
  };
  
  const handleConfirm = () => {
    if (confirmation) {
      confirmation.onConfirm();
      setConfirmation(null);
    }
  };

  const handleCancel = () => setConfirmation(null);

  const renderModalContent = () => {
    switch(activeModal) {
      case 'guild': return <GuildPanel player={player} token={token} onCreateGuild={(name) => sendAction('/guilds/create', { guildName: name })} onJoinGuild={(id) => sendAction(`/guilds/join/${id}`)} onLeaveGuild={() => sendAction('/guilds/leave')} onContributeToGuild={(amount) => sendAction('/guilds/contribute', { amount })} onInspectPlayer={setInspectingPlayer} showConfirmation={showConfirmation} />;
      case 'system': return <SystemPanel token={token} onRedeemCode={(code) => sendAction('/redeem-code', { code })} />;
      case 'market': return <MarketPanel token={token} onAction={sendAction} showConfirmation={showConfirmation} />;
      case 'guild_war': return <GuildWarPanel token={token} player={player} />;
      default: return null;
    }
  };
  
   const renderRightPanelContent = () => {
    switch (rightPanelTab) {
        case 'chat': return <ChatPanel token={token} />;
        case 'log': return <GameLog events={events} />;
        case 'pvp': return <PvpPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={processServerResponse} addEvent={addEvent} onBuyHonorItem={(itemId) => sendAction('/pvp/shop/buy', { itemId })} />;
        case 'trial': return <TrialGroundsPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={processServerResponse} addEvent={addEvent} />;
        case 'leaderboard': return <LeaderboardPanel token={token} onInspectPlayer={setInspectingPlayer} />;
        default: return null;
    }
  };

  const modalTitles: Record<ModalType, string> = {
    guild: "Tông Môn", system: "Hệ Thống & Sự Kiện", market: "Chợ Giao Dịch", guild_war: "Tông Môn Chiến"
  };

  if (isInitializing) return <div className="min-h-screen flex items-center justify-center"><h1>Đang tải...</h1></div>;
  if (!isAuthenticated) return <Auth onLoginSuccess={onLoginSuccess} />;

  const qiProgress = (displayQi / currentRealm.qiThreshold) * 100;
  
  const actionButtons: { type: MobilePanelType, label: string, icon: JSX.Element }[] = [
    { type: 'techniques', label: 'Công Pháp', icon: <ScrollIcon className="h-6 w-6" /> },
    { type: 'body', label: 'Luyện Thể', icon: <BodyIcon className="h-6 w-6" /> },
    { type: 'enlightenment', label: 'Lĩnh Ngộ', icon: <EnlightenmentIcon className="h-6 w-6" /> },
    { type: 'alchemy', label: 'Luyện Đan', icon: <CauldronIcon className="h-6 w-6" /> },
    { type: 'equipment', label: 'Trang Bị', icon: <TreasureIcon className="h-6 w-6" /> },
    { type: 'market', label: 'Chợ', icon: <ShopIcon className="h-6 w-6" /> },
  ];
  
  const mobilePanelTitles: Record<MobilePanelType, string> = {
      techniques: 'Công Pháp',
      body: 'Luyện Thể & Thám Hiểm',
      enlightenment: 'Lĩnh Ngộ',
      alchemy: 'Luyện Đan',
      equipment: 'Trang Bị',
      guild: 'Tông Môn',
      leaderboard: 'Thiên Địa Bảng',
      pvp: 'Đấu Pháp',
      trial: 'Thí Luyện Chi Địa',
      market: 'Chợ Giao Dịch',
      guild_war: 'Tông Môn Chiến',
  };

  const renderMobilePanelContent = () => {
      switch (activeMobilePanel) {
          case 'techniques': return <TechniquesPanel player={player} onActivateTechnique={(id) => sendAction('/activate-technique', { techniqueId: id })} />;
          case 'body': return <BodyTemperingPanel player={player} onTemperBody={() => sendAction('/temper-body')} onStartExploration={(loc) => sendAction('/start-exploration', { locationId: loc.id })} explorationStatus={explorationStatus} />;
          case 'enlightenment': return <EnlightenmentPanel player={player} onUnlockInsight={(id) => sendAction('/unlock-insight', { insightId: id })} />;
          case 'alchemy': return <AlchemyPanel player={player} onCraftPill={(id) => sendAction('/alchemy/craft', { recipeId: id })} onUsePill={(id) => sendAction('/alchemy/use', { pillId: id })} />;
          case 'equipment': return <EquipmentPanel player={player} onEquipItem={(id) => sendAction('/equip-item', { itemId: id })} onListItem={(itemId, price) => sendAction('/market/list', { itemId, price })} />;
          case 'guild': return <GuildPanel player={player} token={token} onCreateGuild={(name) => sendAction('/guilds/create', { guildName: name })} onJoinGuild={(id) => sendAction(`/guilds/join/${id}`)} onLeaveGuild={() => sendAction('/guilds/leave')} onContributeToGuild={(amount) => sendAction('/guilds/contribute', { amount })} onInspectPlayer={setInspectingPlayer} showConfirmation={showConfirmation} />;
          case 'leaderboard': return <LeaderboardPanel token={token} onInspectPlayer={setInspectingPlayer} />;
          case 'pvp': return <PvpPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={processServerResponse} addEvent={addEvent} onBuyHonorItem={(itemId) => sendAction('/pvp/shop/buy', { itemId })} />;
          case 'trial': return <TrialGroundsPanel player={player} token={token} lastChallengeTime={lastChallengeTime} onChallengeResult={processServerResponse} addEvent={addEvent} />;
          case 'market': return <MarketPanel token={token} onAction={sendAction} showConfirmation={showConfirmation} />;
          case 'guild_war': return <GuildWarPanel token={token} player={player} />;
          default: return null;
      }
  };
  

  if (isMobileView) {
    const getMobileTabClass = (tabName: 'chat' | 'log') => {
        return `flex-1 py-2 text-sm font-medium transition-colors duration-200 flex items-center justify-center ${
          mobileTab === tabName
            ? 'bg-slate-700 text-cyan-300'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
        }`;
    };
    return (
        <div className="min-h-screen w-full flex flex-col p-2 relative font-sans text-slate-300">
            {/* Modals */}
            {activeMobilePanel && <Modal title={mobilePanelTitles[activeMobilePanel]} onClose={() => setActiveMobilePanel(null)}>{renderMobilePanelContent()}</Modal>}
            {confirmation?.isOpen && <ConfirmationModal {...confirmation} onCancel={handleCancel} onConfirm={handleConfirm} />}
            {inspectingPlayer && <PlayerInspectModal playerName={inspectingPlayer} token={token!} onClose={() => setInspectingPlayer(null)} />}
             {isProfileDropdownOpen && <ProfileDropdown onLogout={handleLogout} dropdownRef={dropdownRef} />}

            {/* Top Bar */}
             <div className="flex justify-between items-center p-2 rounded-lg bg-slate-900/50 border border-slate-700 mb-2 flex-shrink-0">
                <div ref={avatarRef} onClick={() => setIsProfileDropdownOpen(prev => !prev)} className="flex items-center space-x-2 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 group-hover:ring-2 group-hover:ring-cyan-400 transition-all"></div>
                    <div>
                        <p className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{player.name}</p>
                        <p className="text-xs text-emerald-400">{currentRealm.name}</p>
                    </div>
                </div>
                 <div className="flex items-center space-x-3 text-sm">
                    <div className="p-1 px-2 rounded-full bg-slate-800 border border-slate-600">
                         <span>Vinh Dự: </span>
                         <span className="font-semibold text-rose-400">{formatNumber(player.honorPoints)}</span>
                    </div>
                     <div className="p-1 px-2 rounded-full bg-slate-800 border border-slate-600">
                         <span>L.Thạch: </span>
                         <span className="font-semibold text-yellow-400">{formatNumber(player.linh_thach)}</span>
                    </div>
                </div>
            </div>

            {/* Main Scrollable Content */}
            <main className="flex-grow overflow-y-auto space-y-4 pb-20">
                {/* Event Box */}
                <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700/80 p-3 flex flex-col h-40">
                    <h2 className="text-md font-semibold text-cyan-300 border-b border-slate-600 pb-1 mb-1 flex-shrink-0">Sự Kiện</h2>
                    <div className="overflow-y-auto flex-grow pr-1 text-xs">
                        {events.slice(0, 5).map(event => (
                            <p key={event.id} className="text-slate-400 border-b border-slate-700/50 py-1 truncate">{event.message}</p>
                        ))}
                        {events.length === 0 && <p className="text-center text-slate-500 pt-4">Không có sự kiện nào.</p>}
                    </div>
                </div>

                {/* Chat/Log Box */}
                <div className="bg-slate-800/50 rounded-lg shadow-lg border border-slate-700 flex flex-col h-80">
                    <div className="flex flex-shrink-0">
                        <button onClick={() => setMobileTab('chat')} className={`${getMobileTabClass('chat')} rounded-tl-lg`}>
                            <ChatIcon className="w-4 h-4 mr-1" /> Thế Giới
                        </button>
                        <button onClick={() => setMobileTab('log')} className={`${getMobileTabClass('log')} rounded-tr-lg`}>
                            <ScrollIcon className="w-4 h-4 mr-1" /> Nhật Ký
                        </button>
                    </div>
                    <div className="flex-grow p-3 min-h-0">
                        {mobileTab === 'log' && <GameLog events={events} />}
                        {mobileTab === 'chat' && <ChatPanel token={token} />}
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="text-center space-y-3 pt-4">
                     <div className="grid grid-cols-3 gap-3 px-4">
                         {actionButtons.map(btn => (
                           <button key={btn.type} onClick={() => setActiveMobilePanel(btn.type)} className="p-2 bg-slate-800 border border-slate-600 rounded-lg flex flex-col items-center justify-center space-y-1 text-white hover:bg-slate-700">
                                {React.cloneElement(btn.icon, { className: 'w-6 h-6' })}
                                <span className="text-xs">{btn.label}</span>
                            </button>
                        ))}
                         <button onClick={() => setActiveMobilePanel('guild')} className="p-2 bg-slate-800 border border-slate-600 rounded-lg flex flex-col items-center justify-center space-y-1 text-white hover:bg-slate-700">
                             <GuildIcon className="w-6 h-6" />
                             <span className="text-xs">Tông Môn</span>
                         </button>
                         <button onClick={() => setActiveMobilePanel('guild_war')} className="p-2 bg-red-800 border border-red-600 rounded-lg flex flex-col items-center justify-center space-y-1 text-white hover:bg-red-700">
                             <GuildWarIcon className="w-6 h-6" />
                             <span className="text-xs">T.Môn Chiến</span>
                         </button>
                    </div>
                    <div className="px-4">
                        <button
                          onClick={handleBreakthrough}
                          disabled={!(player.qi >= currentRealm.qiThreshold && !!nextRealm)}
                          className={`w-full px-4 py-3 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50
                          ${(player.qi >= currentRealm.qiThreshold && !!nextRealm)
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white animate-pulse focus:ring-cyan-300'
                              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                            Đột Phá Cảnh Giới
                        </button>
                    </div>
                </div>
            </main>
            
            {/* Floating Side Buttons */}
            <div className="fixed top-1/4 right-1 flex flex-col space-y-2">
                 <button onClick={() => setActiveMobilePanel('leaderboard')} className="w-10 h-10 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><LeaderboardIcon className="w-5 h-5"/></button>
                 <button onClick={() => setActiveMobilePanel('pvp')} className="w-10 h-10 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><PvpIcon className="w-5 h-5"/></button>
            </div>
            <button onClick={() => setActiveMobilePanel('trial')} className="fixed bottom-24 right-2 w-16 h-16 bg-red-800/80 border border-red-600 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-lg">
                <SwordIcon className="w-8 h-8"/>
            </button>
            
            {/* Bottom Qi Bar (Fixed) */}
            <div className="fixed bottom-0 left-0 right-0 p-2 bg-slate-900 border-t border-slate-700">
                <div className="flex justify-between items-baseline mb-1 text-sm">
                    <span className="text-slate-300 font-semibold">Linh Khí:</span>
                    <span className="font-mono text-white">{formatNumber(displayQi)} / {nextRealm ? formatNumber(currentRealm.qiThreshold) : 'MAX'}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-100 ease-linear" style={{ width: `${qiProgress}%` }}></div>
                </div>
            </div>

            {/* View Toggle Button */}
            <button onClick={() => setIsMobileView(false)} className="fixed bottom-2 left-2 p-2 bg-slate-700/80 rounded-full text-white border border-slate-500">
                <DesktopIcon className="w-6 h-6"/>
            </button>
        </div>
    );
}

  return (
    <div className="min-h-screen flex flex-col p-4 space-y-4">
      <Header />
       {isProfileDropdownOpen && <ProfileDropdown onLogout={handleLogout} dropdownRef={dropdownRef} />}
      <main className="w-full max-w-screen-2xl mx-auto grid grid-cols-12 gap-4 flex-grow" style={{ gridTemplateRows: 'auto 1fr' }}>

        <PlayerStatus 
            player={player} 
            displayQi={displayQi}
            qiPerSecond={qiPerSecond} 
            currentRealm={currentRealm} 
            nextRealm={nextRealm} 
            qiProgress={qiProgress} 
            combatStats={combatStats}
            onBreakthrough={handleBreakthrough}
            avatarRef={avatarRef}
            onAvatarClick={() => setIsProfileDropdownOpen(prev => !prev)}
        />
        
        {/* --- Left Column - Main Action Panels --- */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel">
                <div className="panel-header"><h3 className="text-lg font-semibold text-emerald-400">Công Pháp & Lĩnh Ngộ</h3></div>
                <div className="panel-content grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <TechniquesPanel player={player} onActivateTechnique={(id) => sendAction('/activate-technique', { techniqueId: id })} />
                    <EnlightenmentPanel player={player} onUnlockInsight={(id) => sendAction('/unlock-insight', { insightId: id })} />
                </div>
            </div>
             <div className="panel">
                <div className="panel-header"><h3 className="text-lg font-semibold text-emerald-400">Luyện Thể & Thám Hiểm</h3></div>
                <div className="panel-content">
                     <BodyTemperingPanel player={player} onTemperBody={() => sendAction('/temper-body')} onStartExploration={(loc) => sendAction('/start-exploration', { locationId: loc.id })} explorationStatus={explorationStatus} />
                </div>
            </div>
             <div className="panel">
                <div className="panel-header"><h3 className="text-lg font-semibold text-emerald-400">Luyện Đan</h3></div>
                <div className="panel-content">
                    <AlchemyPanel player={player} onCraftPill={(id) => sendAction('/alchemy/craft', { recipeId: id })} onUsePill={(id) => sendAction('/alchemy/use', { pillId: id })} />
                </div>
            </div>
             <div className="panel">
                <div className="panel-header"><h3 className="text-lg font-semibold text-emerald-400">Trang Bị & Tông Môn</h3></div>
                <div className="panel-content grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <EquipmentPanel player={player} onEquipItem={(id) => sendAction('/equip-item', { itemId: id })} onListItem={(itemId, price) => sendAction('/market/list', { itemId, price })} />
                     <div className="flex flex-col space-y-4">
                         <button onClick={() => setActiveModal('market')} className="w-full flex items-center justify-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white shadow-lg transition-transform hover:scale-105">
                            <ShopIcon className="mr-3"/> Chợ Giao Dịch
                        </button>
                        <button onClick={() => setActiveModal('guild')} className="w-full flex items-center justify-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white shadow-lg transition-transform hover:scale-105">
                            <GuildIcon className="mr-3"/> Quản Lý Tông Môn
                        </button>
                        <button onClick={() => setActiveModal('guild_war')} className="w-full flex items-center justify-center p-3 rounded-lg bg-red-800 hover:bg-red-700 border border-red-600 text-white shadow-lg transition-transform hover:scale-105">
                            <GuildWarIcon className="mr-3"/> Tông Môn Chiến
                        </button>
                         <button onClick={() => setActiveModal('system')} className="w-full flex items-center justify-center p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white shadow-lg transition-transform hover:scale-105">
                            <EnlightenmentIcon className="mr-3"/> Hệ Thống & Sự Kiện
                        </button>
                     </div>
                </div>
            </div>
        </div>
        
        {/* --- Right Column - Social & Combat --- */}
        <div className="panel col-span-12 lg:col-span-4">
            <div className="panel-header flex">
                {(['chat', 'log', 'pvp', 'trial', 'leaderboard'] as RightPanelTab[]).map(tab => (
                    <button key={tab} onClick={() => setRightPanelTab(tab)} className={`right-panel-tab ${rightPanelTab === tab ? 'active' : ''}`}>
                       {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <div className="panel-content h-96 overflow-y-auto">
              {renderRightPanelContent()}
            </div>
        </div>

      </main>

        {/* --- Modals and Overlays --- */}
        {activeModal && <Modal title={modalTitles[activeModal]} onClose={() => setActiveModal(null)}>{renderModalContent()}</Modal>}
        {confirmation?.isOpen && <ConfirmationModal {...confirmation} onCancel={handleCancel} onConfirm={handleConfirm} />}
        {inspectingPlayer && <PlayerInspectModal playerName={inspectingPlayer} token={token!} onClose={() => setInspectingPlayer(null)} />}
        <button onClick={() => setIsMobileView(true)} className="fixed bottom-4 left-4 p-3 bg-slate-700/80 rounded-full text-white border border-slate-500 hidden md:block">
            <MobileIcon className="w-7 h-7"/>
        </button>
    </div>
  );
}

export default App;
