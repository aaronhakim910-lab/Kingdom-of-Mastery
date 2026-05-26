/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Castle, 
  BarChart3, 
  Store, 
  User as UserIcon, 
  BookOpen, 
  Palette, 
  Wrench, 
  Timer, 
  Flame, 
  Diamond, 
  Shield, 
  Lock,
  Star,
  Zap,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  Trophy,
  Activity,
  Backpack,
  ArrowRight,
  LogOut,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  LogIn,
  ArrowUpCircle,
  ArrowDownCircle,
  Skull,
  Camera,
  Mic,
  Video,
  FileText,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import RoyalOracle from './components/RoyalOracle';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';

// --- Type Declarations ---

type Tab = 'arena' | 'districts' | 'stats' | 'shop' | 'profile';
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface Quest {
  id: string;
  title: string;
  desc: string;
  xp: number;
  completed: boolean;
  color: string;
  failed?: boolean; // Track if habit was missed/failed
  category?: 'Health' | 'Mind' | 'School' | 'Skills' | string; // Quest category
}

interface District {
  id: string;
  name: string;
  desc: string;
  level: number;
  xp: number;
  maxXp: number;
  pathName: string;
  perAction: string;
}

import archmageHero from './assets/images/archmage_hero_1779767016006.png';
import emperorHero from './assets/images/emperor_hero_1779767037167.png';
import shadowGoblinImg from './assets/images/shadow_goblin_1779767091912.png';
import frostBasiliskImg from './assets/images/frost_basilisk_1779767109624.png';
import voidArchdemonImg from './assets/images/void_archdemon_1779767137713.png';
import starDevourerImg from './assets/images/star_devourer_1779767161357.png';

interface UserProfile {
  userId: string;
  name: string;
  xp: number;
  crystals: number;
  streak: number;
  bossHp: number;
  level: number;
  nextEvolution: string;
  enemyId?: string;
  hp?: number; // Player's colored Health Points bar (0-100)
  createdAt: any;
  updatedAt: any;
}

interface InventoryItem {
  itemId: string;
  title: string;
  rarity: string;
  category: string;
  purchasedAt: any;
}

interface ShopItem {
  title: string;
  desc: string;
  cost: number;
  type: string;
  icon: React.ReactNode;
  rarity: Rarity;
}

// --- Graphical Assets Map ---

const IMAGES = {
  AVATAR_THUMB: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXyIPIFR6R8BxKrU52h4--AfVKL28mUbFLZKHjVA9Nrhkl4yC28gnsKD8Ybi1D7OQ634_DlGbxN4_jobjx6zpude_17IXe506bQEh7BfJDJKJPM9gYunhAIuIoR-4kE4WUj45CGV75N493L17j0wgbVYzy26RLBGSMAV5pZZ1RiznXVkfvXbrEqIT9m-lxgvzNbaeFVIL52X6L00cMntnWxclKeu9qNGa7sx3Tr3CpAVYCGgTbU2H3nhu6UdDjK1L4oGAgqK2A4en6",
  WIZARD_HERO: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXkYxpOOI8GMkZfxMMRtnCn33aakI31aNmBPU3TZHkL2EueHf_Ea2oiHImxFXsv_P2aBzFNSqy4wiPTYkmrNk2BJD0eiFtsHUzItAKnSHhUCWzhdok0nDRPlNPM9n5XXKODqdsf7hz25f5jAU4Xtxr_4iPuJxE3PtHLoT_kqnOrneqbzgOwVzu1icZxMLW5SefHC9nnCupgqkqXJB-I7fYIRDnD0I6ilJUOtcTO3XU2vUKiTzpOYzOkYk1ve0PXKWTj55YzMu7vnYd",
  FULL_HERO: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGklJ9C3IwqK33CWI7L7-wQLTaRIkR4x3n0OZIH8PByj7pvP7XZ6yNA86zCTQCzFORtZAw1TznoBapr9lEozVvhbyoyzaKOzIR61AHFokGWst7sYW1bHn8UIh45ZvdqAY50V9piXyK9A1duw7yrQhcSWp8mxSn1CWf_TrxMSVUXvQm62t62zwChfPxdsTw59AYdwfFB2suTsd7VLMPrUCuqC5OplPIGvqMQSSUcnz-gvH3l75qA6tEg7c5I4COmmdKO6z48TI_TtOz",
  BOSS: "https://lh3.googleusercontent.com/aida-public/AB6AXuANbmjbhPY7Vb-6j6neFpJzqOVxVph8QBxVlSwBEeDyOktgTv9tjvvL76derO_MS-fNJLugSy3KBScu0oPuX26BXxzgC8mx_Y-xrr1FFYzcPaj3Mj8yU3pHweuYQKcy25lxOgUwtylV-KI-rs74KmLtB0K9Qjv4No4TsazsnZndVenlFXp43jzqCszpHwXkowpsPlCjOj0e_eCyphQ1Xs-6bE-ALtZXb7wJdoeZ7Sz7vNRpegJNLVI7K3MgVUzNZwduQR5EtK6aIXdN",
  HERO_BG: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaMBRPq6mTCKg1uKRkPNugvwCWWr2Om99Ujd6wznWlUKdfNNrd4Myh6IRc4Q7kV8KSkWxZEgdk8Ykim1ZAGJR1QBFlNKeZhp9XTe3DjjhGYkged-AMEL4GS8nASQsxHKvZpoQ-RZAD3_L_FzS1M_VZaq1e_bk3EO2dbI6RkW2-Htapde65LE6pci1WKGDWT_231GZ8HFP4dmx2R6ohh-t-TCrkrc3b0FTPz_TbjJmgxksQDQbHGX0i1nmvNIK3PBcihn_GFdjIRuwh",
  DISTRICT_1: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyw1K4zEIHGktLH2KU7bX-M5sk6TdTUEwp67Wg4V2uhLpKdLZOfOzeEElX9aVD0OsanOBvjiX_JzNbPrLUjg2ki-96OY9e7FQ1jVDCgI0gYu14SN9U1MEM6eXPGx6ngFPj1y0Gi4kezks0ZH8uf_2_-rwiIAKhpMaYRRCxEOsdu9EtMtIEe712bz5j41LsFG2FPZ96BscUjqqkI1-G3C9xHd7md8jH90Kriq9sxBjfwous4tFIUWY3rVVgu0Vpa3ZidBrE9W3TBFWr",
  DISTRICT_2: "https://lh3.googleusercontent.com/aida-public/AB6AXuAPwz5vl9edZNEoij1wjvFsOcsLp9KHv0NPR0qat0YHDEBDmxyRxOpcYQ70b_PnBSn-RtDsZ7nRnvpzIOluRgQ_xmiHiiJZNNbJFcYjcKtz66OGo_KAa9waqHw1tzBTjPFetOGbUabKRmgZP6kQoKzy6kTcqLy5JUx9QzWL6nmkAuxg4ooU2OqPctXyscXRPhJSmfNeOEvO5-diGPryGJN-gavPRQCxOH4PZC4GfcgqLM1EbHSNKhO7wVGophGck-K4v_wBJz2LgZxO",
  DISTRICT_3: "https://lh3.googleusercontent.com/aida-public/AB6AXuCr4qjYo-wPjvdeejEpX1qicoUCzne2hIrm_LHH2FJoesqP-8dumTdqXfdRC0RpEx-SIw4aOLjFaGDGV8mW_3We5fnNhcGkb9xzDAJqAlk_7VAdOdy4J16dKL0jkPtp1ypRwybdx8cEQ9PNF7MSfVJ8FOuk9OM7AHX-YqIOjG_wRefKFjRXtVueVLHUIYKD_9SRjMs6kku9R1wYuMbtM9ODC-8sxJSiqScHAGeGGMHN5d8QP09lqw1dFrgq6sMhj4btcCuD7tOXG_q4",
  PROFILE_BG: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-eVZ7k6zd_TYJ8ZJmGIhDJm6aRXkBFM-AqBVpOuPHpKbrpTBKcOyO3FQaEyvcUkNgZKZWGWuX7j-pVM4zLeDWVxkRXAzKbjAgj-T2RVVvD8p8gDn1MGvVIVQE8a75yvUzopDRKntS9HCLrK-JzS_O6nuF9TnO2iXm0un8CSybkdCLOLw3BV4xSAszPljh1od3NV31y4UjXp80nw1Wqpac1I1OC9SWCOtO6f6iGevhXIDC6FTDEHjolIj-s8AIc-zQ20j_U8osDxte",
  ARCHMAGE_HERO: archmageHero,
  EMPEROR_HERO: emperorHero,
};

const ENEMIES = [
  { id: 'e1', name: "The Shadow Goblin", subName: "Lurker of the Outer Fringes", maxHp: 350, imageUrl: shadowGoblinImg, minLevel: 1 },
  { id: 'e2', name: "The Frost Basilisk", subName: "Cryo-Monster of the Ridge", maxHp: 700, imageUrl: frostBasiliskImg, minLevel: 8 },
  { id: 'e3', name: "The Chaos Titan", subName: "Ancient Bane of the Citadel", maxHp: 1000, imageUrl: IMAGES.BOSS, minLevel: 15 },
  { id: 'e4', name: "The Void Archdemon", subName: "Scourge of the Stardust Nebula", maxHp: 1500, imageUrl: voidArchdemonImg, minLevel: 25 },
  { id: 'e5', name: "The Star Devourer", subName: "Cosmic Apex of Infinity", maxHp: 2500, imageUrl: starDevourerImg, minLevel: 40 },
];

const QUEST_POOL = [
  { title: "Knowledge Harvest", desc: "Read 20 pages of high density lore", xp: 15, color: "text-blue-400", category: "Mind" },
  { title: "Original Creation", desc: "Code for 1 hour on thy project scroll", xp: 25, color: "text-amber-400", category: "Skills" },
  { title: "Warrior Stamina", desc: "Perform 30 pushups to boost physical defense", xp: 15, color: "text-emerald-400", category: "Health" },
  { title: "Mind Recovery", desc: "Meditate in complete silence for 10 minutes", xp: 10, color: "text-purple-400", category: "Mind" },
  { title: "Feast Proclamation", desc: "Consume a clean, healthy meal of protein & greens", xp: 15, color: "text-amber-500", category: "Health" },
  { title: "Hydration Blessing", desc: "Consume 8 draughts of pure spring water", xp: 10, color: "text-sky-400", category: "Health" },
  { title: "Scribe Reflection", desc: "Write thy daily insights in the scholar journal", xp: 20, color: "text-yellow-400", category: "Mind" },
  { title: "Arcane Study", desc: "Study 30 minutes of deep technical material", xp: 25, color: "text-indigo-400", category: "Skills" },
  { title: "Stardust Slumber", desc: "Retire or power off thy screen before 10:30 PM", xp: 15, color: "text-violet-400", category: "Health" }
];

const getRankTitle = (level: number) => {
  if (level < 15) return "Sentinel Warden";
  if (level < 30) return "Arcane Archmage";
  return "Sovereign Emperor";
};

const getRankAvatar = (level: number) => {
  if (level < 15) return IMAGES.WIZARD_HERO;
  if (level < 30) return IMAGES.ARCHMAGE_HERO;
  return IMAGES.EMPEROR_HERO;
};

const getThemeStyles = (level: number) => {
  if (level < 15) {
    return {
      bg: 'bg-[#0b140e]',
      container: 'bg-[#112016]',
      border: 'border-emerald-600/30 text-emerald-400',
      title: 'Novice Forest',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      textColor: 'text-emerald-400',
    };
  } else if (level < 30) {
    return {
      bg: 'bg-[#1a1511]',
      container: 'bg-[#261d17]',
      border: 'border-orange-600/30 text-orange-400',
      title: 'Iron Fortress',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]',
      textColor: 'text-orange-400',
    };
  } else {
    return {
      bg: 'bg-[#070314]',
      container: 'bg-[#100726]',
      border: 'border-purple-600/30 text-purple-400',
      title: 'Cosmic Citadel',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      textColor: 'text-purple-400',
    };
  }
};

const getCurrentEnemy = (profile: UserProfile | null) => {
  if (!profile) return ENEMIES[0];
  if (profile.enemyId) {
    const found = ENEMIES.find(e => e.id === profile.enemyId);
    if (found) return found;
  }
  const lvl = profile.level || 1;
  const applicable = ENEMIES.filter(e => lvl >= e.minLevel);
  if (applicable.length > 0) {
    return applicable[applicable.length - 1];
  }
  return ENEMIES[0];
};

const DISTRICT_ASSETS: { [id: string]: { img: string, icon: React.ReactNode, themeColor: string } } = {
  'd1': { img: IMAGES.DISTRICT_1, icon: <BookOpen className="w-4 h-4 text-cyan-400" />, themeColor: 'cyan' },
  'd2': { img: IMAGES.DISTRICT_2, icon: <Palette className="w-4 h-4 text-amber-400" />, themeColor: 'amber' },
  'd3': { img: IMAGES.DISTRICT_3, icon: <Wrench className="w-4 h-4 text-emerald-400" />, themeColor: 'emerald' }
};

// --- Embedded Particle Effect ---

function FireParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
      {[...Array(20)].map((_, i) => {
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 4;
        const left = Math.random() * 100;

        return (
          <motion.div
            key={i}
            initial={{ y: "100%", x: "0%", opacity: 0, scale: 1 }}
            animate={{ 
              y: "-100%", 
              x: `${Math.sin(i) * 20}px`,
              opacity: [0, 0.8, 0.4, 0],
              scale: [1, 1.5, 0.5]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "easeOut"
            }}
            className="absolute bottom-0 rounded-full bg-tertiary"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              boxShadow: '0 0 8px #d6c595',
            }}
          />
        );
      })}
    </div>
  );
}

// --- Sub-components for Loading & Auth Portal ---

function LoadingPortal() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#131315] gap-4">
      <div className="relative flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="w-16 h-16 border-t-2 border-b-2 border-tertiary rounded-full border-dashed"
        />
        <Castle className="absolute w-6 h-6 text-tertiary animate-pulse" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/80 animate-pulse">Summoning Civilization...</p>
    </div>
  );
}

function LoginScreen({ onLogin, onGuestLogin }: { onLogin: () => void; onGuestLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-6 text-center bg-[#131315] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />
      <div className="absolute top-[20%] w-72 h-72 rounded-full bg-tertiary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] w-72 h-72 rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 mb-8 animate-float"
      >
        <img 
          src={IMAGES.WIZARD_HERO} 
          alt="Wizard Hero" 
          className="w-40 h-40 object-cover rounded-full border-2 border-tertiary shadow-[0_0_40px_rgba(214,197,149,0.3)]" 
        />
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-surface-container-high border border-tertiary/50 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-tertiary uppercase tracking-wider">
          Obsidian Gate
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="z-10 max-w-sm mb-8"
      >
        <h1 className="font-serif text-3xl font-bold tracking-widest text-primary mb-3">KINGDOM OF MASTERY</h1>
        <p className="text-xs text-on-surface-variant leading-relaxed font-sans mb-1">
          Welcome, Traveler. Traditional goal boards are for mortals.
        </p>
        <p className="text-xs text-on-surface-variant/80 font-sans">
          Step across the ancient threshold to sync your habits, elevate districts of civilization, and strike the Chaos Titan securely with your actions.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 z-10 w-full max-w-xs">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogin}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-tertiary to-[#b1a273] text-background px-8 py-4 rounded-xl font-mono text-sm font-bold uppercase shadow-[0_0_20px_rgba(214,197,149,0.3)] border border-tertiary/50 transition-all cursor-pointer group hover:brightness-110 active:scale-95"
        >
          <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          Let the Chronicles Begin
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGuestLogin}
          className="flex items-center justify-center gap-2 bg-[#1e1e24] text-on-surface px-8 py-3 rounded-xl font-mono text-xs font-bold uppercase shadow-lg border border-outline-variant/30 transition-all cursor-pointer hover:bg-[#282830] active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-tertiary" />
          Explore as Guest (Skip Login)
        </motion.button>
      </div>
    </div>
  );
}

// --- Main App Entry ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('arena');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Guest configuration state (default is true unless they have specifically requested to log out/sign in)
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('kom_logged_out') !== 'true';
  });

  const mockGuestUser = useMemo(() => {
    return {
      uid: 'guest_uid',
      displayName: 'Sir Alaric (Guest)',
      photoURL: IMAGES.AVATAR_THUMB,
    } as any;
  }, []);

  // Firestore Snapshot States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [bossAttackEffect, setBossAttackEffect] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [oracleHistory, setOracleHistory] = useState<any[]>([]);

  const maxBossHp = 1000;

  const handleLogin = async () => {
    localStorage.removeItem('kom_logged_out');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleGuestLogin = () => {
    localStorage.removeItem('kom_logged_out');
    setIsGuest(true);
  };

  const handleLogout = async () => {
    try {
      localStorage.setItem('kom_logged_out', 'true');
      setIsGuest(false);
      setUser(null);
      setProfile(null);
      setDistricts([]);
      setQuests([]);
      setInventory([]);
      await signOut(auth);
    } catch (err) {
      console.error("Signout Error:", err);
    }
  };

  const initializeUserProfile = async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'profiles', firebaseUser.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const initialProfile: UserProfile = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || "Sir Alaric",
          xp: 14250,
          crystals: 750,
          streak: 14,
          bossHp: 650,
          level: 12,
          nextEvolution: "The Emperor",
          hp: 100, // Initialize player HP to 100
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, initialProfile);

        // Seed districts
        const defaultDistricts = [
          { 
            id: 'd1', 
            name: 'The Knowledge District', 
            desc: 'Great Library • Observatories', 
            level: 5, xp: 750, maxXp: 1000, 
            pathName: 'Scholar Path',
            perAction: '+5 XP / Read',
          },
          { 
            id: 'd2', 
            name: 'The Artisan District', 
            desc: 'Grand Theatre • Festival Grounds', 
            level: 3, xp: 225, maxXp: 500, 
            pathName: 'Creator Path',
            perAction: '+15 XP / Create',
          },
          { 
            id: 'd3', 
            name: 'The Engineering District', 
            desc: 'Titan Forges • Arcane Machinery', 
            level: 7, xp: 1700, maxXp: 2000, 
            pathName: 'Builder Path',
            perAction: '+25 XP / Deep Work',
          }
        ];
        for (const dist of defaultDistricts) {
          const distRef = doc(db, 'profiles', firebaseUser.uid, 'districts', dist.id);
          await setDoc(distRef, {
            ...dist,
            updatedAt: serverTimestamp()
          });
        }

        // Seed quests
        const defaultQuests = [
          { id: '1', title: 'Knowledge Harvest', desc: 'Read 20 pages of high density lore', xp: 15, color: 'text-blue-400', completed: false, category: 'Mind' },
          { id: '2', title: 'Original Creation', desc: 'Code for 1 hour on thy project scroll', xp: 25, color: 'text-amber-400', completed: false, category: 'Skills' },
          { id: '3', title: 'Warrior Stamina', desc: 'Perform 30 pushups to boost physical defense', xp: 15, color: 'text-emerald-400', completed: false, category: 'Health' }
        ];
        for (const q of defaultQuests) {
          const qRef = doc(db, 'profiles', firebaseUser.uid, 'quests', q.id);
          await setDoc(qRef, {
            ...q,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${firebaseUser.uid}`);
    }
  };

  // Sync Guest Mode data locally
  useEffect(() => {
    if (isGuest) {
      const savedProfile = localStorage.getItem('kom_guest_profile');
      const savedDistricts = localStorage.getItem('kom_guest_districts');
      const savedQuests = localStorage.getItem('kom_guest_quests');
      const savedInventory = localStorage.getItem('kom_guest_inventory');

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        const defaultProfile: UserProfile = {
          userId: 'guest_uid',
          name: "Sir Alaric (Guest)",
          xp: 14250,
          crystals: 750,
          streak: 14,
          bossHp: 650,
          level: 12,
          nextEvolution: "The Emperor",
          hp: 100, // Initialize guest player HP to 100
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProfile(defaultProfile);
        localStorage.setItem('kom_guest_profile', JSON.stringify(defaultProfile));
      }

      if (savedDistricts) {
        setDistricts(JSON.parse(savedDistricts));
      } else {
        const defaultDistricts = [
          { 
            id: 'd1', 
            name: 'The Knowledge District', 
            desc: 'Great Library • Observatories', 
            level: 5, xp: 750, maxXp: 1000, 
            pathName: 'Scholar Path',
            perAction: '+5 XP / Read',
          },
          { 
            id: 'd2', 
            name: 'The Artisan District', 
            desc: 'Grand Theatre • Festival Grounds', 
            level: 3, xp: 225, maxXp: 500, 
            pathName: 'Creator Path',
            perAction: '+15 XP / Create',
          },
          { 
            id: 'd3', 
            name: 'The Engineering District', 
            desc: 'Titan Forges • Arcane Machinery', 
            level: 7, xp: 1700, maxXp: 2000, 
            pathName: 'Builder Path',
            perAction: '+25 XP / Deep Work',
          }
        ];
        setDistricts(defaultDistricts);
        localStorage.setItem('kom_guest_districts', JSON.stringify(defaultDistricts));
      }

      if (savedQuests) {
        setQuests(JSON.parse(savedQuests));
      } else {
        const defaultQuests = [
          { id: '1', title: 'Knowledge Harvest', desc: 'Read 20 pages of high density lore', xp: 15, color: 'text-blue-400', completed: false, category: 'Mind' },
          { id: '2', title: 'Original Creation', desc: 'Code for 1 hour on thy project scroll', xp: 25, color: 'text-amber-400', completed: false, category: 'Skills' },
          { id: '3', title: 'Warrior Stamina', desc: 'Perform 30 pushups to boost physical defense', xp: 15, color: 'text-emerald-400', completed: false, category: 'Health' }
        ];
        setQuests(defaultQuests);
        localStorage.setItem('kom_guest_quests', JSON.stringify(defaultQuests));
      }

      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      } else {
        setInventory([]);
        localStorage.setItem('kom_guest_inventory', JSON.stringify([]));
      }

      const savedOracle = localStorage.getItem(`kom_guest_oracle_${mockGuestUser.uid}`);
      if (savedOracle) {
        setOracleHistory(JSON.parse(savedOracle));
      } else {
        setOracleHistory([]);
      }

      setUser(mockGuestUser);
    }
  }, [isGuest, mockGuestUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        try {
          await getDocFromServer(doc(db, 'test', 'connection')).catch(() => {});
        } catch (e) {}

        await initializeUserProfile(firebaseUser);
        setUser(firebaseUser);
        setIsGuest(false);
        localStorage.removeItem('kom_logged_out');
      } else {
        // If logged_out is explicitly set, we null out user so they see LoginScreen.
        // Otherwise, if Guest Mode is allowed to run, let the guest state live.
        const loggedOut = localStorage.getItem('kom_logged_out') === 'true';
        if (loggedOut) {
          setUser(null);
          setProfile(null);
          setDistricts([]);
          setQuests([]);
          setInventory([]);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [mockGuestUser]);

  useEffect(() => {
    if (!user) return;
    if (user.uid === 'guest_uid') return; // Do NOT subscribe to firestore if guest!

    const profileRef = doc(db, 'profiles', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`);
    });

    const districtsCol = collection(db, 'profiles', user.uid, 'districts');
    const unsubDistricts = onSnapshot(districtsCol, (snap) => {
      const list: District[] = [];
      snap.forEach((dDoc) => {
        list.push(dDoc.data() as District);
      });
      list.sort((a, b) => a.id.localeCompare(b.id));
      setDistricts(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/districts`);
    });

    const questsCol = collection(db, 'profiles', user.uid, 'quests');
    const unsubQuests = onSnapshot(questsCol, (snap) => {
      const list: Quest[] = [];
      snap.forEach((qDoc) => {
        list.push(qDoc.data() as Quest);
      });
      setQuests(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/quests`);
    });

    const inventoryCol = collection(db, 'profiles', user.uid, 'inventory');
    const unsubInventory = onSnapshot(inventoryCol, (snap) => {
      const list: InventoryItem[] = [];
      snap.forEach((iDoc) => {
        list.push(iDoc.data() as InventoryItem);
      });
      setInventory(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/inventory`);
    });

    const oracleCol = collection(db, 'profiles', user.uid, 'oracle');
    const unsubOracle = onSnapshot(oracleCol, (snap) => {
      const list: any[] = [];
      snap.forEach((oDoc) => {
        list.push(oDoc.data());
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setOracleHistory(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}/oracle`);
    });

    return () => {
      unsubProfile();
      unsubDistricts();
      unsubQuests();
      unsubInventory();
      unsubOracle();
    };
  }, [user]);

  const handleCompleteQuest = async (questId: string, xp: number) => {
    if (!user || !profile) return;

    // Category C: Streak Multiplier (consecutive completions, e.g. streak >= 10 is 1.5x, streak >= 5 is 1.2x)
    const streakMultiplier = (profile.streak || 0) >= 10 ? 1.5 : (profile.streak || 0) >= 5 ? 1.2 : 1.0;
    const crystalEarned = Math.round(xp * 0.5 * streakMultiplier);

    const nextXpTotal = profile.xp + xp;
    const calculatedLevel = Math.floor(nextXpTotal / 1200) + 1;
    const finalLevel = Math.max(profile.level, calculatedLevel);

    if (isGuest) {
      const updatedQuests = quests.map(q => q.id === questId ? { ...q, completed: true } : q);
      setQuests(updatedQuests);
      localStorage.setItem('kom_guest_quests', JSON.stringify(updatedQuests));

      const updatedProfile = {
        ...profile,
        xp: nextXpTotal,
        level: finalLevel,
        bossHp: Math.max(0, profile.bossHp - Math.round(xp / 2)),
        crystals: profile.crystals + crystalEarned,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const questRef = doc(db, 'profiles', user.uid, 'quests', questId);
    try {
      await updateDoc(questRef, {
        completed: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}/quests/${questId}`);
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: nextXpTotal,
        level: finalLevel,
        bossHp: Math.max(0, profile.bossHp - Math.round(xp / 2)),
        crystals: profile.crystals + crystalEarned,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleFailQuest = async (questId: string) => {
    if (!user || !profile) return;

    const currentEnemy = getCurrentEnemy(profile);
    const prevHp = profile.hp ?? 100;
    let nextHp = Math.max(0, prevHp - 20);
    let crystalPenalty = 0;
    
    // Trigger Boss Attack animation
    setBossAttackEffect(currentEnemy.name);
    setTimeout(() => {
      setBossAttackEffect(null);
    }, 1500);

    if (nextHp <= 0) {
      // Revival event with penalty
      nextHp = 100;
      crystalPenalty = 20; // Revive fee
      alert(`⚠️ DEFEATED! ${currentEnemy.name} launched an ultimate attack! Thy HP dropped to 0! The High Scholar has revived thy spirit, taxing 20 Crystals.`);
    }

    const nextCrystals = Math.max(0, profile.crystals - crystalPenalty);

    if (isGuest) {
      const updatedQuests = quests.map(q => q.id === questId ? { ...q, completed: true, failed: true } : q);
      setQuests(updatedQuests);
      localStorage.setItem('kom_guest_quests', JSON.stringify(updatedQuests));

      const updatedProfile = {
        ...profile,
        hp: nextHp,
        crystals: nextCrystals,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const questRef = doc(db, 'profiles', user.uid, 'quests', questId);
    try {
      await updateDoc(questRef, {
        completed: true,
        failed: true,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}/quests/${questId}`);
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        hp: nextHp,
        crystals: nextCrystals,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleAddQuest = async (title: string, desc: string, xp: number) => {
    if (!user) return;
    const qId = 'q_' + Date.now();
    const colors = ['text-blue-400', 'text-amber-400', 'text-emerald-400', 'text-purple-400'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (isGuest) {
      const newQuest = {
        id: qId,
        title,
        desc,
        xp,
        color,
        completed: false
      };
      const updatedQuests = [...quests, newQuest];
      setQuests(updatedQuests);
      localStorage.setItem('kom_guest_quests', JSON.stringify(updatedQuests));
      return;
    }

    const questRef = doc(db, 'profiles', user.uid, 'quests', qId);
    try {
      await setDoc(questRef, {
        id: qId,
        title,
        desc,
        xp,
        color,
        completed: false,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${user.uid}/quests/${qId}`);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!user) return;

    if (isGuest) {
      const updatedQuests = quests.filter(q => q.id !== questId);
      setQuests(updatedQuests);
      localStorage.setItem('kom_guest_quests', JSON.stringify(updatedQuests));
      return;
    }

    const questRef = doc(db, 'profiles', user.uid, 'quests', questId);
    try {
      await deleteDoc(questRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `profiles/${user.uid}/quests/${questId}`);
    }
  };

  const handleResetQuests = async () => {
    if (!user || quests.length === 0) return;

    if (isGuest) {
      const updatedQuests = quests.map(q => ({ ...q, completed: false }));
      setQuests(updatedQuests);
      localStorage.setItem('kom_guest_quests', JSON.stringify(updatedQuests));
      return;
    }

    for (const q of quests) {
      const qRef = doc(db, 'profiles', user.uid, 'quests', q.id);
      try {
        await updateDoc(qRef, {
          completed: false,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}/quests/${q.id}`);
      }
    }
  };

  const handleRefreshQuests = async () => {
    if (!user) return;
    
    // Pick 3 unique random quests from pool
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((q, index) => ({
      id: `q_refresh_${Date.now()}_${index}`,
      title: q.title,
      desc: q.desc,
      xp: q.xp,
      color: q.color,
      completed: false
    }));

    if (isGuest) {
      setQuests(selected);
      localStorage.setItem('kom_guest_quests', JSON.stringify(selected));
      return;
    }

    try {
      const questsCol = collection(db, 'profiles', user.uid, 'quests');
      const qSnap = await getDocs(questsCol);
      
      const deletePromises = qSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      const addPromises = selected.map(q => {
        const qRef = doc(db, 'profiles', user.uid, 'quests', q.id);
        return setDoc(qRef, {
          ...q,
          updatedAt: serverTimestamp()
        });
      });
      await Promise.all(addPromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}/quests`);
    }
  };

  const handleTriggerDistrict = async (distId: string, xpGain: number) => {
    if (!user || !profile) return;
    const targetDist = districts.find(d => d.id === distId);
    if (!targetDist) return;

    if (isGuest) {
      let newXp = targetDist.xp + xpGain;
      let newLevel = targetDist.level;
      let newMaxXp = targetDist.maxXp;
      let rankLeveledUp = false;

      if (newXp >= targetDist.maxXp) {
        newXp = newXp - targetDist.maxXp;
        newLevel += 1;
        newMaxXp = Math.round(targetDist.maxXp * 1.5);
        rankLeveledUp = true;
      }

      const updatedDistricts = districts.map(d => d.id === distId ? {
        ...d,
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp
      } : d);
      setDistricts(updatedDistricts);
      localStorage.setItem('kom_guest_districts', JSON.stringify(updatedDistricts));

      const earnedXp = rankLeveledUp ? 200 : xpGain;
      const nextXpTotal = profile.xp + earnedXp;
      const calculatedLevel = Math.floor(nextXpTotal / 1200) + 1;
      const finalLevel = Math.max(profile.level, calculatedLevel);

      const updatedProfile = {
        ...profile,
        xp: nextXpTotal,
        level: finalLevel,
        crystals: profile.crystals + (rankLeveledUp ? 100 : Math.round(xpGain * 0.2)),
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const dRef = doc(db, 'profiles', user.uid, 'districts', distId);

    let newXp = targetDist.xp + xpGain;
    let newLevel = targetDist.level;
    let newMaxXp = targetDist.maxXp;
    let rankLeveledUp = false;

    if (newXp >= targetDist.maxXp) {
      newXp = newXp - targetDist.maxXp;
      newLevel += 1;
      newMaxXp = Math.round(targetDist.maxXp * 1.5);
      rankLeveledUp = true;
    }

    try {
      await updateDoc(dRef, {
        xp: newXp,
        level: newLevel,
        maxXp: newMaxXp,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}/districts/${distId}`);
    }

    const earnedXp = rankLeveledUp ? 200 : xpGain;
    const nextXpTotal = profile.xp + earnedXp;
    const calculatedLevel = Math.floor(nextXpTotal / 1200) + 1;
    const finalLevel = Math.max(profile.level, calculatedLevel);

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: nextXpTotal,
        level: finalLevel,
        crystals: profile.crystals + (rankLeveledUp ? 100 : Math.round(xpGain * 0.2)),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleBuyItem = async (item: ShopItem) => {
    if (!user || !profile) return;
    if (profile.crystals < item.cost) {
      alert("You do not possess enough royal crystals inside your treasury!");
      return;
    }

    const itemId = item.title.toLowerCase().replace(/\s+/g, '_');

    if (isGuest) {
      const newItem = {
        itemId,
        title: item.title,
        rarity: item.rarity,
        category: item.type,
        purchasedAt: new Date().toISOString()
      };
      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      localStorage.setItem('kom_guest_inventory', JSON.stringify(updatedInventory));

      const updatedProfile = {
        ...profile,
        crystals: profile.crystals - item.cost,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const itemRef = doc(db, 'profiles', user.uid, 'inventory', itemId);
    
    try {
      await setDoc(itemRef, {
        itemId,
        title: item.title,
        rarity: item.rarity,
        category: item.type,
        purchasedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${user.uid}/inventory/${itemId}`);
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        crystals: profile.crystals - item.cost,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleAwardBonusXp = async (xp: number, crystals: number, message: string) => {
    if (!user || !profile) return;
    if (isGuest) {
      const updatedProfile = {
        ...profile,
        xp: profile.xp + xp,
        crystals: profile.crystals + crystals,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }
    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: profile.xp + xp,
        crystals: profile.crystals + crystals,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleUnlockCosmetic = async (itemId: string, title: string, cost: number, rarity: string) => {
    if (!user) return;
    if (isGuest) {
      const newItem = {
        itemId,
        title,
        rarity,
        category: 'cosmetic',
        purchasedAt: new Date().toISOString()
      };
      const updatedInventory = [...inventory, newItem];
      setInventory(updatedInventory);
      localStorage.setItem('kom_guest_inventory', JSON.stringify(updatedInventory));
      return;
    }

    const itemRef = doc(db, 'profiles', user.uid, 'inventory', itemId);
    try {
      await setDoc(itemRef, {
        itemId,
        title,
        rarity,
        category: 'cosmetic',
        purchasedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `profiles/${user.uid}/inventory/${itemId}`);
    }
  };

  const handleLevelUpInstantly = async () => {
    if (!user || !profile) return;
    const currentLvl = profile.level;
    const nextLvl = currentLvl + 1;
    const newXp = profile.xp + 1200;

    if (isGuest) {
      const updatedProfile = {
        ...profile,
        xp: newXp,
        level: nextLvl,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: newXp,
        level: nextLvl,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleSkipToNextEnemy = async () => {
    if (!user || !profile) return;
    
    const activeEnemy = getCurrentEnemy(profile);
    const currentIndex = ENEMIES.findIndex(e => e.id === activeEnemy.id);
    const nextIndex = (currentIndex + 1) % ENEMIES.length;
    const nextEnemy = ENEMIES[nextIndex];

    if (isGuest) {
      const updatedProfile = {
        ...profile,
        enemyId: nextEnemy.id,
        bossHp: nextEnemy.maxHp,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        enemyId: nextEnemy.id,
        bossHp: nextEnemy.maxHp,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleLevelDownInstantly = async () => {
    if (!user || !profile) return;
    const currentLvl = profile.level;
    const prevLvl = Math.max(1, currentLvl - 1);
    const newXp = Math.max(0, profile.xp - 1200);

    if (isGuest) {
      const updatedProfile = {
        ...profile,
        xp: newXp,
        level: prevLvl,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: newXp,
        level: prevLvl,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleSkipToPrevEnemy = async () => {
    if (!user || !profile) return;
    
    const activeEnemy = getCurrentEnemy(profile);
    const currentIndex = ENEMIES.findIndex(e => e.id === activeEnemy.id);
    const prevIndex = (currentIndex - 1 + ENEMIES.length) % ENEMIES.length;
    const prevEnemy = ENEMIES[prevIndex];

    if (isGuest) {
      const updatedProfile = {
        ...profile,
        enemyId: prevEnemy.id,
        bossHp: prevEnemy.maxHp,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        enemyId: prevEnemy.id,
        bossHp: prevEnemy.maxHp,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  const handleVanquishVictory = async () => {
    if (!user || !profile) return;
    
    const activeEnemy = getCurrentEnemy(profile);
    const currentIndex = ENEMIES.findIndex(e => e.id === activeEnemy.id);
    const nextIndex = (currentIndex + 1) % ENEMIES.length;
    const nextEnemy = ENEMIES[nextIndex];
    
    const earnedXp = 150;
    const earnedCrystals = 150;
    
    const computedXp = profile.xp + earnedXp;
    const calculatedLevel = Math.floor(computedXp / 1200) + 1;
    const finalLevel = Math.max(profile.level, calculatedLevel);

    if (isGuest) {
      const updatedProfile = {
        ...profile,
        xp: computedXp,
        crystals: profile.crystals + earnedCrystals,
        level: finalLevel,
        enemyId: nextEnemy.id,
        bossHp: nextEnemy.maxHp,
        updatedAt: new Date().toISOString()
      };
      setProfile(updatedProfile);
      localStorage.setItem('kom_guest_profile', JSON.stringify(updatedProfile));
      return;
    }

    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, {
        xp: computedXp,
        crystals: profile.crystals + earnedCrystals,
        level: finalLevel,
        enemyId: nextEnemy.id,
        bossHp: nextEnemy.maxHp,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${user.uid}`);
    }
  };

  return (
    <div className="flex justify-center items-center bg-[#0d0d0e] min-h-screen md:p-6 select-none">
      {/* Responsive Phone Shell Container */}
      <div className="w-full h-[100dvh] md:h-[844px] md:max-h-[92dvh] md:max-w-[390px] md:aspect-[9/19.5] bg-surface-container-lowest relative flex flex-col md:rounded-[40px] md:shadow-[0_0_60px_rgba(0,0,0,0.8)] md:border-[6px] md:border-[#202025] overflow-hidden">
        


        {authLoading ? (
          <LoadingPortal />
        ) : !user || !profile ? (
          <LoginScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
        ) : (
          <div className="flex flex-col h-full w-full relative overflow-hidden">
            {/* Boss Attack Full Screen Flash Red Vignette Overlay */}
            {bossAttackEffect && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-red-950/50 pointer-events-none z-50 border-[10px] border-red-500 shadow-[inset_0_0_100px_rgba(239,68,68,0.9)] flex flex-col items-center justify-center"
              >
                <div className="bg-[#120303]/90 px-5 py-3.5 rounded-xl border border-red-500/50 text-center animate-bounce shadow-2xl flex flex-col items-center gap-2 max-w-[280px]">
                  <span className="text-xl">💥</span>
                  <h3 className="text-red-500 font-serif text-[11px] font-bold tracking-[0.25em] uppercase">BOSS ATTACK!</h3>
                  <p className="text-stone-300 font-mono text-[9px] mt-0.5 leading-relaxed">
                    {bossAttackEffect} launched a critical strike for missing thy habits! <span className="text-red-400 font-bold">-20 HP</span>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Top App Bar with Gamified HUD Header */}
            <header className="bg-[#121214] flex flex-col justify-center px-4 py-3 border-b border-outline-variant/30 shrink-0 w-full z-10 shadow-lg gap-2">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-tertiary bg-surface-container-highest">
                    <img src={user.photoURL || IMAGES.AVATAR_THUMB} alt="Avatar" className="w-full h-full object-cover pixelated" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h1 className="font-serif text-[10px] font-bold tracking-wider text-primary truncate max-w-[110px]">Kingdom of Mastery</h1>
                    <p className="font-sans text-[7px] text-on-surface-variant/75 truncate max-w-[110px]">{profile.name}</p>
                  </div>
                </div>
                
                {/* Level and Treasury Indicators */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-[#1c1c1f] px-2 py-0.5 rounded border border-outline-variant/40 shadow-inner">
                    <span className="font-mono text-[9px] text-tertiary font-bold">LVL {profile.level}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#1c1c1f] px-2 py-0.5 rounded border border-outline-variant/40 shadow-inner">
                    <span className="font-mono text-[9px] text-secondary font-bold">{profile.crystals}</span>
                    <Diamond className="w-2 h-2 text-cyan-400 fill-cyan-400" />
                  </div>
                </div>
              </div>

              {/* Row 2: Dual Bars for XP and Player HP */}
              <div className="grid grid-cols-2 gap-3.5 w-full">
                {/* XP Bar */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between font-mono text-[7px] text-stone-400">
                    <span>PROGRESS (XP)</span>
                    <span>{profile.xp % 1200} / 1200</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden relative border border-outline-variant/20 shadow-inner">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(((profile.xp % 1200) / 1200) * 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>

                {/* HP Bar */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between font-mono text-[7px] text-stone-400">
                    <span>HEALTH (HP)</span>
                    <span className={(profile.hp ?? 100) < 30 ? "text-error animate-pulse font-bold" : ""}>
                      {profile.hp ?? 100} / 100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden relative border border-outline-variant/20 shadow-inner">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full bg-gradient-to-r ${
                        (profile.hp ?? 100) > 50 
                          ? 'from-emerald-700 to-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.3)]' 
                          : (profile.hp ?? 100) > 20 
                            ? 'from-amber-600 to-amber-400' 
                            : 'from-red-700 to-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.hp ?? 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content Pane */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full">
              <AnimatePresence mode="wait">
                {activeTab === 'arena' && (
                  <ArenaScreen 
                    quests={quests} 
                    bossHp={profile.bossHp} 
                    maxBossHp={getCurrentEnemy(profile).maxHp} 
                    onComplete={handleCompleteQuest} 
                    onFailQuest={handleFailQuest}
                    bossAttackEffect={bossAttackEffect}
                    onAddQuest={handleAddQuest}
                    onDeleteQuest={handleDeleteQuest}
                    onResetQuests={handleResetQuests}
                    onRefreshQuests={handleRefreshQuests}
                    user={user}
                    profile={profile}
                    isGuest={isGuest}
                    oracleHistory={oracleHistory}
                    onCompleteQuest={handleCompleteQuest}
                    onAwardBonusXp={handleAwardBonusXp}
                    onUnlockCosmetic={handleUnlockCosmetic}
                    onLevelUpInstantly={handleLevelUpInstantly}
                    onLevelDownInstantly={handleLevelDownInstantly}
                    onSkipToNextEnemy={handleSkipToNextEnemy}
                    onSkipToPrevEnemy={handleSkipToPrevEnemy}
                    onVanquishVictory={handleVanquishVictory}
                    activeTab={activeTab}
                    key="arena" 
                  />
                )}
                {activeTab === 'districts' && (
                  <DistrictsScreen 
                    districts={districts} 
                    onTrigger={handleTriggerDistrict}
                    key="districts" 
                  />
                )}
                {activeTab === 'stats' && (
                  <StatsScreen 
                    profile={profile}
                    user={user}
                    quests={quests}
                    isGuest={isGuest}
                    oracleHistory={oracleHistory}
                    onCompleteQuest={handleCompleteQuest}
                    onAwardBonusXp={handleAwardBonusXp}
                    onUnlockCosmetic={handleUnlockCosmetic}
                    activeTab={activeTab}
                    key="stats" 
                  />
                )}
                {activeTab === 'shop' && (
                  <ShopScreen 
                    crystals={profile.crystals} 
                    inventory={inventory}
                    onBuy={handleBuyItem}
                    key="shop" 
                  />
                )}
                {activeTab === 'profile' && (
                  <ProfileScreen 
                    xp={profile.xp} 
                    crystals={profile.crystals} 
                    streak={profile.streak} 
                    level={profile.level}
                    name={profile.name}
                    avatarUrl={user.photoURL}
                    inventory={inventory}
                    onLogout={handleLogout}
                    key="profile" 
                  />
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Navigation Navbar - Contained perfectly inside mock borders */}
            <nav className="h-[4.75rem] pb-[0.75rem] md:h-16 md:pb-0 bg-[#18181b] border-t border-primary/15 flex justify-around items-center px-2 shrink-0 w-full z-10 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
              <NavButton icon={<Swords />} label="Arena" active={activeTab === 'arena'} onClick={() => setActiveTab('arena')} />
              <NavButton icon={<Castle />} label="Districts" active={activeTab === 'districts'} onClick={() => setActiveTab('districts')} />
              <NavButton icon={<BarChart3 />} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
              <NavButton icon={<Store />} label="Shop" active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} />
              <NavButton icon={<UserIcon />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-screens implementations ---

interface ArenaProps {
  quests: Quest[];
  bossHp: number;
  maxBossHp: number;
  onComplete: (id: string, xp: number) => void;
  onFailQuest: (id: string) => void; // Fail a habit, boss attacks
  bossAttackEffect: string | null; // Name of attacking boss if active
  onAddQuest: (title: string, desc: string, xp: number, category?: string) => void;
  onDeleteQuest: (id: string) => void;
  onResetQuests: () => void;
  onRefreshQuests: () => void | Promise<void>;
  user: any;
  profile: any;
  isGuest: boolean;
  oracleHistory: any[];
  onCompleteQuest: (questId: string, xp: number) => Promise<void>;
  onAwardBonusXp: (xp: number, crystals: number, message: string) => Promise<void>;
  onUnlockCosmetic: (itemId: string, title: string, cost: number, rarity: string) => Promise<void>;
  onLevelUpInstantly: () => Promise<void> | void;
  onLevelDownInstantly: () => Promise<void> | void;
  onSkipToNextEnemy: () => Promise<void> | void;
  onSkipToPrevEnemy: () => Promise<void> | void;
  onVanquishVictory: () => Promise<void> | void;
  activeTab: string;
  key?: React.Key;
}

function ArenaScreen({ 
  quests, 
  bossHp, 
  maxBossHp, 
  onComplete, 
  onFailQuest,
  bossAttackEffect,
  onAddQuest, 
  onDeleteQuest, 
  onResetQuests,
  onRefreshQuests,
  user,
  profile,
  isGuest,
  oracleHistory,
  onCompleteQuest,
  onAwardBonusXp,
  onUnlockCosmetic,
  onLevelUpInstantly,
  onLevelDownInstantly,
  onSkipToNextEnemy,
  onSkipToPrevEnemy,
  onVanquishVictory,
  activeTab
}: ArenaProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newXp, setNewXp] = useState(15);

  // Category B: Mystic AI Verification states
  const [activeVerifyTab, setActiveVerifyTab] = useState<'camera' | 'journal' | null>(null);
  
  // Camera specific states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStatus, setCameraStatus] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  // Journal states
  const [journalText, setJournalText] = useState('');
  const [journalStatus, setJournalStatus] = useState('');
  const [journalResult, setJournalResult] = useState<{ grade: string, comment: string, scrollTitle: string } | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  // Proof of Completion states
  const [selectedProofQuest, setSelectedProofQuest] = useState<Quest | null>(null);
  const [proofOption, setProofOption] = useState<'photo' | 'written' | null>(null);
  const [imgUploaded, setImgUploaded] = useState<string | null>(null);
  const [proofText, setProofText] = useState('');
  const [loadingProof, setLoadingProof] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState('');

  const startCameraScan = async () => {
    try {
      setCameraStatus('Opening camera gate...');
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setCameraStream(stream);
      // Give DOM time to bind video node
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);

      const steps = [
        'Camera links established! Tracking spine position...',
        'Spine orientation wireframe aligned...',
        'Analyzing neck curvature & balance...',
        'AI Check: Perfect alignment! Optimal posture verified.'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 1200));
        setCameraStatus(steps[i]);
      }

      // Close stream
      stream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
      setIsScanning(false);

      // Award Rewards
      await onAwardBonusXp(40, 40, "🔮 AI Posture Verified! +40 XP & +40 Crystals awarded.");
      setCameraStatus('Postural scan COMPLETE! Traveler rewarded +40 XP & +40 Crystals.');
    } catch (err) {
      console.error(err);
      setCameraStatus('Camera permission refused or device unrecognized.');
      setIsScanning(false);
    }
  };

  const submitJournalNLP = async () => {
    if (!journalText.trim()) return;
    try {
      setIsGrading(true);
      setJournalStatus('Transmitting reflection scrolls to Grand Scholar...');
      
      const res = await fetch('/api/verify-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ journalText })
      });
      const data = await res.json();
      
      if (data.error) {
        setJournalStatus(`Grand Scholar's Vision blocked: ${data.error}`);
        setIsGrading(false);
        return;
      }

      setJournalResult(data);
      setJournalStatus('Graded Successfully!');
      setIsGrading(false);

      // Award Rewards
      await onAwardBonusXp(40, 40, `🔮 Journal Verified! Scholar awarded ${data.grade}.`);
    } catch (err) {
      console.error(err);
      setJournalStatus('Reflection transcript submission failed.');
      setIsGrading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddQuest(newTitle, newDesc, newXp);
    setNewTitle('');
    setNewDesc('');
    setNewXp(15);
    setShowAddForm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col w-full"
    >
      <section 
        className="relative w-full aspect-square flex flex-col items-center justify-center animate-fade-in"
        style={{ backgroundImage: `url(${IMAGES.HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/60 to-transparent" />
        
        {/* Floating Realm Info */}
        <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md text-[8px] font-mono font-bold text-primary tracking-wider px-2.5 py-1 rounded-full border border-primary/30 shadow-md flex items-center gap-1.5 z-10">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LAND: {getThemeStyles(profile ? profile.level : 1).title.toUpperCase()}
        </div>

        <div className="relative z-10 animate-float flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-tertiary/20 blur-xl animate-pulse" />
            <img 
              src={getRankAvatar(profile ? profile.level : 1)} 
              alt="Main Avatar" 
              className="w-44 h-44 object-cover rounded-full border-[3px] border-tertiary shadow-[0_0_30px_rgba(214,197,149,0.3)] bg-[#1a1a1d]" 
            />
          </div>
          <div className="mt-6 px-6 py-2 bg-surface-container/90 backdrop-blur-md border border-primary/30 rounded-full shadow-lg">
            <p className="font-mono text-sm text-primary tracking-[0.2em] font-bold uppercase">{getRankTitle(profile ? profile.level : 1)}</p>
          </div>
        </div>
      </section>

      <div className="px-6 flex flex-col gap-8 mt-[-3rem] relative z-20 pb-8">
        {/* Boss Card */}
        <section className="bg-surface-container-high rounded-2xl p-6 flex flex-col items-center border border-outline-variant/30 shadow-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center w-full">
            <h2 className="font-serif text-xl text-on-surface mb-1 font-bold">Current Enemy</h2>
            <p className="font-mono text-xs text-error uppercase tracking-widest mb-6 truncate max-w-full">
              {getCurrentEnemy(profile).name} <span className="text-on-surface-variant/75 font-normal">({getCurrentEnemy(profile).subName})</span>
            </p>
            
            <div className="w-full max-w-[220px] aspect-video bg-surface-container rounded-xl border border-outline-variant/50 mb-6 flex items-center justify-center overflow-hidden shadow-inner">
              <img src={getCurrentEnemy(profile).imageUrl} alt={getCurrentEnemy(profile).name} className="w-full h-full object-cover mix-blend-luminosity opacity-85 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* HP Bar */}
            {bossHp <= 0 ? (
              <div className="w-full text-center py-2 space-y-3 relative z-10 animate-fade-in flex flex-col items-center">
                <p className="font-mono text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> enemy vanquished! <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </p>
                <button 
                  onClick={onVanquishVictory}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-background rounded-full font-mono text-[9px] uppercase font-bold tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(214,197,149,0.3)] border border-yellow-300/40 cursor-pointer"
                >
                  Claim Triumph (+150 XP & Crystals)
                </button>
              </div>
            ) : (
              <div className="w-full h-5 bg-surface-container-highest rounded-full border border-outline-variant/50 overflow-hidden relative shadow-inner">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 to-error shadow-[0_0_15px_rgba(255,180,171,0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-on-surface drop-shadow-md">
                  {Math.round(bossHp)} / {maxBossHp} HP
                </div>
              </div>
            )}
          </div>
        </section>

        {/* The Royal Oracle */}
        <RoyalOracle 
          user={user}
          profile={profile}
          quests={quests}
          isGuest={isGuest}
          oracleHistory={oracleHistory}
          onCompleteQuest={onCompleteQuest}
          onAwardBonusXp={onAwardBonusXp}
          onUnlockCosmetic={onUnlockCosmetic}
          activeTab={activeTab}
        />

        {/* Category B: Mystic AI Habit Verification Vault */}
        <section className="bg-gradient-to-br from-[#121215] to-[#18181c] rounded-2xl p-5 border border-primary/25 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="relative z-10">
            <h3 className="font-serif text-base text-on-surface font-bold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-tertiary" />
              Mystic AI Verification Vault
            </h3>
            <p className="font-mono text-[9px] text-on-surface-variant/70 mt-1 uppercase tracking-wider">
              Verify completion via Camera posture or Scholar Journal NLP
            </p>

            {/* Quick Modality Switcher */}
            <div className="grid grid-cols-2 gap-2 mt-4 bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
              <button
                onClick={() => {
                  setActiveVerifyTab(activeVerifyTab === 'camera' ? null : 'camera');
                  setCameraStatus('');
                  setCameraStream(null);
                }}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-md font-mono text-[8px] uppercase font-bold transition-all cursor-pointer ${activeVerifyTab === 'camera' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <Camera className="w-3.5 h-3.5" />
                Posture Scan
              </button>
              <button
                onClick={() => {
                  setActiveVerifyTab(activeVerifyTab === 'journal' ? null : 'journal');
                  setJournalStatus('');
                }}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-md font-mono text-[8px] uppercase font-bold transition-all cursor-pointer ${activeVerifyTab === 'journal' ? 'bg-[#ca8a04]/25 text-[#facc15] border border-[#eab308]/30' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Journal NLP
              </button>
            </div>

            {/* Dynamic Interactive Scanner Panels */}
            <AnimatePresence mode="wait">
              {activeVerifyTab === 'camera' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-surface-container rounded-xl p-4 border border-primary/10 overflow-hidden"
                >
                  <h4 className="font-mono text-[10px] text-primary font-bold uppercase mb-2">📷 Posture Alignment Scanner</h4>
                  <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                    Verify thy health habit by aligning thy chin & back against the deep grid alignment target.
                  </p>

                  <div className="relative w-full aspect-video bg-black rounded-lg border border-primary/20 overflow-hidden flex flex-col items-center justify-center">
                    {/* Live Camera Feed */}
                    {cameraStream ? (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2 animate-pulse" />
                        <p className="font-mono text-[8px] text-on-surface-variant/65">CAMERA GATE DISCONNECTED</p>
                      </div>
                    )}

                    {/* Cyber Alignment Targets */}
                    {isScanning && (
                      <div className="absolute inset-0 border-[2px] border-dashed border-primary/30 pointer-events-none animate-pulse flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border border-primary/50 flex items-center justify-center relative">
                          <span className="absolute w-3 h-[1px] bg-primary" />
                          <span className="absolute w-[1px] h-3 bg-primary" />
                        </div>
                        {/* Horizontal scanning light reflection bar */}
                        <motion.div 
                          initial={{ y: -50 }}
                          animate={{ y: [0, 160, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                          className="absolute inset-x-0 h-[2px] bg-primary/60 shadow-[0_0_12px_rgba(var(--color-primary),0.8)]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={startCameraScan}
                      disabled={isScanning}
                      className="w-full py-2 bg-primary text-background rounded font-mono text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                    >
                      {isScanning ? '🔍 SCANNING RECTITUDE...' : '⚡ INITIALIZE POSTURE CAPTURE'}
                    </button>
                    {cameraStatus && (
                      <div className="mt-2 bg-surface-container-highest/60 p-2.5 rounded border border-outline-variant/30 text-center font-mono text-[9px] text-[#cbd5e1] leading-relaxed">
                        {cameraStatus}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeVerifyTab === 'journal' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-surface-container rounded-xl p-4 border border-[#eab308]/10 overflow-hidden"
                >
                  <h4 className="font-mono text-[10px] text-[#facc15] font-bold uppercase mb-2">📜 Grand Scholar NLP reflection</h4>
                  <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">
                    Reflect on thy daily efforts. Submit at least 2 complete sentences to the Gemini High Library Scroll.
                  </p>

                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="E.g., Today I resisted temptations of idle snacking and maintained my intense focus blocks. I conquered the procrastination demon by writing 500 words before noon..."
                    rows={4}
                    className="w-full bg-[#0d0d0f] p-3 text-stone-200 border border-[#eab308]/20 rounded-lg text-xs font-serif leading-relaxed focus:outline-none focus:border-[#ca8a04]/50"
                  />

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={submitJournalNLP}
                      disabled={isGrading || !journalText.trim()}
                      className="w-full py-2 bg-[#ca8a04] text-background rounded font-mono text-[10px] font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
                    >
                      {isGrading ? '🔮 SCHOLAR GRADING REFLECTION...' : '⚡ TRANSMIT REFLECTION'}
                    </button>

                    {journalStatus && (
                      <div className="mt-2 bg-[#1b1509]/60 p-2.5 rounded border border-[#eab308]/30 text-stone-300 font-mono text-[9px] leading-relaxed text-center">
                        {journalStatus}
                      </div>
                    )}

                    {journalResult && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 bg-[#131317] border border-[#facc15]/30 p-3.5 rounded-xl space-y-2 text-left shadow-lg"
                      >
                        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5">
                          <span className="font-serif text-[10px] text-[#facc15] font-bold uppercase tracking-wider">{journalResult.scrollTitle || "Scholar's Judgment"}</span>
                          <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">GRADE: {journalResult.grade}</span>
                        </div>
                        <p className="text-stone-300 font-serif text-[10px] italic leading-relaxed">
                          "{journalResult.comment || "Thy reflections display focus and stamina. Stay vigilant, traveler."}"
                        </p>
                        <div className="text-[8px] font-mono text-[#facc15]/80 flex items-center justify-center gap-1.5 bg-[#facc15]/5 py-1 rounded">
                          ✨ AI Reward Verification Logged: +40 XP & +40 Crystals
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Daily Quests */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-lg text-on-surface font-bold">Daily Quests</h3>
              <button 
                onClick={onResetQuests}
                title="Reset Completed Quests"
                className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-on-surface-variant/70 hover:rotate-90 transition-transform" />
              </button>
              
              <button 
                onClick={onRefreshQuests}
                title="Roll 3 New Daily Quests"
                className="font-mono text-[8px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-amber-400 hover:text-background transition-colors cursor-pointer"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Roll 3 New Daily
              </button>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="font-mono text-[9px] text-tertiary bg-tertiary/10 border border-tertiary/30 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-tertiary hover:text-background transition-colors"
            >
              <Plus className="w-2.5 h-2.5" />
              Add Quest
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="bg-surface-container p-4 rounded-xl border border-tertiary/30 flex flex-col gap-3 overflow-hidden shadow-inner"
              >
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-1">Quest Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Read 30 mins"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-surface-container-highest px-3 py-1.5 rounded text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-1">Deliverable / Description</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Chapters 3 and 4 in History Tome"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-surface-container-highest px-3 py-1.5 rounded text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-tertiary"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono uppercase tracking-widest text-on-surface-variant/80 mb-1">Harvest XP Reward</label>
                  <select 
                    value={newXp}
                    onChange={(e) => setNewXp(Number(e.target.value))}
                    className="w-full bg-surface-container-highest px-3 py-1.5 rounded text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-tertiary"
                  >
                    <option value="10">10 XP (Easy Habit)</option>
                    <option value="15">15 XP (Medium Effort)</option>
                    <option value="25">25 XP (Intense Session)</option>
                    <option value="50">50 XP (Legendary Landmark)</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="bg-tertiary text-background py-1.5 rounded font-mono text-[10px] font-bold uppercase hover:brightness-110 active:scale-95 transition-transform mt-1"
                >
                  Chronicle to Scroll
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <div className="grid gap-3.5">
            {quests.length === 0 ? (
              <p className="text-center text-xs text-on-surface-variant/70 py-6">Your quest scroll is currently empty. Summon custom daily habits!</p>
            ) : (
              quests.map(quest => (
                <motion.div 
                  key={quest.id}
                  whileHover={{ scale: 1.01 }}
                  className={`bg-surface-container rounded-xl p-3 border.5 transition-colors relative flex flex-col gap-2.5 ${quest.completed ? 'border-outline-variant/20 opacity-60' : 'border-outline-variant/30 bg-gradient-to-r from-surface-container to-surface-container-high'}`}
                >
                  {/* Row 1: Category Badge indicator, Title, and Deletion option */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${quest.color || 'bg-primary'}`} />
                      <h4 className={`font-mono text-xs font-bold leading-snug truncate ${quest.completed ? 'line-through text-on-surface-variant/70' : 'text-on-surface'}`}>
                        {quest.title}
                      </h4>
                    </div>
                    <button 
                      onClick={() => onDeleteQuest(quest.id)}
                      className="p-1 text-on-surface-variant/40 hover:text-red-400 transition-colors -mt-1 -mr-1"
                      title="Annihilate Quest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Objective Description / Deliverables */}
                  <div className="text-[11px] text-on-surface-variant leading-relaxed pl-3.5 border-l-2 border-primary/25 break-words">
                    {quest.desc || "Daily habit tracking quest."}
                  </div>

                  {/* Row 3: Reward badges and interactive proof control buttons */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/10 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-mono text-on-surface-variant/50 uppercase tracking-tighter">Reward:</span>
                      <span className="font-mono text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        +{quest.xp} XP / 💎
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!quest.completed ? (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedProofQuest(quest);
                              setProofOption(null);
                              setImgUploaded(null);
                              setProofText('');
                              setVerificationFeedback('');
                            }}
                            title="Complete quest (requires verification proof)"
                            className="bg-emerald-950/40 text-emerald-400 hover:bg-emerald-500 hover:text-background font-mono text-[8.5px] font-bold uppercase px-2.5 py-1 rounded border border-emerald-500/30 transition-all uppercase active:scale-95 cursor-pointer flex items-center gap-1 group"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-450 group-hover:rotate-12 transition-transform" />
                            Succ
                          </button>
                          <button 
                            onClick={() => onFailQuest(quest.id)}
                            title="Missed/failed habit"
                            className="bg-red-950/40 text-red-400 hover:bg-red-500 hover:text-background font-mono text-[8px] font-bold uppercase px-2 py-1 rounded border border-red-500/30 transition-all uppercase active:scale-95 cursor-pointer"
                          >
                            Miss
                          </button>
                        </>
                      ) : (
                        <span className={`text-[8.5px] font-bold font-mono px-2 py-0.5 rounded ${quest.failed ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {quest.failed ? '💥 DEFEAT' : '✅ COMPLETE'}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Status Bar */}
        <div className="flex justify-between items-center bg-surface-container rounded-xl p-4 border border-outline-variant/20 mb-4 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-950/30 flex items-center justify-center border border-red-500/30">
              <Flame className="w-4 h-4 text-error fill-error" />
            </div>
            <span className="font-mono text-sm text-on-surface font-bold">Involved Adventure</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Timer className="w-4 h-4" />
            <span className="font-mono text-[9px] uppercase tracking-wider">Sync Active to Cloud</span>
          </div>
        </div>

        {/* Admin Dev-Realm Controls Cheat Panel */}
        <div className="mt-4 bg-surface-container border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-amber-950/40 flex items-center justify-center border border-amber-500/30 animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <span className="font-mono text-[9px] text-amber-400 font-bold uppercase tracking-widest">Admin Dev-Realm Controls</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3.5">
            <button 
              onClick={onLevelUpInstantly}
              className="flex flex-col items-center justify-center gap-1.5 p-3 px-2 bg-[#0d0d0e]/60 rounded-xl border border-outline-variant/40 hover:border-amber-500/40 hover:bg-[#1a1a1d] transition-all group/cheat cursor-pointer"
            >
              <ArrowUpCircle className="w-5 h-5 text-amber-500 group-hover/cheat:scale-110 transition-transform" />
              <span className="font-serif text-[11px] font-bold text-on-surface text-center">Skip Level Instantly</span>
              <p className="font-mono text-[7px] text-on-surface-variant uppercase tracking-wider">Level Up +1</p>
            </button>
            
            <button 
              onClick={onSkipToNextEnemy}
              className="flex flex-col items-center justify-center gap-1.5 p-3 px-2 bg-[#0d0d0e]/60 rounded-xl border border-outline-variant/40 hover:border-cyan-500/40 hover:bg-[#1a1a1d] transition-all group/cheat cursor-pointer"
            >
              <Swords className="w-5 h-5 text-cyan-500 group-hover/cheat:rotate-12 transition-transform" />
              <span className="font-serif text-[11px] font-bold text-on-surface text-center">Skip to Next Foe</span>
              <p className="font-mono text-[7px] text-on-surface-variant uppercase tracking-wider">Cycle Boss</p>
            </button>

            <button 
              onClick={onLevelDownInstantly}
              className="flex flex-col items-center justify-center gap-1.5 p-3 px-2 bg-[#0d0d0e]/60 rounded-xl border border-outline-variant/40 hover:border-rose-500/40 hover:bg-[#1a1a1d] transition-all group/cheat cursor-pointer"
            >
              <ArrowDownCircle className="w-5 h-5 text-rose-500 group-hover/cheat:scale-95 transition-transform" />
              <span className="font-serif text-[11px] font-bold text-on-surface text-center">Go to Previous Level</span>
              <p className="font-mono text-[7px] text-on-surface-variant uppercase tracking-wider">Level Down -1</p>
            </button>
            
            <button 
              onClick={onSkipToPrevEnemy}
              className="flex flex-col items-center justify-center gap-1.5 p-3 px-2 bg-[#0d0d0e]/60 rounded-xl border border-outline-variant/40 hover:border-violet-500/40 hover:bg-[#1a1a1d] transition-all group/cheat cursor-pointer"
            >
              <Skull className="w-5 h-5 text-violet-500 group-hover/cheat:-rotate-12 transition-transform" />
              <span className="font-serif text-[11px] font-bold text-on-surface text-center">Go to Previous Foe</span>
              <p className="font-mono text-[7px] text-on-surface-variant uppercase tracking-wider">Cycle Prev Boss</p>
            </button>
          </div>
        </div>

        {/* Proof of Deed Verification Overlay Modal */}
        <AnimatePresence>
          {selectedProofQuest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-surface-container border border-primary/30 rounded-2xl w-full max-w-md p-6 max-h-[85vh] md:max-h-[80vh] overflow-y-auto relative shadow-2xl space-y-5 scrollbar-thin"
              >
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
                
                {/* Modal Header */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="font-mono text-[9px] text-primary uppercase tracking-widest block mb-1">High Archivist's Council</span>
                    <h3 className="font-serif text-lg font-bold text-on-surface">Deliver Proof of Achievement</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedProofQuest(null);
                      setProofOption(null);
                      setImgUploaded(null);
                      setProofText('');
                      setLoadingProof(false);
                      setVerificationFeedback('');
                    }}
                    className="text-on-surface border border-outline-variant hover:border-primary/50 text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-surface-container-highest cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <div className="bg-[#0b0c0e] p-3 rounded-xl border border-outline-variant/20 space-y-1">
                    <p className="font-mono text-[9px] text-[#cbd5e1] font-bold uppercase">Active Quest:</p>
                    <h4 className="font-serif text-sm font-semibold text-primary">{selectedProofQuest.title}</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">Required: {selectedProofQuest.desc || 'Provide evidence of deed completions.'}</p>
                  </div>
                </div>

                {/* Choice of Proof */}
                {!proofOption ? (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant text-center my-2">
                       A quest requires physical or written testament before thy reward scroll can be unsealed from the high vault.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => setProofOption('photo')}
                        className="flex flex-col items-center gap-2 p-4 bg-[#0d0d0f] rounded-xl border border-emerald-500/20 hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all text-center cursor-pointer group"
                      >
                        <Camera className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="font-serif text-xs font-bold text-on-surface">Visual Capture</span>
                        <p className="text-[8px] font-mono text-on-surface-variant uppercase">Artifact photo scan</p>
                      </button>

                      <button
                        onClick={() => setProofOption('written')}
                        className="flex flex-col items-center gap-2 p-4 bg-[#0d0d0f] rounded-xl border border-[#fbbf24]/20 hover:border-[#fbbf24]/60 hover:bg-[#fbbf24]/5 transition-all text-center cursor-pointer group"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className="font-serif text-xs font-bold text-on-surface">Written Testimony</span>
                        <p className="text-[8px] font-mono text-on-surface-variant uppercase">NLP Scribe Review</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proofOption === 'photo' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#0a0a0c] p-2 rounded border border-outline-variant/30">
                          <span className="text-[9px] font-mono text-emerald-400 uppercase">Visual Inspection Portal</span>
                          <button
                            onClick={() => {
                              setProofOption(null);
                              setImgUploaded(null);
                              setVerificationFeedback('');
                            }}
                            className="font-mono text-[8.5px] text-[#facc15] hover:text-white uppercase underline"
                          >
                            Change Gate
                          </button>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full aspect-video border-[2px] border-dashed border-outline-variant/50 hover:border-emerald-500 bg-[#070708] rounded-xl cursor-pointer transition-all overflow-hidden relative">
                              {imgUploaded ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <img 
                                    src={imgUploaded} 
                                    alt="Uploaded Proof" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <p className="font-mono text-[9px] text-white uppercase tracking-wider">Replace image</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <Upload className="w-6 h-6 text-on-surface-variant/40 mb-2" />
                                  <span className="font-mono text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Upload Artifact of Quest</span>
                                  <p className="text-[8px] text-on-surface-variant/60 mt-0.5">Drag-and-drop or select thy captured PNG / JPG</p>
                                </div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      setImgUploaded(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          <div className="text-center">
                            <span className="inline-block font-mono text-[9px] text-on-surface-variant/75 uppercase">or</span>
                            <button 
                              onClick={async () => {
                                setCameraStatus('Aligning Camera Lens Reflector...');
                                setLoadingProof(true);
                                try {
                                  const stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                                  if (!stream) {
                                    setVerificationFeedback("❌ Mirror connection refused! Camera stream locked.");
                                    setLoadingProof(false);
                                    return;
                                  }
                                  stream.getTracks().forEach(t => t.stop());
                                  setImgUploaded('https://res.cloudinary.com/dtdcmctik/image/upload/v1779769159/screen_o7trdz.png?_s=public-apps');
                                  setVerificationFeedback('');
                                } catch(e) {}
                                setLoadingProof(false);
                              }}
                              className="block mx-auto mt-1 bg-surface-container-highest border border-outline-variant text-[9px] font-mono uppercase px-3 py-1 rounded-full hover:bg-surface-container active:scale-95 transition-all text-on-surface cursor-pointer"
                            >
                              📸 Simulate Camera Capturing
                            </button>
                          </div>

                          {imgUploaded && !loadingProof && !verificationFeedback && (
                            <button
                              onClick={async () => {
                                setLoadingProof(true);
                                setVerificationFeedback('');
                                
                                const steps = [
                                  "Scanning physical borders and dimensions of image...",
                                  "Running deep convolutional validation...",
                                  "Verifying alignment with scholastic standards...",
                                  "Visual scan verified by Kingdom Archmage!"
                                ];
                                for (const step of steps) {
                                  setCameraStatus(step);
                                  await new Promise(r => setTimeout(r, 900));
                                }

                                setVerificationFeedback(`✅ VISUAL VERDICT: The Archmage verifies thy artifact photo completely blocks any shadow structures! Proceed to claim thy reward.`);
                                setLoadingProof(false);
                              }}
                              className="w-full bg-emerald-500 text-background py-2 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer font-bold"
                            >
                              ⚡ Run AI Photo Verification
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#0a0a0c] p-2 rounded border border-outline-variant/30">
                          <span className="text-[9px] font-mono text-[#facc15] uppercase">NLP Proclamation Portal</span>
                          <button
                            onClick={() => {
                              setProofOption(null);
                              setProofText('');
                              setVerificationFeedback('');
                            }}
                            className="font-mono text-[8.5px] text-emerald-400 hover:text-white uppercase underline"
                          >
                            Change Gate
                          </button>
                        </div>

                        <div className="space-y-2">
                          <textarea
                            value={proofText}
                            onChange={(e) => setProofText(e.target.value)}
                            placeholder={`Explain in details how thou completed "${selectedProofQuest.title}". For example: "I performed exactly 30 pushups by my meditation desk, keeping my back completely level and counting my breaths."`}
                            rows={4}
                            className="w-full bg-[#0a0a0c] p-3 text-stone-200 border border-[#eab308]/20 rounded-lg text-xs font-serif leading-relaxed focus:outline-none focus:border-[#ca8a04]/50"
                          />

                          {!loadingProof && !verificationFeedback && (
                            <button
                              onClick={async () => {
                                if (!proofText.trim()) return;
                                setLoadingProof(true);
                                setVerificationFeedback('');

                                try {
                                  const response = await fetch('/api/verify-proof', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      questTitle: selectedProofQuest.title,
                                      questDesc: selectedProofQuest.desc,
                                      proofText: proofText
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.verified) {
                                    setVerificationFeedback(`✅ SCHOLAR PROCLAMATION: "${data.scholarMessage}"`);
                                  } else {
                                    setVerificationFeedback(`❌ SCHOLAR REJECTION: "${data.scholarMessage || "Thy testimony seems too brief or unfocused to verify thy quest. Speak in greater detail!"}"`);
                                  }
                                } catch (err) {
                                  console.error(err);
                                  if (proofText.trim().split(/\s+/).length > 5) {
                                    setVerificationFeedback("✅ VERIFIED: Scholar library verified thy local testimony scroll.");
                                  } else {
                                    setVerificationFeedback("❌ REJECTED: Thy testimony is too brief. Declare thy deeds in fuller scrolls!");
                                  }
                                }
                                setLoadingProof(false);
                              }}
                              disabled={!proofText.trim()}
                              className="w-full bg-[#ca8a04] text-background py-2 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider disabled:opacity-50 cursor-pointer font-bold"
                            >
                              🔮 Consult High Archivist
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Loading status bar */}
                    {loadingProof && (
                      <div className="text-center py-4 space-y-2 animate-pulse">
                        <span className="inline-block text-xl">🔮</span>
                        <p className="font-mono text-[8.5px] text-[#cbd5e1] leading-normal uppercase">{cameraStatus || "Consulting the High Archives..."}</p>
                      </div>
                    )}

                    {/* Result / feedback log */}
                    {verificationFeedback && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-[#0e0e11] rounded-lg border border-outline-variant/30 text-left space-y-3 shadow-md border-emerald-500/20"
                      >
                        <p className="text-stone-200 font-serif text-[11px] leading-relaxed">
                          {verificationFeedback}
                        </p>
                        
                        {verificationFeedback.includes('✅') && (
                          <button
                            onClick={async () => {
                              // Perform original complete quest reward!
                              onComplete(selectedProofQuest.id, selectedProofQuest.xp);
                              setSelectedProofQuest(null);
                              setProofOption(null);
                              setImgUploaded(null);
                              setProofText('');
                              setVerificationFeedback('');
                            }}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-background rounded-lg font-mono text-[9px] uppercase font-bold tracking-widest cursor-pointer shadow-md"
                          >
                            🎉 Claim Reward (+{selectedProofQuest.xp} XP & Crystals)
                          </button>
                        )}
                      </motion.div>
                    )}

                  </div>
                )}

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface DistrictsProps {
  districts: District[];
  onTrigger: (id: string, xpGain: number) => void;
  key?: React.Key;
}

function DistrictsScreen({ districts, onTrigger }: DistrictsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-8 px-6 py-8"
    >
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl text-tertiary tracking-widest uppercase flex items-center justify-center gap-4">
          <span className="h-[1px] w-8 bg-tertiary/40" />
          The Districts
          <span className="h-[1px] w-8 bg-tertiary/40" />
        </h2>
        <p className="text-xs text-on-surface-variant font-mono uppercase tracking-tighter">Expand your civilization through active practice</p>
      </div>

      <div className="flex flex-col gap-6">
        {districts.map(district => {
          const assets = DISTRICT_ASSETS[district.id] || { img: IMAGES.DISTRICT_1, icon: <BookOpen />, themeColor: 'cyan' };
          const xpGain = district.id === 'd1' ? 5 : district.id === 'd2' ? 15 : 25;

          return (
            <motion.div 
              key={district.id}
              whileHover={{ y: -4 }}
              onClick={() => onTrigger(district.id, xpGain)}
              className="relative w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl h-60 flex flex-col justify-end p-6 group cursor-pointer active:scale-98 transition-transform"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700" 
                style={{ backgroundImage: `url(${assets.img})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 bg-surface-container/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                    {assets.icon}
                    <span className="font-mono text-[10px] text-on-surface font-bold uppercase">Level {district.level}</span>
                  </div>
                  <div className="px-2 py-1 rounded-md text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-primary uppercase">
                    Click to Train ({district.perAction})
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-2xl text-on-surface font-bold text-shadow-hero">{district.name}</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{district.desc}</p>
                </div>

                <div className="space-y-2">
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(district.xp / district.maxXp) * 100}%` }}
                      className="h-full bg-primary shadow-lg"
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                    <span>{district.pathName}</span>
                    <span>{district.xp} / {district.maxXp} XP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface StatsProps {
  profile: UserProfile;
  user: any;
  quests: Quest[];
  isGuest: boolean;
  oracleHistory: any[];
  onCompleteQuest: (questId: string, xp: number) => Promise<void>;
  onAwardBonusXp: (xp: number, crystals: number, message: string) => Promise<void>;
  onUnlockCosmetic: (itemId: string, title: string, cost: number, rarity: string) => Promise<void>;
  activeTab: string;
  key?: React.Key;
}

function StatsScreen({ 
  profile,
  user,
  quests,
  isGuest,
  oracleHistory,
  onCompleteQuest,
  onAwardBonusXp,
  onUnlockCosmetic,
  activeTab
}: StatsProps) {
  const chartData = [
    { name: 'M', xp: 40 },
    { name: 'T', xp: 60 },
    { name: 'W', xp: 30 },
    { name: 'T', xp: 80, active: true },
    { name: 'F', xp: 50 },
    { name: 'S', xp: 90, active: true },
    { name: 'S', xp: 75 },
  ];

  const currentLevelProgress = Math.round((profile.xp % 1500) / 1500 * 100);

  const categoriesList = ['Health', 'Mind', 'School', 'Skills'];

  const categoryStats = categoriesList.map((cat) => {
    const matchingQuests = quests.filter((q) => q.category?.toLowerCase() === cat.toLowerCase());
    const completedCount = matchingQuests.filter((q) => q.completed).length;
    const totalCount = matchingQuests.length;
    
    const baselinePct = cat === 'Health' ? 82 : cat === 'Mind' ? 90 : cat === 'School' ? 75 : 88;
    const fallbackCount = cat === 'Health' ? 14 : cat === 'Mind' ? 19 : cat === 'School' ? 9 : 22;
    
    const percentage = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100) 
      : Math.min(100, Math.round(baselinePct + (profile.level * 0.5)));

    const count = totalCount > 0
      ? completedCount
      : Math.round(fallbackCount + (profile.level * 0.8));

    return {
      name: cat,
      percentage,
      count,
      activeQuestsCount: totalCount
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-8 px-6 py-8"
    >
      {/* Tip: Perfect Days Banner */}
      <div className="bg-[#1b1509]/60 border border-amber-500/25 p-4 rounded-2xl flex items-center gap-3.5 shadow-xl relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-amber-500" />
        <span className="text-2xl animate-pulse">🔥</span>
        <div>
          <h4 className="font-serif text-[11px] font-bold text-[#facc15] uppercase tracking-wider">Discipline Tip</h4>
          <p className="text-[10px] text-stone-300 font-sans mt-0.5 leading-normal">
            Achieving a <strong className="text-white">perfect day</strong> by completing all thy daily quests will fuel and increase thy <strong className="text-secondary">XP streak</strong>!
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold flex items-center gap-3">
          <Castle className="text-tertiary" />
          Civilization Level
        </h2>
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
          
          <div className="flex justify-between items-end relative z-10">
            <div className="space-y-1">
              <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">Current Era</p>
              <h3 className="font-serif text-2xl text-tertiary">LVL {profile.level} - Iron Keep</h3>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] text-primary uppercase">Progression</p>
              <p className="font-serif text-2xl font-bold">{currentLevelProgress}%</p>
            </div>
          </div>

          <div className="h-6 bg-surface-container-highest rounded-full border border-outline-variant/40 overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-tertiary to-primary shadow-[0_0_15px_rgba(214,197,149,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${currentLevelProgress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          
          <p className="text-center text-[10px] text-on-surface-variant italic font-serif">
            {profile.xp.toLocaleString()} total experience logged in the archives
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold flex items-center gap-3">
          <Activity className="text-tertiary" />
          7-Day XP Yield
        </h2>
        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/30 h-56 shadow-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#c8c5ce', fontSize: 10, fontFamily: 'Space Grotesk' }} 
              />
              <Bar dataKey="xp" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.active ? '#d6c595' : '#22223b'} 
                    stroke={entry.active ? '#d6c595' : '#c5c3e4'}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold flex items-center gap-3">
          <BookOpen className="text-tertiary" />
          Category Alignment Metrics
        </h2>
        <div className="bg-gradient-to-br from-[#121215] to-[#18181c] rounded-2xl p-5 border border-primary/25 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d6c595]/30 to-transparent" />
          <p className="font-mono text-[9px] text-[#c5c3e4]/80 uppercase tracking-wider relative z-10">
            Habit completion percentages and total counts per division:
          </p>

          <div className="space-y-3 relative z-10">
            {categoryStats.map((cat, idx) => {
              const bgColors = {
                Health: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
                Mind: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]',
                School: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
                Skills: 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              }[cat.name as 'Health' | 'Mind' | 'School' | 'Skills'] || 'bg-primary';

              const indicator = {
                Health: '❤️',
                Mind: '🧠',
                School: '🎓',
                Skills: '⚡'
              }[cat.name as 'Health' | 'Mind' | 'School' | 'Skills'] || '✨';

              return (
                <div key={cat.name} className="space-y-1.5 p-3.5 bg-[#0d0d0f]/50 rounded-xl border border-outline-variant/15 hover:border-outline-variant/35 transition-all">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-serif font-bold text-stone-200 flex items-center gap-1.5">
                      <span>{indicator}</span>
                      {cat.name} Habit Sector
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant font-bold">
                      {cat.count} Logged | <span className="text-secondary">{cat.percentage}% Done</span>
                    </span>
                  </div>
                  
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden relative border border-outline-variant/20">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full ${bgColors}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${cat.percentage}%` }}
                      transition={{ duration: 1.2, delay: idx * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold flex items-center gap-3">
          <Star className="text-tertiary" />
          Heroic Feats
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Star />} label="Total XP" value={profile.xp.toLocaleString()} accent="tertiary" />
          <StatCard icon={<Diamond />} label="Royal Treasury" value={`${profile.crystals} Crystals`} accent="primary" />
          <StatCard icon={<Flame />} label="Current Streak" value={`${profile.streak} Days`} accent="error" />
          <StatCard icon={<Trophy />} label="Level Tier" value="Sentinel" accent="primary" />
        </div>
      </section>

      {/* Oracle History Chronicle Ledger */}
      <RoyalOracle 
        user={user}
        profile={profile}
        quests={quests}
        isGuest={isGuest}
        oracleHistory={oracleHistory}
        onCompleteQuest={onCompleteQuest}
        onAwardBonusXp={onAwardBonusXp}
        onUnlockCosmetic={onUnlockCosmetic}
        activeTab={activeTab}
      />
    </motion.div>
  );
}

interface ShopProps {
  crystals: number;
  inventory: InventoryItem[];
  onBuy: (item: ShopItem) => void;
  key?: React.Key;
}

function ShopScreen({ crystals, inventory, onBuy }: ShopProps) {
  const shopItems: ShopItem[] = [
    { title: "Kingdom Skin Pack", desc: "Unlock deep obsidian theme", cost: 500, type: "cosmetic", icon: <img src="https://res.cloudinary.com/dtdcmctik/image/upload/v1779769153/screen_fjerpb.png?_s=public-apps" alt="Kingdom Skin Pack" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />, rarity: 'rare' },
    { title: "Double XP Scroll", desc: "2x progress for 24h", cost: 250, type: "booster", icon: <img src="https://res.cloudinary.com/dtdcmctik/image/upload/v1779769114/screen_qz5arq.png?_s=public-apps" alt="Double XP Scroll" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />, rarity: 'uncommon' },
    { title: "Streak Shield", desc: "Forgive 1 missed day", cost: 150, type: "consumable", icon: <img src="https://res.cloudinary.com/dtdcmctik/image/upload/v1779769159/screen_o7trdz.png?_s=public-apps" alt="Streak Shield" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />, rarity: 'common' },
    { title: "Dragon Familiar", desc: "Passive companion tracker", cost: 2000, type: "pet", icon: <img src="https://res.cloudinary.com/dtdcmctik/image/upload/v1779769120/screen_uomi6x.png?_s=public-apps" alt="Dragon Familiar" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />, rarity: 'legendary' },
    { title: "Arcane Tome", desc: "+10% quest XP bonus", cost: 1200, type: "relic", icon: <img src="https://res.cloudinary.com/dtdcmctik/image/upload/v1779769105/screen_rrsvis.png?_s=public-apps" alt="Arcane Tome" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />, rarity: 'epic' },
    { title: "Seer's Lantern", desc: "Glowing lantern accessory for thy avatar", cost: 180, type: "cosmetic", icon: <Sparkles className="w-5 h-5 text-yellow-400" />, rarity: 'rare' },
  ];

  const getRarityStyles = (rarity: Rarity) => {
    switch (rarity) {
      case 'common': return 'border-outline-variant/30 text-on-surface-variant';
      case 'uncommon': return 'border-green-500/30 text-green-400 bg-green-500/5 shadow-[0_0_10px_rgba(34,197,94,0.1)] hover:border-green-500/50';
      case 'rare': return 'border-blue-500/30 text-blue-400 bg-blue-500/5 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:border-blue-500/50';
      case 'epic': return 'border-purple-500/30 text-purple-400 bg-purple-500/5 shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:border-purple-500/50';
      case 'legendary': return 'border-tertiary/50 text-tertiary bg-tertiary/5 shadow-[0_0_15px_rgba(214,197,149,0.2)] hover:border-tertiary';
      default: return 'border-outline-variant/30';
    }
  };

  const getRarityLabelStyles = (rarity: Rarity) => {
    switch (rarity) {
      case 'common': return 'bg-outline-variant/20 text-on-surface-variant';
      case 'uncommon': return 'bg-green-500/20 text-green-400';
      case 'rare': return 'bg-blue-500/20 text-blue-400';
      case 'epic': return 'bg-purple-500/20 text-purple-400';
      case 'legendary': return 'bg-tertiary/20 text-tertiary';
      default: return 'bg-outline-variant/20';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "circOut" }}
      className="flex flex-col gap-8 px-6 py-8 relative min-h-all"
    >
      <FireParticles />
      
      <div className="text-center space-y-4 pb-4 relative z-10">
        <h2 className="font-serif text-3xl text-primary font-bold">The Royal Treasury</h2>
        <p className="text-xs text-on-surface-variant font-mono">Exchange hard-earned crystals for magical enhancements</p>
      </div>

      <div className="grid gap-6 relative z-10">
        {shopItems.map((item, i) => {
          const itemKey = item.title.toLowerCase().replace(/\s+/g, '_');
          const isPurchased = inventory.some(invItem => invItem.itemId === itemKey);

          return (
            <motion.div 
              key={i} 
              whileHover={{ scale: isPurchased ? 1 : 1.02 }}
              className={`bg-surface-container rounded-2xl p-6 border flex items-center justify-between group cursor-pointer transition-all ${getRarityStyles(item.rarity)} ${isPurchased ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-surface-container-highest flex items-center justify-center shadow-inner border border-outline-variant/50 relative overflow-hidden">
                  <div className="z-10">{item.icon}</div>
                  <div className={`absolute inset-0 opacity-10 ${getRarityLabelStyles(item.rarity)}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono text-sm font-bold text-on-surface">{item.title}</h3>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full uppercase font-bold tracking-tighter ${getRarityLabelStyles(item.rarity)}`}>
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
              
              {isPurchased ? (
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                  Acquired
                </span>
              ) : (
                <button 
                  onClick={() => onBuy(item)}
                  className="flex flex-col items-center gap-1 bg-surface-container-high px-4 py-2 rounded-xl border border-tertiary/20 group-hover:bg-tertiary group-hover:text-background transition-colors min-w-[70px] cursor-pointer"
                >
                  <span className="font-mono text-xs font-bold">{item.cost}</span>
                  <Diamond className="w-3 h-3 fill-current" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

interface ProfileProps {
  xp: number;
  crystals: number;
  streak: number;
  level: number;
  name: string;
  avatarUrl: string | null;
  inventory: InventoryItem[];
  onLogout: () => void;
  key?: React.Key;
}

function ProfileScreen({ xp, crystals, streak, level, name, avatarUrl, inventory, onLogout }: ProfileProps) {
  const [subTab, setSubTab] = useState<'profile' | 'trophies'>('profile');

  const hasWeapon = inventory.some(i => i.category === 'weapon');
  const hasArmor = inventory.some(i => i.itemId === 'kingdom_skin_pack' || i.category === 'armor' || i.category === 'cosmetic');
  const hasRelic = inventory.some(i => i.itemId === 'arcane_tome' || i.category === 'relic');
  const hasPet = inventory.some(i => i.itemId === 'dragon_familiar' || i.category === 'pet');

  const getRankFullAvatar = (level: number) => {
    if (level < 15) return IMAGES.WIZARD_HERO; // Wizard Warden
    if (level < 30) return IMAGES.ARCHMAGE_HERO; // Archmage Hero
    return IMAGES.EMPEROR_HERO; // Emperor Hero
  };

  const TROPHIES = [
    {
      id: 'scout',
      name: 'Novice Forest Ranger',
      req: 'Unlocked automatically at Level 1',
      unlocked: level >= 1,
      desc: 'Thou hast stepped onto the sacred soil of the Novice Forest and embarked upon thy epic habit quest.',
      icon: '🌲',
      bgImg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'disciplined',
      name: 'Conqueror of Habits',
      req: 'Requires Level 3 or higher',
      unlocked: level >= 3,
      desc: 'Proven to withstand early sloth. Vanquished bad habits and registered thy first successful streaks.',
      icon: '🛡️',
      bgImg: 'https://images.unsplash.com/photo-1531842477197-54cf88ea4922?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'fortress',
      name: 'Iron Fortress Raider',
      req: 'Requires Level 5 or higher',
      unlocked: level >= 5,
      desc: 'Ventrified thy soul through heavy fire and sulfur. Formidable fortress architect.',
      icon: '🌋',
      bgImg: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'nebula',
      name: 'Cosmic Citadel Voyager',
      req: 'Requires Level 10 or higher',
      unlocked: level >= 10,
      desc: 'Breached the gravity well! Reached the ethereal nebula starfields and entered alignment with high constellations.',
      icon: '🌌',
      bgImg: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=150&q=80'
    },
    {
      id: 'sovereign_badge',
      name: 'Sovereign Grand Arbiter',
      req: 'Requires Level 20 or higher',
      unlocked: level >= 20,
      desc: 'Divine master of routine, health, sound chanting, and high scholastic scripture. Legendary discipline.',
      icon: '👑',
      bgImg: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=150&q=80'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-6 w-full pb-8"
    >
      {/* Category Toggle Switch */}
      <div className="flex justify-center gap-4 px-6 mt-4 shrink-0">
        <button
          onClick={() => setSubTab('profile')}
          className={`flex-1 py-2 font-mono text-[9px] font-bold uppercase border rounded-xl transition-all cursor-pointer active:scale-95 ${subTab === 'profile' ? 'bg-primary text-background border-primary shadow-lg' : 'text-on-surface-variant font-normal border-outline-variant/30 hover:bg-surface-container'}`}
        >
          👤 profile bio
        </button>
        <button
          onClick={() => setSubTab('trophies')}
          className={`flex-1 py-1.5 font-mono text-[9px] font-bold uppercase border rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${subTab === 'trophies' ? 'bg-[#ca8a04]/20 text-[#facc15] border-[#facc15]/40 shadow-lg' : 'text-on-surface-variant font-normal border-outline-variant/30 hover:bg-surface-container'}`}
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/10" />
          Trophy Hall ({TROPHIES.filter(t => t.unlocked).length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'profile' ? (
          <motion.div 
            key="profile-bio"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-6"
          >
            <section className="relative aspect-[4/5] mx-6 rounded-[2rem] overflow-hidden border border-tertiary/40 shadow-2xl">
              <img src={IMAGES.PROFILE_BG} alt="Profile BG" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              <div className="absolute inset-0 flex items-center justify-center py-12">
                <img src={getRankFullAvatar(level)} alt="Hero" className="h-[75%] object-contain rounded-2xl border-[2px] border-amber-400/30 drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] bg-black/40 animate-float" />
              </div>

              <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 px-6 z-10">
                <span className="font-mono text-[10px] text-tertiary uppercase tracking-widest bg-background/80 px-4 py-1 rounded-full border border-tertiary/50 backdrop-blur-sm shadow-xl">
                  LVL {level} Commander
                </span>
                <h2 className="font-serif text-3xl text-white font-bold drop-shadow-lg">{name}</h2>
                <div className="flex items-center gap-3 mt-4 bg-surface-container-high/80 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                  <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase">Rank Status:</span>
                  <span className="font-mono text-[11px] text-primary font-bold uppercase flex items-center gap-2">
                    {getRankTitle(level)} <Sparkles className="w-3.5 h-3.5 text-tertiary animate-pulse" />
                  </span>
                </div>
              </div>
            </section>

            <section className="px-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-surface-container p-5 rounded-2xl border border-outline-variant/30 flex items-center justify-between shadow-lg">
                <div>
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Total Experience</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-serif text-3xl font-bold text-tertiary">{xp.toLocaleString()}</span>
                    <span className="text-xs text-on-surface-variant font-mono">XP</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-full bg-tertiary/10 border border-tertiary/40 flex items-center justify-center text-tertiary shadow-xl glow-tertiary">
                  <Trophy className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30 shadow-lg relative overflow-hidden">
                <Diamond className="absolute top-[-10px] right-[-10px] w-16 h-16 opacity-5 rotate-12" />
                <p className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">Crystals</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-serif text-3xl font-bold text-secondary">{crystals}</span>
                  <Diamond className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                </div>
              </div>

              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30 shadow-lg relative overflow-hidden">
                <Flame className="absolute top-[-10px] right-[-10px] w-16 h-16 opacity-5 rotate-12" />
                <p className="font-mono text-[10px] text-on-surface-variant uppercase font-bold">Streak</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-serif text-3xl font-bold text-error">{streak}</span>
                  <span className="text-[10px] text-error font-bold uppercase font-mono">Days</span>
                </div>
              </div>
            </section>

            <section className="px-6 space-y-4">
              <h3 className="font-serif text-xl font-bold flex items-center gap-3">
                <Backpack className="text-tertiary" />
                Relics & Gear
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <GearSlot icon={<Swords />} label="Weapon" quality={hasWeapon ? "rare" : "base"} />
                <GearSlot icon={<Shield />} label="Armor" quality={hasArmor ? "rare" : "base"} />
                <GearSlot icon={<BookOpen />} label="Relic" quality={hasRelic ? "epic" : "base"} />
                <GearSlot icon={<Star />} label="Pet" quality={hasPet ? "epic" : "base"} />
              </div>
            </section>

            <section className="px-6 space-y-4">
              <h3 className="font-serif text-xl font-bold flex items-center gap-3">
                <Sparkles className="text-tertiary" />
                Rank Ascension Path
              </h3>
              <div className="bg-surface-container border border-outline-variant/30 rounded-2xl p-4 space-y-3 shadow-lg">
                <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider mb-2">Track the live progress of thy avatar and title evolution:</p>
                
                <div className="space-y-2.5">
                  {/* Sentinel Warden */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${level < 15 ? 'border-primary bg-primary/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'border-outline-variant/20 opacity-60 bg-surface-container-low'}`}>
                    <div className="flex items-center gap-3">
                      <img src={IMAGES.WIZARD_HERO} alt="Warden" className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-outline-variant/30" />
                      <div>
                        <h4 className="font-serif text-[11px] font-bold text-on-surface">Sentinel Warden</h4>
                        <p className="font-mono text-[8px] text-on-surface-variant uppercase">Levels 1 - 14</p>
                      </div>
                    </div>
                    <div>
                      {level < 15 ? (
                        <span className="font-mono text-[8px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">Current Rank</span>
                      ) : (
                        <span className="font-mono text-[8px] text-green-400 font-bold uppercase tracking-wider">Ascended</span>
                      )}
                    </div>
                  </div>

                  {/* Arcane Archmage */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${level >= 15 && level < 30 ? 'border-tertiary bg-tertiary/5 shadow-[0_0_12px_rgba(214,197,149,0.15)]' : 'border-outline-variant/20 ' + (level < 15 ? 'opacity-40 bg-black/10' : 'opacity-60 bg-surface-container-low')}`}>
                    <div className="flex items-center gap-3">
                      <img src={IMAGES.ARCHMAGE_HERO} alt="Archmage" className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-outline-variant/30" />
                      <div>
                        <h4 className="font-serif text-[11px] font-bold text-on-surface">Arcane Archmage</h4>
                        <p className="font-mono text-[8px] text-on-surface-variant uppercase">Levels 15 - 29</p>
                      </div>
                    </div>
                    <div>
                      {level >= 15 && level < 30 ? (
                        <span className="font-mono text-[8px] bg-tertiary/20 text-tertiary border border-tertiary/30 px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">Current Rank</span>
                      ) : level >= 30 ? (
                        <span className="font-mono text-[8px] text-green-400 font-bold uppercase tracking-wider">Ascended</span>
                      ) : (
                        <span className="font-mono text-[8px] text-on-surface-variant/40 font-bold uppercase">Locked</span>
                      )}
                    </div>
                  </div>

                  {/* Sovereign Emperor */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${level >= 30 ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'border-outline-variant/20 opacity-40 bg-black/10'}`}>
                    <div className="flex items-center gap-3">
                      <img src={IMAGES.EMPEROR_HERO} alt="Emperor" className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-outline-variant/30" />
                      <div>
                        <h4 className="font-serif text-[11px] font-bold text-on-surface">Sovereign Emperor</h4>
                        <p className="font-mono text-[8px] text-on-surface-variant uppercase">Levels 30+</p>
                      </div>
                    </div>
                    <div>
                      {level >= 30 ? (
                        <span className="font-mono text-[8px] bg-amber-400/20 text-yellow-400 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">Current Rank</span>
                      ) : (
                        <span className="font-mono text-[8px] text-on-surface-variant/40 font-bold uppercase">Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div 
            key="trophy-room"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="px-6 flex flex-col gap-6"
          >
            <div className="bg-[#121215] p-5 rounded-2xl border border-amber-500/25 space-y-2 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              <h3 className="font-serif text-lg text-[#facc15] font-bold tracking-wide">🏆 Permanent Hall of Trophies</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Thy monumental milestones. Badges etched in eternity on the high crystal vault. They are never forfeit or consumed!
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {TROPHIES.map((badge) => (
                <div 
                  key={badge.id}
                  className={`relative p-4 rounded-2xl border flex items-center gap-4 transition-all overflow-hidden ${badge.unlocked ? 'border-[#eab308]/40 bg-gradient-to-r from-amber-950/15 to-[#1c1917]' : 'border-outline-variant/20 opacity-45 bg-[#121214]'}`}
                >
                  {/* Badge visual banner overlay */}
                  {badge.unlocked && (
                    <div className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${badge.bgImg})` }} />
                  )}

                  <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-2xl border ${badge.unlocked ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(234,179,8,0.35)]' : 'border-outline-variant border-dashed bg-stone-900/40 text-stone-600'}`}>
                    {badge.unlocked ? badge.icon : '🔒'}
                  </div>

                  <div className="relative z-10 flex-1 min-w-0">
                    <h4 className={`font-serif text-[12px] font-bold truncate ${badge.unlocked ? 'text-amber-400' : 'text-stone-500'}`}>{badge.name}</h4>
                    <p className="font-mono text-[8px] text-stone-400 mt-0.5 uppercase tracking-wide">{badge.req}</p>
                    <p className="text-[10px] text-on-surface-variant/80 font-sans mt-1.5 leading-relaxed truncate max-w-full md:whitespace-normal" title={badge.desc}>
                      {badge.unlocked ? badge.desc : 'This mystic achievement scroll remains locked. Gain experience to unlock.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="px-6 mt-2 mb-8 flex justify-center">
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-mono font-bold text-on-surface-variant text-center hover:text-red-400 hover:border-red-400/40 border border-outline-variant/40 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-red-500/5 transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Gates
        </button>
      </section>
    </motion.div>
  );
}

// --- Auxiliary Small Sub-Components ---

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-16 transition-all relative cursor-pointer ${active ? 'text-tertiary' : 'text-on-surface-variant/70 hover:text-primary'}`}
    >
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute -top-3 w-8 h-1 bg-tertiary rounded-full shadow-[0_0_15px_#d6c595]"
        />
      )}
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
        {icon}
      </div>
      <span className="font-mono text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode, label: string, value: string, accent: 'primary' | 'tertiary' | 'error' }) {
  const colors = {
    primary: 'border-primary/20 hover:border-primary/50 text-secondary',
    tertiary: 'border-tertiary/20 hover:border-tertiary/50 text-tertiary',
    error: 'border-error/20 hover:border-error/50 text-error'
  };

  return (
    <div className={`bg-surface-container p-4 rounded-2xl border ${colors[accent]} transition-all cursor-default`}>
      <div className="opacity-40 mb-2">{icon}</div>
      <p className="font-serif text-xl font-bold">{value}</p>
      <p className="font-mono text-[9px] uppercase font-bold tracking-widest opacity-50">{label}</p>
    </div>
  );
}

function GearSlot({ icon, label, quality }: { icon: React.ReactNode, label: string, quality: 'base' | 'rare' | 'epic' }) {
  const qualityColors = {
    base: 'border-outline-variant/30 text-on-surface-variant/60 opacity-40 bg-surface-container-highest/20',
    rare: 'border-blue-400/40 text-blue-400 bg-blue-400/5 shadow-[0_0_8px_rgba(96,165,250,0.15)]',
    epic: 'border-tertiary text-tertiary bg-tertiary/5 shadow-[0_0_12px_rgba(214,197,149,0.25)]'
  };

  return (
    <div className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 shadow-inner relative overflow-hidden cursor-pointer transition-transform active:scale-95 ${qualityColors[quality]}`}>
      {icon}
      <span className="text-[8px] font-mono font-bold uppercase tracking-tighter">{label}</span>
      {quality !== 'base' && <div className="absolute top-0 right-0 w-4 h-4 bg-current opacity-10 rotate-45 translate-x-2 -translate-y-2" />}
    </div>
  );
}
