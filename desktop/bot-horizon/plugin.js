/**
 * Bot Horizon — a tiny top-down town where your bots live, work and level up.
 * Uses your own Hermes bots and their routines. MIT.
 */
import { jsx, jsxs } from 'react/jsx-runtime'
import { useEffect, useRef, useState } from 'react'
import {
  PALETTE_AREA,
  ROUTES_AREA,
  SIDEBAR_NAV_AREA,
  STATUSBAR_AREAS,
  haptic,
  host,
  relativeTime,
  useQuery,
} from '@hermes/plugin-sdk'

/* ------------------------------------------------------------------ *
 * i18n (custom — EN default + ES)
 * ------------------------------------------------------------------ */

const BV_I18N = {
  en: {
    town: 'Bot Horizon', nav: 'Bot Horizon', palette: 'Bot Horizon — open the town',
    mayor: 'Mayor', mayorLevel: 'Town level',
    quests: 'Quest Board', questsEmpty: 'No routines yet. Give a bot a routine and it becomes a quest!', activePets: 'Active pets',
    nextRun: 'next', xp: 'XP', today: 'today', level: 'Level', state: 'state', badges: 'Badges',
    openChat: 'Open chat',
    credits: 'made with Hermes',
    empty: 'No bots yet. Create a Bot in the Bots tab and it will move into town!',
    noBackend: 'Backend not detected — add the Bot Horizon gateway plugin (see README) for live data.',
    busy: 'busy', working: 'working', talking: 'talking', thinking: 'thinking',
    questing: 'questing', idle: 'idle', sleeping: 'sleeping', offline: 'offline',
    levelup: '✨ {bot} reached Level {level} — {rank}!',
    townLevelup: '🏘️ Bot Horizon reached Town Level {level} — {rank}!',
    streak: 'Streak', streakTitle: 'Daily streak', streakDays: '{count}-day streak',
    lives: 'Lives', livesOf: '{lives}/{max}', buyLife: 'Buy a life', lifeCost: '100 coins',
    livesMax: 'Max lives reached', livesNoCoins: 'Not enough coins',
    streakHint: 'Use Hermes daily to keep the streak 🔥. Each day you miss costs a life ❤️ (buy more with coins). No lives = streak lost.',
    streakActive: 'Active — keep it going!', streakRisk: '⚠️ At risk — talk to Hermes within the next hour!',
    streakRiskBanner: '⏳ Your streak runs out soon — talk to Hermes to keep it!',
    streakProtected: '🛡️ Protected by a life', streakLost: '💔 Streak lost — start again',
    streakLast: 'Last check-in', hAgo: '{h}h ago', mAgo: '{m}m ago',
    streakEventLifeUsed: '🛡️ You missed a day — a life kept your streak! ({extra})',
    streakEventLost: '💔 Your streak was lost. Use Hermes daily to rebuild it!',
    streakEventBought: '❤️ +1 life bought!',
    workbench: 'Workbench — where bots work while busy', questFlag: 'Quest flag (routine active)',
    badgesTitle: 'Badges',
    levelsTitle: 'Levels & XP',
    botLadderTitle: 'Bot levels',
    townLadderTitle: 'Town level (global)',
    nextMilestone: 'Next streak milestone', milestoneReward: '{coins} coins',
    streakMilestone: '🎁 Streak {streak} days — you earned {coins} coins!',
    badgeHow: { 'first-steps': 'First bot message', 'quest-accepted': 'A bot has a routine', chatterbox: '100 bot messages', marathoner: '1,000 bot messages', 'night-owl': 'Active 23:00–05:00', speedster: 'Task in <1 min', collaborator: 'Join a group chat', messenger: 'Bot-to-bot DM', streak: '5-day streak' },
    placed: 'Placed in the town!',
    collapse: 'Collapse', expand: 'Expand',
    rankTitles: { Stone: 'Stone', Copper: 'Copper', Silver: 'Silver', Gold: 'Gold', Platinum: 'Platinum', Diamond: 'Diamond', Emerald: 'Emerald', Sapphire: 'Sapphire', Ruby: 'Ruby', Mythic: 'Mythic' },
    badgeNames: { 'first-steps': 'First Steps', 'quest-accepted': 'Quest Accepted', chatterbox: 'Chatterbox', marathoner: 'Marathoner', 'night-owl': 'Night Owl', speedster: 'Speedster', collaborator: 'Collaborator', messenger: 'Messenger', streak: 'On Fire' },
    help: 'Help', settings: 'Settings', store: 'Store', points: 'points', balance: 'Balance',
    howXp: 'How to earn XP', pointsTitle: 'Store · points',
    xpR1a: 'Every bot message written', xpR1b: '+1 XP',
    xpR2a: 'Every tool call completed', xpR2b: '+3 XP',
    xpR3a: 'Routine (quest) completed', xpR3b: '+10 XP',
    xpR4a: 'Group-chat turn', xpR4b: '+5 XP',
    xpR5a: 'Bot-to-bot DM handled', xpR5b: '+2 XP',
    xpR6a: '@mention handled', xpR6b: '+2 XP',
    ptsR1a: 'Every bot level-up', ptsR1b: '+50 points',
    ptsR2a: 'Every mayor (you) level-up', ptsR2b: '+100 points',
    statesTitle: 'Bot states — live in the town',
    statesHint: 'The town shows what every bot is doing right now:',
    storeHats: 'Hats', storeDecos: 'Decorations', storePets: 'Pets',
    buy: 'Buy', owned: 'Owned', equip: 'Equip', equipTo: 'Equip to', noBots: 'No bots to equip',
    buyHatHint: 'Buy a hat, then choose which bot wears it',
    petHint: 'Each bot can have one pet. Pets give passive bonuses every 15 min.',
    petIncome: '+{val} XP every 15 min', petBoost: '+{val}% XP boost',
    petHybrid: '+{val} XP/15min + {pct}% boost', petStreakSaver: 'Streak loss uses 1 less life',
    assignPet: 'Assign to', buyPet: 'Buy pet', bought: 'Bought', assigned: 'assigned', assignedTo: 'assigned to',
    decoPlaced: 'Placed in the town', show: 'Show', hide: 'Hide', remove: 'Remove',
    size: 'Size', rotation: 'Rotation', dragDecoHint: 'Drag it in the town to move it · click a placed decoration to configure',
    settingsTitle: 'Town settings', townNameLabel: 'Town name', mayorNameLabel: 'Mayor name', language: 'Language',
    resetPositions: 'Reset plot positions', resetTown: 'Reset town to zero',
    resetTownConfirm: 'Are you sure? This restarts the game: all bots go back to Level 1 with 0 XP and 0 points, and your town name, positions, hats and decorations are deleted. This cannot be undone.',
    resetTownYes: 'Yes, reset everything', cancel: 'Cancel',
    creditsTitle: 'Credits', repo: 'Plugin repo', repoUrl: 'https://github.com/DakkuaDev/hermes-plugins', donate: 'Buy me a coffee',
    close: 'Close', langEn: 'English', langEs: 'Español',
  },
  es: {
    town: 'Bot Horizon', nav: 'Bot Horizon', palette: 'Bot Horizon — abrir el pueblo',
    mayor: 'Alcalde', mayorLevel: 'Nivel del pueblo',
    quests: 'Tablón de misiones', questsEmpty: 'Aún no hay rutinas. ¡Dale una rutina a un bot y se convertirá en misión!', activePets: 'Mascotas activas',
    nextRun: 'próxima', xp: 'XP', today: 'hoy', level: 'Nivel', state: 'estado', badges: 'Insignias',
    openChat: 'Abrir chat',
    credits: 'hecho con Hermes',
    empty: 'Todavía no hay bots. Crea un Bot en la pestaña Bots y se mudará al pueblo.',
    noBackend: 'Backend no detectado — instala el plugin de gateway Bot Horizon (ver README) para datos en vivo.',
    busy: 'ocupado', working: 'trabajando', talking: 'hablando', thinking: 'pensando',
    questing: 'en misión', idle: 'libre', sleeping: 'durmiendo', offline: 'desconectado',
    levelup: '✨ {bot} alcanzó el Nivel {level} — ¡{rank}!',
    townLevelup: '🏘️ ¡Bot Horizon alcanzó el Nivel de Pueblo {level} — {rank}!',
    streak: 'Racha', streakTitle: 'Racha diaria', streakDays: '{count} días de racha',
    lives: 'Vidas', livesOf: '{lives}/{max}', buyLife: 'Comprar una vida', lifeCost: '100 monedas',
    livesMax: 'Máximo de vidas alcanzado', livesNoCoins: 'No tienes suficientes monedas',
    streakHint: 'Usa Hermes cada día para mantener la racha 🔥. Cada día perdido cuesta una vida ❤️ (compra más con monedas). Sin vidas = racha perdida.',
    streakActive: 'Activa — ¡síguela!', streakRisk: '⚠️ En riesgo — ¡habla con Hermes en la próxima hora!',
    streakRiskBanner: '⏳ Tu racha está por acabar — ¡habla con Hermes para mantenerla!',
    streakProtected: '🛡️ Protegida por una vida', streakLost: '💔 Racha perdida — empieza de nuevo',
    streakLast: 'Última actividad', hAgo: 'hace {h}h', mAgo: 'hace {m}m',
    streakEventLifeUsed: '🛡️ Fallaste un día — ¡una vida salvó tu racha! ({extra})',
    streakEventLost: '💔 Tu racha se perdió. ¡Usa Hermes cada día para recuperarla!',
    streakEventBought: '❤️ ¡Vida comprada!',
    workbench: 'Banco de trabajo — donde trabajan los bots', questFlag: 'Bandera de misión (rutina activa)',
    badgesTitle: 'Insignias',
    levelsTitle: 'Niveles y XP',
    botLadderTitle: 'Niveles de bot',
    townLadderTitle: 'Nivel del pueblo (global)',
    nextMilestone: 'Siguiente hito de racha', milestoneReward: '{coins} monedas',
    streakMilestone: '🎁 ¡Racha de {streak} días — ganaste {coins} monedas!',
    badgeHow: { 'first-steps': 'Primer mensaje de bot', 'quest-accepted': 'Un bot tiene rutina', chatterbox: '100 mensajes de bot', marathoner: '1.000 mensajes de bot', 'night-owl': 'Activo 23:00–05:00', speedster: 'Tarea en <1 min', collaborator: 'Chat de grupo', messenger: 'DM entre bots', streak: 'Racha de 5 días' },
    placed: '¡Colocada en el pueblo!',
    collapse: 'Contraer', expand: 'Expandir',
    rankTitles: { Stone: 'Piedra', Copper: 'Cobre', Silver: 'Plata', Gold: 'Oro', Platinum: 'Platino', Diamond: 'Diamante', Emerald: 'Esmeralda', Sapphire: 'Zafiro', Ruby: 'Rubí', Mythic: 'Mítico' },
    badgeNames: { 'first-steps': 'Primeros pasos', 'quest-accepted': 'Misión aceptada', chatterbox: 'Parlanchín', marathoner: 'Maratoniano', 'night-owl': 'Búho nocturno', speedster: 'Veloz', collaborator: 'Colaborador', messenger: 'Mensajero', streak: 'En racha' },
    help: 'Ayuda', settings: 'Ajustes', store: 'Tienda', points: 'puntos', balance: 'Saldo',
    howXp: 'Cómo ganar XP', pointsTitle: 'Tienda · puntos',
    xpR1a: 'Cada mensaje escrito por un bot', xpR1b: '+1 XP',
    xpR2a: 'Cada herramienta ejecutada', xpR2b: '+3 XP',
    xpR3a: 'Rutina (misión) completada', xpR3b: '+10 XP',
    xpR4a: 'Turno en chat de grupo', xpR4b: '+5 XP',
    xpR5a: 'DM entre bots gestionado', xpR5b: '+2 XP',
    xpR6a: '@mención gestionada', xpR6b: '+2 XP',
    ptsR1a: 'Cada subida de nivel de un bot', ptsR1b: '+50 puntos',
    ptsR2a: 'Cada subida de nivel del alcalde (tú)', ptsR2b: '+100 puntos',
    statesTitle: 'Estados de los bots — en directo en el pueblo',
    statesHint: 'El pueblo muestra lo que hace cada bot ahora mismo:',
    storeHats: 'Sombreros', storeDecos: 'Decoraciones', storePets: 'Mascotas',
    buy: 'Comprar', owned: 'Comprado', equip: 'Poner', equipTo: 'Poner a', noBots: 'No hay bots para equipar',
    buyHatHint: 'Compra un sombrero y elige qué bot lo lleva',
    petHint: 'Cada bot puede tener una mascota. Dan bonos pasivos cada 15 min.',
    petIncome: '+{val} XP cada 15 min', petBoost: '+{val}% de XP',
    petHybrid: '+{val} XP/15min + {pct}%', petStreakSaver: 'La racha gasta 1 vida menos',
    assignPet: 'Asignar a', buyPet: 'Comprar', bought: 'Comprado', assigned: 'asignada', assignedTo: 'asignada a',
    decoPlaced: 'Colocada en el pueblo', show: 'Mostrar', hide: 'Ocultar', remove: 'Quitar',
    size: 'Tamaño', rotation: 'Rotación', dragDecoHint: 'Arrástrala por el pueblo para moverla · haz clic en una decoración colocada para configurarla',
    settingsTitle: 'Ajustes del pueblo', townNameLabel: 'Nombre del pueblo', mayorNameLabel: 'Nombre del alcalde', language: 'Idioma',
    resetPositions: 'Reiniciar posiciones', resetTown: 'Reiniciar el pueblo a cero',
    resetTownConfirm: '¿Seguro? Se reinicia la partida: todos los bots vuelven al Nivel 1 con 0 XP y 0 puntos, y se borran el nombre, posiciones, sombreros y decoraciones. No se puede deshacer.',
    resetTownYes: 'Sí, reiniciar todo', cancel: 'Cancelar',
    creditsTitle: 'Créditos', repo: 'Repo del plugin', repoUrl: 'https://github.com/DakkuaDev/hermes-plugins', donate: 'Invítame a un café',
    close: 'Cerrar', langEn: 'English', langEs: 'Español',
  },
}

function useBvI18n(ctx) {
  const [lang, setLang] = useState(() => ctx.storage.get('lang') || 'en')
  const t = (key) => {
    const bundle = BV_I18N[lang] || BV_I18N.en
    const val = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), bundle)
    return val === undefined ? key : val
  }
  const setLangAndSave = (l) => { ctx.storage.set('lang', l); setLang(l) }
  return { t, lang, setLang: setLangAndSave }
}

/* ------------------------------------------------------------------ *
 * Game math (local ledger — same thresholds as the backend)
 * ------------------------------------------------------------------ */

// Level balance: TWO separate curves (mirrors the backend). Bots use
// BOT_LEVEL_XP; the town/mayor (global) level uses TOWN_LEVEL_XP — much
// harder: the global level must not be the same as a bot's. Top levels are
// a real grind on purpose.
const BOT_LEVEL_XP = [0, 200, 600, 1400, 2800, 5200, 9000, 15000, 24000, 40000]
const TOWN_LEVEL_XP = [0, 1000, 3000, 7000, 15000, 30000, 55000, 90000, 140000, 200000]
const LIFE_PRICE = 100
const RANKS = {
  1: ['Stone', '🪨'], 2: ['Copper', '🟤'], 3: ['Silver', '⚪'], 4: ['Gold', '🟡'],
  5: ['Platinum', '⚪'], 6: ['Diamond', '💎'], 7: ['Emerald', '🟢'],
  8: ['Sapphire', '🔵'], 9: ['Ruby', '🔴'], 10: ['Mythic', '🌟'],
}
function levelOf(xp) {
  let l = 1
  for (let i = 0; i < BOT_LEVEL_XP.length; i++) if (xp >= BOT_LEVEL_XP[i]) l = i + 1
  return l
}
function townLevelOf(xp) {
  let l = 1
  for (let i = 0; i < TOWN_LEVEL_XP.length; i++) if (xp >= TOWN_LEVEL_XP[i]) l = i + 1
  return l
}
function milestoneReward(streakDays) {
  // every 5 days: 5→50, 10→100, 15→150… coins
  return 50 * Math.max(1, Math.floor(streakDays / 5))
}
function rankOf(xp) {
  return RANKS[levelOf(xp)]
}
function localizeBot(bot, game) {
  const entry = game[bot.name]
  // /state sends game as plain ints {name: xp}; the demo used
  // {name: {xp}}. Accept both so the town never shows 0 while XP accrues.
  const xp = typeof entry === 'number' ? entry : ((entry && entry.xp) || 0)
  const lvl = levelOf(xp)
  const rank = RANKS[lvl]
  const badges = []
  if (xp >= 1) badges.push('first-steps')
  if ((bot.routines || []).length) badges.push('quest-accepted')
  if (xp >= 100) badges.push('chatterbox')
  if (xp >= 1000) badges.push('marathoner')
  return { ...bot, xp: { total_xp: xp, xp: 0 }, level: lvl, rank: rank[0], rankEmoji: rank[1], badges }
}
function earnedPoints(bots) {
  let p = 0
  for (const b of bots) p += 50 * Math.max(0, (b.level || 1) - 1)
  const userXp = bots.reduce((a, b) => a + (b.xp ? b.xp.total_xp : 0), 0)
  p += 100 * Math.max(0, townLevelOf(userXp) - 1)
  return p
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function fmtNext(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

function rel(ts) {
  if (!ts) return '—'
  try { return relativeTime(ts * 1000) || new Date(ts * 1000).toLocaleTimeString() }
  catch { return new Date(ts * 1000).toLocaleTimeString() }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const STATE_EMOJI = { working: '⚙️', talking: '💬', thinking: '🧠', questing: '📋', idle: '🙂', sleeping: '😴', offline: '⚡' }
const BADGE_EMOJI = { 'first-steps': '🎉', 'quest-accepted': '📋', chatterbox: '💬', marathoner: '🏆', 'night-owl': '🦉', speedster: '⚡', collaborator: '🤝', messenger: '📬', streak: '🔥' }
const BUSY_STATES = new Set(['working', 'talking', 'thinking', 'questing'])

const HOUSE_TIERS = [
  { min: 1, roof: '#c9b37c', size: 1 },
  { min: 2, roof: '#d6b374', size: 1.05 },
  { min: 3, roof: '#d08a5a', size: 1.1 },
  { min: 4, roof: '#cc7a4e', size: 1.15 },
  { min: 5, roof: '#e0654f', size: 1.2 },
  { min: 6, roof: '#b75c4a', size: 1.25 },
  { min: 7, roof: '#5f8fd9', size: 1.3 },
  { min: 8, roof: '#4a7ec9', size: 1.36 },
  { min: 9, roof: '#9b6fd4', size: 1.42 },
  { min: 10, roof: '#e8890c', size: 1.5 },
]
function houseTier(level) {
  let t = HOUSE_TIERS[0]
  for (const tier of HOUSE_TIERS) if (level >= tier.min) t = tier
  return t
}
function houseSizeClass(level) {
  return Math.min(4, Math.max(1, Math.ceil(level / 2.5)))
}

const HATS = [
  { id: 'bow', emoji: '🎀', price: 100 },
  { id: 'cap', emoji: '🧢', price: 120 },
  { id: 'grad', emoji: '🎓', price: 160 },
  { id: 'tophat', emoji: '🎩', price: 200 },
  { id: 'party', emoji: '🥳', price: 240 },
  { id: 'crown', emoji: '👑', price: 600 },
]

const DECOS = [
  { id: 'flowers', emoji: '🌷', price: 80, slot: { x: 12, y: 76 } },
  { id: 'lantern', emoji: '🏮', price: 140, slot: { x: 86, y: 74 } },
  { id: 'fence', emoji: '🪵', price: 160, slot: { x: 46, y: 82 } },
  { id: 'campfire', emoji: '🏕️', price: 180, slot: { x: 76, y: 80 } },
  { id: 'tree', emoji: '🌳', price: 240, slot: { x: 8, y: 30 } },
  { id: 'pond', emoji: '🪷', price: 480, slot: { x: 82, y: 24 } },
  { id: 'fountain', emoji: '⛲', price: 600, slot: { x: 44, y: 14 } },
  { id: 'statue', emoji: '🗿', price: 800, slot: { x: 10, y: 14 } } ,
]

// Pets — purchaseable companions for bots (server-side in ledger.json)
const PETS = [
  { id: 'chick', emoji: '🐤', name: 'Chick', cost: 100, type: 'periodic', value: 1 },
  { id : 'cat', emoji: '🐱', name: 'Cat', cost: 250, type: 'periodic', value: 3 },
  { id: 'dog', emoji: '🐶', name: 'Dog', cost: 500, type: 'periodic', value: 5 },
  { id: 'owl', emoji: '🦉', name: 'Owl', cost: 200, type: 'boost', value: 10 },
  { id: 'turtle', emoji: '🐢', name: 'Turtle', cost: 400, type: 'streak_saver', value: 1 },
  { id: 'dragon', emoji: '🐉', name: 'Dragon', cost: 1000, type: 'hybrid', value: 8, boostPct: 15 },
]

function petDesc(pet, t) {
  if (pet.type === 'periodic') return t('petIncome').replace('{val}', String(pet.value))
  if (pet.type === 'boost') return t('petBoost').replace('{val}', String(pet.value))
  if (pet.type === 'streak_saver') return t('petStreakSaver')
  if (pet.type === 'hybrid') return t('petHybrid').replace('{val}', String(pet.value)).replace('{pct}', String(pet.boostPct))
  return ''
}

function decoDefaults(id) {
  const d = DECOS.find((x) => x.id === id) || DECOS[0]
  return { id, emoji: d.emoji, shown: true, size: 1, rot: 0, x: d.slot.x, y: d.slot.y }
}

function loadDecos(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((d) => {
    const base = typeof d === 'string' ? decoDefaults(d) : { ...decoDefaults(d.id), ...d }
    // clamp old entries into the visible scene (edge slots used to clip)
    return { ...base, x: clamp(base.x, 4, 94), y: clamp(base.y, 10, 86) }
  })
}

function defaultPlotPos(i) {
  return { x: 8 + (i % 4) * 23, y: 42 + Math.floor(i / 4) * 22 }
}

/* ------------------------------------------------------------------ *
 * Avatar / House / overlays
 * ------------------------------------------------------------------ */

function GeometricFace({ shape, color, size = 46 }) {
  const fill = color || '#e8890c'
  let face
  if (shape === 'pill') face = jsx('rect', { x: 4, y: 10, width: 36, height: 24, rx: 12, fill })
  else if (shape === 'square') face = jsx('rect', { x: 7, y: 7, width: 30, height: 30, rx: 6, fill })
  else if (shape === 'diamond') face = jsx('rect', { x: 12, y: 2, width: 20, height: 20, transform: 'rotate(45 22 22)', fill })
  else if (shape === 'blob') face = jsx('path', { d: 'M22 2 C33 4 40 13 39 23 C38 33 30 42 22 41 C13 40 5 33 5 23 C5 13 12 0 22 2 Z', fill })
  else face = jsx('circle', { cx: 22, cy: 22, r: 20, fill })
  const eyes = jsxs('g', {
    className: 'bv-eyes',
    children: [jsx('circle', { cx: 17, cy: 20, r: 2.4, fill: '#fff' }), jsx('circle', { cx: 27, cy: 20, r: 2.4, fill: '#fff' })],
  })
  return jsxs('svg', { viewBox: '0 0 44 44', width: size, height: size, children: [face, eyes] })
}

function Avatar({ bot }) {
  const a = bot.avatar || {}
  if (a.dataUrl) return jsx('img', { src: a.dataUrl, alt: bot.name, className: 'bv-avatar-img', draggable: false })
  return jsx(GeometricFace, { shape: a.shape, color: a.color })
}

function House({ level }) {
  const lvl = level || 1
  const tier = houseTier(lvl)
  const cls = 'bv-house bv-house-t' + houseSizeClass(lvl)
  return jsxs('div', {
    className: cls,
    style: { '--roof': tier.roof },
    children: [
      jsx('div', { className: 'bv-h-ridge' }),
      jsx('div', { className: 'bv-h-window bv-h-w1' }),
      jsx('div', { className: 'bv-h-window bv-h-w2' }),
      jsx('div', { className: 'bv-h-door' }),
      jsx('div', { className: 'bv-h-lv', children: `Lv.${lvl}` }),
      level >= 9 ? jsx('div', { className: 'bv-h-flag', children: '🚩' }) : null,
      level >= 7 ? jsx('div', { className: 'bv-h-star', children: '✨' }) : null,
    ],
  })
}

function StateOverlay({ bot }) {
  const s = bot.state
  if (s === 'offline') return jsx('div', { className: 'bv-chip bv-chip-off', children: '⚡' })
  if (s === 'talking') {
    return jsx('div', { className: 'bv-bubble', children: jsx('span', { className: 'bv-bubble-dots', children: '···' }) })
  }
  if (s === 'sleeping') return jsx('div', { className: 'bv-zzz', children: '💤' })
  if (s === 'working' || s === 'questing') return jsx('div', { className: 'bv-chip', children: s === 'working' ? '⚙️' : '📋' })
  if (s === 'thinking') return jsx('div', { className: 'bv-chip bv-pulse', children: '🧠' })
  return null
}

function BotTooltip({ bot, t }) {
  const xp = bot.xp || {}
  const badges = (bot.badges || []).map((b) =>
    jsx('span', { key: b, className: 'bv-badge', title: t('badgeNames.' + b) || b, children: BADGE_EMOJI[b] || '🏅' }))
  return jsxs('div', {
    className: 'bv-tooltip',
    children: [
      jsx('div', { className: 'bv-tt-name', children: `${bot.title || bot.name} ${bot.rankEmoji || ''} Lv.${bot.level} · ${t('rankTitles.' + bot.rank) || bot.rank}` }),
      bot.description ? jsx('div', { className: 'bv-tt-desc', children: bot.description }) : null,
      jsxs('div', { className: 'bv-tt-row', children: [
        jsx('span', { children: `${t('state')}: ${t(bot.state) || bot.state}` }),
        jsx('span', { children: `🕐 ${rel(bot.lastActivityAt)}` }),
      ]}),
      jsxs('div', { className: 'bv-tt-row', children: [
        jsx('span', { children: `${xp.total_xp || 0} ${t('xp')} (${t('level')} ${bot.level})` }),
        jsx('span', { children: `${bot.badges && bot.badges.length ? t('badges') + ': ' + bot.badges.length : ''}` }),
      ]}),
      badges.length ? jsx('div', { className: 'bv-tt-badges', children: badges }) : null,
      jsx('div', { className: 'bv-tt-open', children: `↗ ${t('openChat')}` }),
    ],
  })
}

/* ------------------------------------------------------------------ *
 * Bot plot (draggable, sprite moves per state)
 * ------------------------------------------------------------------ */

function BotPlot({ bot, t, pos, onDrag, celebrating, hat, pet }) {
  const [hover, setHover] = useState(false)
  const [local, setLocal] = useState(pos)
  const dragRef = useRef(null)
  const s = bot.state
  const offline = s === 'offline'

  useEffect(() => setLocal(pos), [pos])

  const openChat = () => {
    haptic('tap')
    const chatId = bot.canonicalChat
    const fallback = () => {
      host.notify({ kind: 'info', message: `${bot.title || bot.name} → ${t('openChat')} (Bots tab)` })
      host.navigate('/')
    }
    if (chatId) host.request('session.resume', { sessionId: chatId }).catch(fallback)
    else fallback()
  }

  let target = 'door'
  if (s === 'working' || s === 'thinking') target = 'bench'
  if (s === 'questing') target = 'flag'

  const onPointerDown = (e) => {
    if (e.target.closest('.bv-sprite') || e.button !== 0) return
    const r = e.currentTarget.parentElement.getBoundingClientRect()
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: local.x, py: local.y, w: r.width || 1, h: r.height || 1, dragging: false, cur: null }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.dragging && Math.hypot(dx, dy) < 6) return
    d.dragging = true
    d.cur = { x: clamp(d.px + (dx / d.w) * 100, 2, 96), y: clamp(d.py + (dy / d.h) * 100, 30, 92) }
    setLocal(d.cur)
  }
  const onPointerUp = () => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    if (d.dragging && d.cur) onDrag(d.cur)
    else openChat()
  }

  const stateLabel = offline ? t('offline') : (s === 'sleeping' ? t('sleeping') : (t(s) || s))

  return jsxs('div', {
    className: 'bv-plot' + (offline ? ' bv-offline-plot' : ''),
    style: { left: `${local.x}%`, top: `${local.y}%` },
    onPointerDown, onPointerMove, onPointerUp,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    children: [
      jsx(House, { level: bot.level }),
      BUSY_STATES.has(s) ? jsx('div', { className: 'bv-bench', title: t('workbench') }) : null,
      jsx('div', { className: 'bv-flag', title: t('questFlag'), children: '📋' }),
      jsxs('div', {
        className: 'bv-sprite bv-target-' + target + (s === 'idle' ? ' bv-wander' : ''),
        onClick: (e) => { e.stopPropagation(); openChat() },
        children: [
          jsx('div', { className: 'bv-shadow' }),
          jsx('div', { className: 'bv-avatar-wrap', children: [
            celebrating ? jsx('div', { className: 'bv-sparkles', children: '✨✨✨' }) : null,
            hat ? jsx('div', { className: 'bv-hat', children: hat }) : null,
            pet ? jsx('div', { className: 'bv-pet', children: pet }) : null,
            jsx(Avatar, { bot }),
            jsx(StateOverlay, { bot }),
          ]}),
        ],
      }),
      jsxs('div', { className: 'bv-plot-label', children: [
        jsx('span', { className: 'bv-plot-name', children: bot.title || bot.name }),
        jsx('span', { className: 'bv-plot-rank', title: t('rankTitles.' + bot.rank) || bot.rank, children: `${bot.rankEmoji || ''}${bot.level}` }),
      ]}),
      jsx('div', { className: 'bv-plot-state', children: `${STATE_EMOJI[s] || '·'} ${stateLabel}` }),
      hover ? jsx(BotTooltip, { bot, t }) : null,
    ],
  })
}

/* ------------------------------------------------------------------ *
 * Decoration (draggable; click opens config in the store)
 * ------------------------------------------------------------------ */

function Deco({ deco, t, onMove, onClick }) {
  const dragRef = useRef(null)
  const [local, setLocal] = useState(deco)
  useEffect(() => setLocal(deco), [deco])

  const onPointerDown = (e) => {
    const r = e.currentTarget.parentElement.getBoundingClientRect()
    dragRef.current = { sx: e.clientX, sy: e.clientY, x: local.x, y: local.y, w: r.width || 1, h: r.height || 1, dragging: false, cur: null }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy
    if (!d.dragging && Math.hypot(dx, dy) < 6) return
    d.dragging = true
    d.cur = { x: clamp(d.x + (dx / d.w) * 100, 2, 96), y: clamp(d.y + (dy / d.h) * 100, 6, 92) }
    setLocal({ ...local, ...d.cur })
  }
  const onPointerUp = () => {
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    if (d.dragging && d.cur) onMove(d.cur)
    else onClick()
  }

  return jsx('div', {
    className: 'bv-deco',
    style: { left: `${local.x}%`, top: `${local.y}%`, fontSize: `${26 * (local.size || 1)}px`, transform: `rotate(${local.rot || 0}deg)` },
    onPointerDown, onPointerMove, onPointerUp,
    title: t('dragDecoHint'),
    children: deco.emoji,
  })
}

/* ------------------------------------------------------------------ *
 * Quest Board (collapsible)
 * ------------------------------------------------------------------ */

function QuestBoard({ bots, t, open, onToggle, pets }) {
  const quests = bots.flatMap((b) => (b.routines || []).map((r) => ({ bot: b, r })))
  const activePets = bots.flatMap((b) => {
    const pid = pets && pets[b.name]
    if (!pid) return []
    const def = PETS.find((p) => p.id === pid)
    return def ? [{ bot: b, def }] : []
  })
  if (!open) {
    return jsxs('div', { className: 'bv-quests-mini', children: [
      jsx('button', { className: 'bv-quests-toggle', title: t('expand'), onClick: onToggle, children: `📋 ${quests.length}` }),
    ]})
  }
  return jsxs('div', { className: 'bv-quests', children: [
    jsxs('div', { className: 'bv-quests-title', children: [
      jsx('span', { className: 'bv-quests-title-text', children: `📋 ${t('quests')}` }),
      jsx('button', { className: 'bv-btn bv-btn-ghost bv-btn-tiny', onClick: onToggle, children: t('collapse') }),
    ]}),
    quests.length === 0
      ? jsx('div', { className: 'bv-quests-sub', children: t('questsEmpty') })
      : jsx('div', {
          className: 'bv-quests-list',
          children: quests.map(({ bot, r }, i) => {
            return jsxs('div', {
              key: `${bot.name}-${r.name}-${i}`,
              className: 'bv-quest',
              children: [
                jsx('span', { className: 'bv-quest-emoji', children: '📜' }),
                jsxs('div', { className: 'bv-quest-main', children: [
                  jsx('div', { className: 'bv-quest-name', children: r.name || '—' }),
                  jsx('div', { className: 'bv-quest-meta', children: `${bot.title || bot.name} · ${t('nextRun')} ${fmtNext(r.next_run)} · +10 ${t('xp')}` }),
                ]}),
              ],
            })
          }),
        }),
    activePets.length > 0
      ? jsxs('div', { className: 'bv-quests-pets', children: [
          jsx('div', { className: 'bv-quests-sub', children: `🐾 ${t('activePets')}` }),
          activePets.map(({ bot, def }, i) => jsxs('div', {
            key: `${bot.name}-${def.id}-${i}`,
            className: 'bv-quest bv-quest-pet',
            children: [
              jsx('span', { className: 'bv-quest-emoji', children: def.emoji }),
              jsxs('div', { className: 'bv-quest-main', children: [
                jsx('div', { className: 'bv-quest-name', children: `${def.name} · ${bot.title || bot.name}` }),
                jsx('div', { className: 'bv-quest-meta', children: `✨ ${petDesc(def, t)}` }),
              ]}),
            ],
          })),
        ]})
      : null,
  ]})
}

/* ------------------------------------------------------------------ *
 * Mayor card
 * ------------------------------------------------------------------ */

function MayorCard({ user, t }) {
  const pct = Math.round((user.progress || 0) * 100)
  return jsxs('div', { className: 'bv-mayor', children: [
    jsx('div', { className: 'bv-mayor-crown', children: '👑' }),
    jsxs('div', { className: 'bv-mayor-main', children: [
      jsxs('div', { className: 'bv-mayor-title', children: [
        jsx('span', { children: `${user.name} · ${t('mayor')}` }),
        jsx('span', { className: 'bv-mayor-rank', children: `${user.rankEmoji} ${t('rankTitles.' + user.rank) || user.rank} Lv.${user.level}` }),
      ]}),
      jsxs('div', { className: 'bv-progress', children: [jsx('div', { className: 'bv-progress-fill', style: { width: `${pct}%` } })] }),
      jsx('div', { className: 'bv-mayor-xp', children: `${user.xp} ${t('xp')} · ${t('mayorLevel')} ${user.level}/10` }),
    ]}),
  ]})
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

function StorePanel({ ctx, t, bots, user, hats, setHats, spent, setSpent, decos, setDecos, openTab, onClose, balance, pets }) {
  const [tab, setTab] = useState(openTab || 'hats')
  const [equipFor, setEquipFor] = useState(bots[0] ? bots[0].name : '')
  // Pets live server-side (ledger); the server validates ownership
  const [serverPets, setServerPets] = useState(pets || {})

  const persist = (key, val) => { ctx.storage.set(key, val); return val }

  const buyHat = (h) => {
    if (balance < h.price || hats[h.id]) return
    haptic('tap')
    setSpent(persist('spent', spent + h.price))
    setHats(persist('hats', { ...hats, [h.id]: true }))
  }
  const equipHat = (h, botName) => {
    if (!botName) return
    const next = { ...hats, equipped: { ...(hats.equipped || {}), [botName]: h.id } }
    setHats(persist('hats', next))
  }
  const buyDeco = (d) => {
    if (balance < d.price || decos.some((x) => x.id === d.id)) return
    haptic('tap')
    const next = [...decos, decoDefaults(d.id)]
    setSpent(persist('spent', spent + d.price))
    setDecos(persist('decos', next))
    host.notify({ kind: 'info', message: `${d.emoji} ${t('placed')}` })
  }
  const patchDeco = (id, patch) => {
    const next = decos.map((d) => (d.id === id ? { ...d, ...patch } : d))
    setDecos(persist('decos', next))
  }
  const removeDeco = (id) => {
    const next = decos.filter((d) => d.id !== id)
    setDecos(persist('decos', next))
  }

  const botOptions = bots.map((b) => jsx('option', { key: b.name, value: b.name, children: b.title || b.name }))

  const hatList = HATS.map((h) => {
    const owned = !!hats[h.id]
    const equippedHere = (hats.equipped || {})[equipFor] === h.id
    const selectEl = jsx('select', {
      className: 'bv-select',
      value: equipFor,
      onChange: (e) => setEquipFor(e.target.value),
      children: botOptions,
    })
    return jsxs('div', { key: h.id, className: 'bv-store-item', children: [
      jsx('div', { className: 'bv-store-emoji', children: h.emoji }),
      jsxs('div', { className: 'bv-store-info', children: [
        jsx('div', { className: 'bv-store-name', children: h.id }),
        jsx('div', { className: 'bv-store-price', children: `${h.price} 🪙` }),
      ]}),
      owned
        ? jsxs('div', { className: 'bv-store-actions', children: [
            selectEl,
            jsx('button', { className: 'bv-btn', disabled: !equipFor || equippedHere, onClick: () => equipHat(h, equipFor), children: equippedHere ? t('equip') + ' ✓' : t('equip') }),
          ]})
        : jsx('button', { className: 'bv-btn', disabled: balance < h.price, onClick: () => buyHat(h), children: t('buy') }),
    ]})
  })

  const decoList = DECOS.map((d) => {
    const owned = decos.find((x) => x.id === d.id)
    return jsxs('div', { key: d.id, className: 'bv-store-item bv-deco-item', children: [
      jsx('div', { className: 'bv-store-emoji', children: d.emoji }),
      jsxs('div', { className: 'bv-store-info', children: [
        jsx('div', { className: 'bv-store-name', children: d.id }),
        jsx('div', { className: 'bv-store-price', children: owned ? t('decoPlaced') : `${d.price} 🪙` }),
        owned ? jsxs('div', { className: 'bv-deco-config', children: [
          jsxs('label', { className: 'bv-slider-row', children: [
            jsx('span', { children: t('size') }),
            jsx('input', { type: 'range', min: 0.5, max: 2.5, step: 0.1, value: owned.size, onChange: (e) => patchDeco(d.id, { size: Number(e.target.value) }) }),
            jsx('span', { className: 'bv-slider-val', children: owned.size.toFixed(1) }),
          ]}),
          jsxs('label', { className: 'bv-slider-row', children: [
            jsx('span', { children: t('rotation') }),
            jsx('input', { type: 'range', min: 0, max: 360, step: 15, value: owned.rot, onChange: (e) => patchDeco(d.id, { rot: Number(e.target.value) }) }),
            jsx('span', { className: 'bv-slider-val', children: `${owned.rot}°` }),
          ]}),
          jsxs('div', { className: 'bv-deco-actions', children: [
            jsx('button', { className: 'bv-btn', onClick: () => patchDeco(d.id, { shown: !owned.shown }), children: owned.shown ? t('hide') : t('show') }),
            jsx('button', { className: 'bv-btn bv-btn-danger', onClick: () => removeDeco(d.id), children: '🗑 ' + t('remove') }),
          ]}),
        ]}) : null,
      ]}),
      owned
        ? jsx('span', { className: 'bv-owned', children: '✓' })
        : jsx('button', { className: 'bv-btn', disabled: balance < d.price, onClick: () => buyDeco(d), children: t('buy') }),
    ]})
  })

    // --- Pets tab ---
    const petListArr = PETS.map((p) => {
      const owner = serverPets ? Object.keys(serverPets).find((n) => serverPets[n] === p.id) : undefined
      const owned = !!owner
      const myPet = owner === equipFor
      const assignAction = () => {
        if (!owned && balance < p.cost) return
        haptic('tap')
        ctx.rest('/buy-pet?bot_name=' + encodeURIComponent(equipFor) + '&pet_id=' + encodeURIComponent(p.id), { method: 'POST' })
          .then((r) => { if (r && r.ok) { if (!owned) setSpent(persist('spent', spent + p.cost)); setServerPets(r.pets) } })
          .catch(() => {})
      }
      const label = p.type === 'periodic' ? t('petIncome').replace('{val}', String(p.value))
        : p.type === 'boost' ? t('petBoost').replace('{val}', String(p.value))
        : p.type === 'streak_saver' ? t('petStreakSaver')
        : p.type === 'hybrid' ? t('petHybrid').replace('{val}', String(p.value)).replace('{pct}', String(p.boostPct || 15))
        : ''
      return jsxs('div', { key: p.id, className: 'bv-store-item', children: [
        jsx('div', { className: 'bv-store-emoji', children: p.emoji }),
        jsxs('div', { className: 'bv-store-info', children: [
          jsx('div', { className: 'bv-store-name', children: p.name }),
          jsx('div', { className: 'bv-store-price', children: `${owned ? (myPet ? '✓ ' + t('assigned') : t('assignedTo') + ' ' + (bots.find(b => b.name === owner)?.title || owner)) : p.cost + ' 🪙'} · ${label}` }),
        ]}),
        jsxs('div', { className: 'bv-store-actions', children: [
          jsx('select', { className: 'bv-select', value: equipFor, onChange: (e) => setEquipFor(e.target.value), children: botOptions }),
          jsx('button', { className: 'bv-btn', disabled: !owned && balance < p.cost, onClick: assignAction, children: owned ? t('assignPet') : t('buy') }),
        ]}),
      ]})
    })

    return jsxs('div', {
      className: 'bv-overlay',
      onClick: (e) => { if (e.target === e.currentTarget) onClose() },
      children: [
        jsxs('div', { className: 'bv-popover bv-store', children: [
          jsxs('div', { className: 'bv-pop-head', children: [
            jsx('div', { className: 'bv-pop-title', children: `🛒 ${t('store')}` }),
            jsx('div', { className: 'bv-balance', children: `${t('balance')}: ${balance} 🪙` }),
            jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: onClose, children: '✕' }),
          ]}),
          jsxs('div', { className: 'bv-tabs', children: [
            jsx('button', { className: 'bv-tab' + (tab === 'hats' ? ' bv-tab-on' : ''), onClick: () => setTab('hats'), children: `🎩 ${t('storeHats')}` }),
            jsx('button', { className: 'bv-tab' + (tab === 'decos' ? ' bv-tab-on' : ''), onClick: () => setTab('decos'), children: `🏡 ${t('storeDecos')}` }),
            jsx('button', { className: 'bv-tab' + (tab === 'pets' ? ' bv-tab-on' : ''), onClick: () => setTab('pets'), children: `🐾 ${t('storePets')}` }),
          ]}),
          tab === 'hats'
            ? jsxs('div', { className: 'bv-store-body', children: [
                jsx('div', { className: 'bv-store-hint', children: t('buyHatHint') }),
                hatList,
              ]})
            : tab === 'decos'
            ? jsxs('div', { className: 'bv-store-body', children: [
                jsx('div', { className: 'bv-store-hint', children: t('dragDecoHint') }),
                decoList,
              ]})
            : jsxs('div', { className: 'bv-store-body', children: [
                petListArr,
              ]}),
        ]}),
      ],
    })
  }

/* ------------------------------------------------------------------ *
 * Help / Settings / Credits
 * ------------------------------------------------------------------ */

function StateDemo({ state, t }) {
  const label = t(state) || state
  return jsxs('div', { className: 'bv-demo', children: [
    jsxs('div', { className: 'bv-demo-scene', children: [
      jsx('div', { className: 'bv-shadow' }),
      jsx('div', { className: 'bv-demo-avatar', children: [
        jsx('div', { className: 'bv-demo-face' }),
        jsx(StateOverlay, { bot: { state } }),
      ]}),
    ]}),
    jsx('div', { className: 'bv-demo-label', children: `${STATE_EMOJI[state] || ''} ${label}` }),
  ]})
}

function StreakPanel({ t, streak, balance, onBuyLife, onClose }) {
  const st = streak || {}
  const count = st.count || 0
  const lives = st.lives === undefined ? 3 : st.lives
  const maxLives = st.max_lives || 5
  const lastTs = st.last_activity_ts || 0
  const now = Date.now() / 1000
  const age = lastTs ? now - lastTs : null
  const risk = age !== null && age >= 23 * 3600 && age < 24 * 3600 && count > 0
  const status = count <= 0 ? 'lost' : risk ? 'risk' : 'active'
  const statusTxt = { active: t('streakActive'), risk: t('streakRisk'), lost: t('streakLost') }[status]
  const ageTxt = age === null ? '—'
    : age < 3600 ? t('mAgo').replace('{m}', String(Math.max(1, Math.round(age / 60))))
    : t('hAgo').replace('{h}', String(Math.round(age / 3600)))
  const canBuy = lives < maxLives && balance >= LIFE_PRICE
  const buyReason = lives >= maxLives ? t('livesMax') : balance < LIFE_PRICE ? t('livesNoCoins') : ''
  return jsxs('div', { className: 'bv-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose() }, children: [
    jsxs('div', { className: 'bv-popover bv-help', children: [
      jsxs('div', { className: 'bv-pop-head', children: [
        jsx('div', { className: 'bv-pop-title', children: `🔥 ${t('streakTitle')}` }),
        jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: onClose, children: '✕' }),
      ]}),
      jsxs('div', { className: 'bv-streak-hero', children: [
        jsx('span', { className: 'bv-streak-fire', children: '🔥' }),
        jsxs('div', { children: [
          jsx('div', { className: 'bv-streak-count', children: String(count) }),
          jsx('div', { className: 'bv-streak-label', children: t('streakDays').replace('{count}', String(count)) }),
        ]}),
      ]}),
      jsx('div', { className: 'bv-help-hint', children: statusTxt }),
      jsxs('div', { className: 'bv-help-row', children: [jsx('span', { children: t('streakLast') }), jsx('b', { children: ageTxt })] }),
      jsxs('div', { className: 'bv-streak-lives', children: [
        jsx('span', { children: `❤️ ${t('lives')}: ${lives}/${maxLives}` }),
        jsx('button', {
          className: 'bv-btn' + (canBuy ? '' : ' bv-btn-disabled'),
          disabled: !canBuy,
          title: buyReason,
          onClick: () => { if (canBuy) { onBuyLife(); haptic('tap') } },
          children: `+1 ${t('buyLife')} · ${LIFE_PRICE} 🪙`,
        }),
      ]}),
      jsxs('div', { className: 'bv-help-row', children: [
        jsx('span', { children: t('nextMilestone') }),
        jsx('b', { children: `🔥${(Math.floor(count / 5) + 1) * 5} → ${milestoneReward((Math.floor(count / 5) + 1) * 5)} 🪙` }),
      ]}),
      jsx('div', { className: 'bv-help-title', children: 'ℹ️' }),
      jsx('div', { className: 'bv-help-hint', children: t('streakHint') }),
    ]}),
  ]})
}

function HelpPanel({ t, onClose }) {
  const xpRules = [
    ['xpR1a', 'xpR1b'], ['xpR2a', 'xpR2b'], ['xpR3a', 'xpR3b'],
    ['xpR4a', 'xpR4b'], ['xpR5a', 'xpR5b'], ['xpR6a', 'xpR6b'],
  ]
  const ptsRules = [['ptsR1a', 'ptsR1b'], ['ptsR2a', 'ptsR2b']]
  const states = ['working', 'talking', 'thinking', 'questing', 'sleeping', 'offline']
  return jsxs('div', { className: 'bv-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose() }, children: [
    jsxs('div', { className: 'bv-popover bv-help', children: [
      jsxs('div', { className: 'bv-pop-head', children: [
        jsx('div', { className: 'bv-pop-title', children: `❓ ${t('help')}` }),
        jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: onClose, children: '✕' }),
      ]}),
      jsxs('div', { className: 'bv-help-grid', children: [
        jsxs('div', { className: 'bv-help-col', children: [
          jsx('div', { className: 'bv-help-title', children: t('howXp') }),
          jsx('div', { className: 'bv-help-list', children: xpRules.map(([a, b], i) => {
            return jsxs('div', { key: i, className: 'bv-help-row', children: [jsx('span', { children: t(a) }), jsx('b', { children: t(b) })] })
          })}),
          jsx('div', { className: 'bv-help-title', children: t('pointsTitle') }),
          jsx('div', { className: 'bv-help-list', children: ptsRules.map(([a, b], i) => {
            return jsxs('div', { key: i, className: 'bv-help-row', children: [jsx('span', { children: t(a) }), jsx('b', { children: t(b) })] })
          })}),
          jsx('div', { className: 'bv-help-title', children: t('statesTitle') }),
          jsx('div', { className: 'bv-help-hint', children: t('statesHint') }),
          jsx('div', { className: 'bv-demos', children: states.map((s) => jsx(StateDemo, { key: s, state: s, t })) }),
        ]}),
        jsxs('div', { className: 'bv-help-col', children: [
          jsx('div', { className: 'bv-help-title', children: t('levelsTitle') }),
          jsx('div', { className: 'bv-help-sub', children: t('botLadderTitle') }),
          jsx('div', { className: 'bv-help-list', children: BOT_LEVEL_XP.map((need, i) => {
            const r = RANKS[i + 1]
            return jsxs('div', { key: i, className: 'bv-help-row', children: [
              jsx('span', { children: `Lv.${i + 1} ${r[1]} ${r[0]}` }),
              jsx('b', { children: `${need.toLocaleString()} XP` }),
            ]})
          })}),
          jsx('div', { className: 'bv-help-sub', children: t('townLadderTitle') }),
          jsx('div', { className: 'bv-help-list', children: TOWN_LEVEL_XP.map((need, i) => {
            const r = RANKS[i + 1]
            return jsxs('div', { key: i, className: 'bv-help-row', children: [
              jsx('span', { children: `Lv.${i + 1} ${r[1]} ${r[0]}` }),
              jsx('b', { children: `${need.toLocaleString()} XP` }),
            ]})
          })}),
        ]}),
        jsxs('div', { className: 'bv-help-col', children: [
          jsx('div', { className: 'bv-help-title', children: t('badgesTitle') }),
          jsx('div', { className: 'bv-help-list', children: Object.keys(t('badgeHow')).map((id) => {
            const emoji = { 'first-steps': '🎉', 'quest-accepted': '📋', chatterbox: '💬', marathoner: '🏆', 'night-owl': '🦉', speedster: '⚡', collaborator: '🤝', messenger: '📬', streak: '🔥' }[id] || '🏅'
            return jsxs('div', { key: id, className: 'bv-help-row', children: [
              jsx('span', { children: `${emoji} ${(t('badgeNames')[id]) || id}` }),
              jsx('b', { children: t('badgeHow')[id] }),
            ]})
          })}),
        ]}),
        jsxs('div', { className: 'bv-help-col', children: [
          jsx('div', { className: 'bv-help-title', children: `🐾 ${t('storePets')}` }),
          jsx('div', { className: 'bv-help-list', children: [
            jsx('div', { className: 'bv-help-row', children: [jsx('span', { children: t('petHint') })] }),
            ...PETS.map((p, i) => jsx('div', { key: i, className: 'bv-help-row', children: [
              jsx('span', { children: `${p.emoji} ${p.name} (${p.cost} 🪙)` }),
              jsx('b', { children: petDesc(p, t) }),
            ]})),
          ]}),
        ]}),
      ]}),
    ]}),
  ]})
}

function SettingsPanel({ ctx, t, lang, setLang, townName, setTownName, mayorName, setMayorName, onResetPlots, onResetTown, onClose }) {
  const [draft, setDraft] = useState(townName)
  const [mayorDraft, setMayorDraft] = useState(mayorName)
  const [confirming, setConfirming] = useState(false)
  const save = () => {
    const v = draft.trim() || t('town')
    setTownName(v)
    const mv = mayorDraft.trim() || t('mayor')
    setMayorName(mv)
    onClose()
  }
  return jsxs('div', { className: 'bv-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose() }, children: [
    jsxs('div', { className: 'bv-popover bv-settings', children: [
      jsxs('div', { className: 'bv-pop-head', children: [
        jsx('div', { className: 'bv-pop-title', children: `⚙️ ${t('settingsTitle')}` }),
        jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: onClose, children: '✕' }),
      ]}),
      jsxs('div', { className: 'bv-settings-row', children: [
        jsx('label', { className: 'bv-settings-label', children: t('townNameLabel') }),
        jsx('input', { className: 'bv-name-input', value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') save() } }),
        jsx('button', { className: 'bv-btn', onClick: save, children: 'OK' }),
      ]}),
      jsxs('div', { className: 'bv-settings-row', children: [
        jsx('label', { className: 'bv-settings-label', children: t('mayorNameLabel') }),
        jsx('input', { className: 'bv-name-input', value: mayorDraft, onChange: (e) => setMayorDraft(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') save() } }),
        jsx('button', { className: 'bv-btn', onClick: save, children: 'OK' }),
      ]}),
      jsxs('div', { className: 'bv-settings-row', children: [
        jsx('label', { className: 'bv-settings-label', children: t('language') }),
        jsx('select', {
          className: 'bv-select',
          value: lang,
          onChange: (e) => setLang(e.target.value),
          children: [
            jsx('option', { value: 'en', children: t('langEn') }),
            jsx('option', { value: 'es', children: t('langEs') }),
          ],
        }),
      ]}),
      jsx('button', { className: 'bv-btn bv-btn-block', onClick: () => { onResetPlots && onResetPlots(); haptic('tap') }, children: t('resetPositions') }),
      confirming
        ? jsxs('div', { className: 'bv-confirm', children: [
            jsx('div', { className: 'bv-confirm-text', children: `⚠️ ${t('resetTownConfirm')}` }),
            jsxs('div', { className: 'bv-confirm-actions', children: [
              jsx('button', { className: 'bv-btn bv-btn-danger', onClick: () => { onResetTown(); haptic('tap') }, children: t('resetTownYes') }),
              jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: () => setConfirming(false), children: t('cancel') }),
            ]}),
          ]})
        : jsx('button', { className: 'bv-btn bv-btn-block bv-btn-danger', onClick: () => setConfirming(true), children: `⚠️ ${t('resetTown')}` }),
    ]}),
  ]})
}

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/dakkua'
const DONATE_QR = 'data:image/png;base64,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' // embedded at build time

function CreditsPanel({ t, onClose }) {
  return jsxs('div', { className: 'bv-overlay', onClick: (e) => { if (e.target === e.currentTarget) onClose() }, children: [
    jsxs('div', { className: 'bv-popover bv-credits', children: [
      jsxs('div', { className: 'bv-pop-head', children: [
        jsx('div', { className: 'bv-pop-title', children: `©️ ${t('creditsTitle')}` }),
        jsx('button', { className: 'bv-btn bv-btn-ghost', onClick: onClose, children: '✕' }),
      ]}),
      jsx('div', { className: 'bv-credits-hero', children: '🏘️ Bot Horizon' }),
      jsx('div', { className: 'bv-credits-line', children: t('credits') }),
      jsx('div', { className: 'bv-credits-links', children: [
        jsx('a', { className: 'bv-credits-link', href: t('repoUrl'), target: '_blank', rel: 'noreferrer', onClick: () => haptic('tap'), children: t('repo') }),
      ]}),
      jsx('div', { className: 'bv-donate', children: [
        jsx('img', { src: DONATE_QR, alt: 'QR', width: 120, height: 120, style: { borderRadius: 10 } }),
        jsx('a', { className: 'bv-btn bv-donate-btn', href: BUY_ME_A_COFFEE_URL, target: '_blank', rel: 'noreferrer', onClick: () => haptic('tap'), children: `☕ ${t('donate')}` }),
      ]}),
    ]}),
  ]})
}

/* ------------------------------------------------------------------ *
 * The town page
 * ------------------------------------------------------------------ */

let navDisposer = null
function ensureNav(ctx, label) {
  if (navDisposer) { navDisposer(); navDisposer = null }
  navDisposer = ctx.register({
    id: 'nav',
    area: SIDEBAR_NAV_AREA,
    data: { path: '/bot-horizon', label, codicon: 'home' },
  })
}

function BotHorizonPage({ ctx }) {
  const { t, lang, setLang } = useBvI18n(ctx)
  const now = useNow(60000)
  const hour = new Date(now).getHours()
  const [townName, setTownNameRaw] = useState(() => ctx.storage.get('townName') || t('town'))
  const [mayorName, setMayorNameRaw] = useState(() => ctx.storage.get('mayorName') || '')
  const setMayorName = (v) => { ctx.storage.set('mayorName', v); setMayorNameRaw(v) }
  const [panel, setPanel] = useState(null)
  const [storeTab, setStoreTab] = useState('hats')
  const [celebration, setCelebration] = useState(null)
  const [floaters, setFloaters] = useState([])
  const [plots, setPlots] = useState(() => ctx.storage.get('plots') || {})
  const [decos, setDecos] = useState(() => loadDecos(ctx.storage.get('decos')))
  const [hats, setHats] = useState(() => ctx.storage.get('hats') || {})
  const [spent, setSpent] = useState(() => ctx.storage.get('spent') || 0)
  const [questsOpen, setQuestsOpen] = useState(() => ctx.storage.get('questsOpen') !== false)
  const [streakBanner, setStreakBanner] = useState(null)
  const [milestoneCoins, setMilestoneCoins] = useState(() => ctx.storage.get('milestoneCoins') || 0)
  const [milestoneSeen, setMilestoneSeen] = useState(() => ctx.storage.get('milestoneSeen') || 0)

  const prevGame = useRef(null)
  const prevLocalLevel = useRef({})
  const prevTownLevel = useRef(null)
  const notified = useRef(new Set())
  const streakNotified = useRef(new Set())

  const { data, isError } = useQuery({
    queryKey: ['bot-horizon', 'state'],
    queryFn: () => ctx.rest('/state?avatars=1'),
    refetchInterval: 10000,
    retry: false,
  })

  const persist = (key, val) => { ctx.storage.set(key, val); return val }

  const setTownName = (v) => {
    ctx.storage.set('townName', v)
    setTownNameRaw(v)
    ensureNav(ctx, v)
  }

  const toggleQuests = () => {
    const v = !questsOpen
    setQuestsOpen(v)
    ctx.storage.set('questsOpen', v)
  }

  const resetTown = () => {
    for (const k of ['townName', 'mayorName', 'plots', 'decos', 'hats', 'spent', 'questsOpen']) ctx.storage.remove(k)
    setTownNameRaw(t('town'))
    setMayorNameRaw('')
    ensureNav(ctx, t('town'))
    setPlots({})
    setDecos([])
    setHats({})
    setSpent(0)
    setQuestsOpen(true)
    prevGame.current = null
    prevLocalLevel.current = {}
    prevTownLevel.current = null
    setPanel(null)
    haptic('tap')
    ctx.rest('/reset', { method: 'POST' }).catch(() => {})
  }

  // Game loop: read the 24/7 ledger from the backend; animate deltas + level-ups
  useEffect(() => {
    if (!data || !data.game) return
    const newGame = data.game
    const deltas = []
    const levelUps = []
    for (const name of Object.keys(newGame)) {
      const nx = newGame[name] || 0
      const firstSeen = prevGame.current === null || prevGame.current[name] === undefined
      if (firstSeen) {
        prevLocalLevel.current[name] = levelOf(nx)   // baseline: no retro toasts
        continue
      }
      const px = prevGame.current[name] || 0
      if (nx > px) deltas.push({ name, delta: nx - px })
      const pl = prevLocalLevel.current[name] !== undefined ? prevLocalLevel.current[name] : 1
      const nl = levelOf(nx)
      if (nl > pl && !notified.current.has(`${name}:${nl}`)) {
        notified.current.add(`${name}:${nl}`)
        levelUps.push({ name, level: nl })
      }
      prevLocalLevel.current[name] = nl
    }
    // Town/mayor level uses its own (much harder) curve — sum all bot game XP.
    const townXp = Object.values(newGame).reduce((a, n) => a + (typeof n === 'number' ? n : ((n && n.xp) || 0)), 0)
    const townLvl = townLevelOf(townXp)
    if (prevTownLevel.current === null) {
      prevTownLevel.current = townLvl          // baseline on first sight
    } else if (townLvl > prevTownLevel.current) {
      prevTownLevel.current = townLvl
      host.notify({ kind: 'info', message: t('townLevelup')
        .replace('{level}', String(townLvl))
        .replace('{rank}', RANKS[townLvl][0]) })
    }
    prevGame.current = newGame
    if (deltas.length) {
      const ts = Date.now()
      setFloaters((prevF) => [...prevF.filter((f) => Date.now() - f.ts < 3000), ...deltas.map((d) => ({ name: d.name, delta: d.delta, ts }))])
      setTimeout(() => setFloaters((prevF) => prevF.filter((f) => Date.now() - f.ts < 2800)), 2800)
    }
    for (const lu of levelUps) {
      setCelebration({ name: lu.name, level: lu.level, ts: Date.now() })
      const bot = (data.bots || []).find((b) => b.name === lu.name)
      host.notify({ kind: 'info', message: t('levelup')
        .replace('{bot}', bot ? (bot.title || bot.name) : lu.name)
        .replace('{level}', String(lu.level))
        .replace('{rank}', RANKS[lu.level][0]) })
      setTimeout(() => setCelebration((c) => (c && c.name === lu.name ? null : c)), 5000)
    }
  }, [data, t])

  // Streak events pop up once per event (life used / lost / bought)
  useEffect(() => {
    const st = data && data.streak
    if (!st || !st.event || !st.event_ts) return
    const key = `${st.event}:${st.event_ts}`
    if (streakNotified.current.has(key)) return
    streakNotified.current.add(key)
    const msg = st.event === 'life_used' ? t('streakEventLifeUsed').replace('{extra}', st.event_extra || '')
      : st.event === 'streak_lost' ? t('streakEventLost')
      : st.event === 'life_bought' ? t('streakEventBought') : null
    if (msg) {
      host.notify({ kind: 'info', message: msg })
      setStreakBanner({ kind: st.event, ts: Date.now() })
      setTimeout(() => setStreakBanner((b) => (b && b.ts === streakBanner.ts ? null : b)), 8000)
    }
  }, [data, t])

  // Streak milestone coins (client-side; derived from the ledger streak)
  useEffect(() => {
    const st = data && data.streak
    if (!st || st.count === undefined) return
    const count = st.count || 0
    if (count < milestoneSeen) { setMilestoneSeen(0); ctx.storage.set('milestoneSeen', 0); return }
    const hits = []
    for (let m = Math.floor(milestoneSeen / 5) * 5 + 5; m <= count; m += 5) hits.push(m)
    if (!hits.length) return
    const coins = hits.reduce((a, m) => a + milestoneReward(m), 0)
    const total = milestoneCoins + coins
    setMilestoneCoins(total); ctx.storage.set('milestoneCoins', total)
    setMilestoneSeen(count); ctx.storage.set('milestoneSeen', count)
    const top = hits[hits.length - 1]
    setStreakBanner({ kind: 'milestone', streak: top, coins, ts: Date.now() })
    setTimeout(() => setStreakBanner((b) => (b && b.ts === streakBanner.ts ? null : b)), 8000)
  }, [data, milestoneSeen, milestoneCoins])

  const buyLife = () => {
    const st = (data && data.streak) || {}
    if (balance < LIFE_PRICE || st.lives >= (st.max_lives || 5)) return
    ctx.rest('/buy-life', { method: 'POST' }).then((r) => {
      if (r && r.ok) {
        setSpent(persist('spent', spent + LIFE_PRICE))
        haptic('tap')
        setStreakBanner({ kind: 'bought', ts: Date.now() })
        setTimeout(() => setStreakBanner((b) => (b && b.ts === streakBanner.ts ? null : b)), 8000)
      }
    }).catch(() => {})
  }

  const bots = (data && data.bots) || []
  const localBots = bots.map((b) => localizeBot(b, (data && data.game) || {}))
  const userXp = localBots.reduce((a, b) => a + b.xp.total_xp, 0)
  const userLevel = townLevelOf(userXp)
  const userRank = RANKS[userLevel]
  const nextXp = TOWN_LEVEL_XP[Math.min(userLevel, 9)]
  const prevXp = TOWN_LEVEL_XP[userLevel - 1]
  const user = {
    name: mayorName || ((data && data.user && data.user.name) || t('mayor')),
    xp: userXp,
    level: userLevel,
    rank: userRank[0],
    rankEmoji: userRank[1],
    progress: nextXp > prevXp ? Math.min(1, (userXp - prevXp) / (nextXp - prevXp)) : 0,
  }
  const balance = earnedPoints(localBots) - spent + milestoneCoins + ((data && data.coin_bank) || 0)
  const busyCount = bots.filter((b) => BUSY_STATES.has(b.state)).length
  const idleCount = bots.filter((b) => b.state === 'idle' || b.state === 'sleeping').length
  // Streak-at-risk banner lives INSIDE the plugin (no cron needed): show it
  // while the current streak is within 1h of expiring.
  const _st = (data && data.streak) || {}
  const _age = _st.last_activity_ts ? (Date.now() / 1000) - _st.last_activity_ts : null
  const streakAtRisk = _st.count > 0 && _age !== null && _age >= 23 * 3600 && _age < 24 * 3600
  const plotPos = (b, i) => plots[b.name] || defaultPlotPos(i)
  const night = hour < 7 || hour >= 20
  const shownDecos = decos.filter((d) => d.shown !== false)
  const noBackend = isError || (data && data.ok === false)

  return jsxs('div', {
    className: 'bv-root',
    children: [
      jsx('style', { children: STYLES }),
      jsxs('div', { className: 'bv-header', children: [
        jsx('div', { className: 'bv-town-name', title: t('settingsTitle'), onClick: () => setPanel('settings'), children: `🏘️ ${townName}` }),
        jsx(MayorCard, { user, t }),
        jsx('div', { className: 'bv-header-stats', children: `⚙️ ${busyCount} ${t('busy')} · 🙂 ${idleCount} ${t('idle')}` }),
        jsx('button', { className: 'bv-iconbtn', title: t('help'), onClick: () => setPanel('help'), children: '❓' }),
        jsx('button', { className: 'bv-iconbtn', title: t('store'), onClick: () => setPanel('store'), children: `🛒 ${balance}` }),
        jsx('button', { className: 'bv-iconbtn', title: t('streak'), onClick: () => setPanel('streak'), children: `🔥 ${((data && data.streak) || {}).count || 0}` }),
        jsx('button', { className: 'bv-iconbtn', title: t('settings'), onClick: () => setPanel('settings'), children: '⚙️' }),
        jsx('button', { className: 'bv-iconbtn', title: t('creditsTitle'), onClick: () => setPanel('credits'), children: '©️' }),
      ]}),
      jsxs('div', { className: 'bv-scene' + (night ? ' bv-night' : ''), children: [
        jsx('div', { className: 'bv-grass' }),
        jsx('div', { className: 'bv-grass-patch bv-gp1' }),
        jsx('div', { className: 'bv-grass-patch bv-gp2' }),
        jsx('div', { className: 'bv-grass-patch bv-gp3' }),
        jsx('div', { className: 'bv-path bv-path-1' }),
        jsx('div', { className: 'bv-path bv-path-2' }),
        jsx('div', { className: 'bv-pond' }),
        jsx('div', { className: 'bv-plaza' }),
        ...shownDecos.map((d) => jsx(Deco, {
          key: d.id,
          deco: d,
          t,
          onMove: (pos) => { setDecos(persist('decos', decos.map((x) => (x.id === d.id ? { ...x, ...pos } : x)))) },
          onClick: () => { setStoreTab('decos'); setPanel('store') },
        })),
        bots.length === 0
          ? (noBackend
            ? jsx('div', { className: 'bv-empty', children: `⚡ ${t('noBackend')}` })
            : jsx('div', { className: 'bv-empty', children: `🏚️ ${t('empty')}` }))
          : localBots.map((b, i) => jsx(BotPlot, {
              key: b.name,
              bot: b,
              t,
              pos: plotPos(b, i),
              onDrag: (pos) => { setPlots(persist('plots', { ...plots, [b.name]: pos })) },
              celebrating: !!celebration && celebration.name === b.name,
              hat: (hats.equipped || {})[b.name] ? HATS.find((h) => h.id === (hats.equipped || {})[b.name])?.emoji : null,
              pet: (data && data.pets && data.pets[b.name]) ? (PETS.find((p) => p.id === data.pets[b.name])?.emoji || null) : null,
            })),
        ...floaters.map((f) => {
          const bi = bots.findIndex((b) => b.name === f.name)
          const p = bi >= 0 ? plotPos(bots[bi], bi) : { x: 50, y: 30 }
          return jsx('div', { key: f.name + f.ts, className: 'bv-floater', style: { left: `${p.x}%`, top: `${p.y - 6}%` }, children: `+${f.delta} ${t('xp')}` })
        }),
        jsx(QuestBoard, { bots: localBots, t, open: questsOpen, onToggle: toggleQuests, pets: (data && data.pets) || {} }),
        jsx('div', { className: 'bv-moon', children: night ? '🌙' : '☀️' }),
      ]}),
      jsx('div', { className: 'bv-footer', children: t('credits') }),
      streakAtRisk ? jsx('div', { className: 'bv-streak-risk', onClick: () => setPanel('streak'), children: t('streakRiskBanner') }) : null,
      streakBanner ? jsx('div', { className: 'bv-streak-banner', children: streakBanner.kind === 'bought' ? t('streakEventBought') : streakBanner.kind === 'milestone' ? t('streakMilestone').replace('{streak}', String(streakBanner.streak)).replace('{coins}', String(streakBanner.coins)) : streakBanner.kind === 'life_used' ? t('streakEventLifeUsed').replace('{extra}', ((data && data.streak) || {}).event_extra || '') : t('streakEventLost') }) : null,
      panel === 'help' ? jsx(HelpPanel, { t, onClose: () => setPanel(null) }) : null,
      panel === 'streak' ? jsx(StreakPanel, { t, streak: (data && data.streak) || {}, balance, onBuyLife: buyLife, onClose: () => setPanel(null) }) : null,
      panel === 'settings' ? jsx(SettingsPanel, {
        ctx, t, lang, setLang, townName, setTownName, mayorName, setMayorName,
        onResetPlots: () => { ctx.storage.remove('plots'); setPlots({}) },
        onResetTown: resetTown,
        onClose: () => setPanel(null),
      }) : null,
      panel === 'store' ? jsx(StorePanel, {
        ctx, t, bots: localBots, user, hats, setHats, spent, setSpent, decos, setDecos,
        openTab: storeTab,
        balance,
        pets: (data && data.pets) || {},
        onClose: () => setPanel(null),
      }) : null,
      panel === 'credits' ? jsx(CreditsPanel, { t, onClose: () => setPanel(null) }) : null,
    ],
  })
}

/* ------------------------------------------------------------------ *
 * Status-bar chip
 * ------------------------------------------------------------------ */

function StatusChip({ ctx }) {
  const { data } = useQuery({
    queryKey: ['bot-horizon', 'chip'],
    queryFn: () => ctx.rest('/state?avatars=0'),
    refetchInterval: 15000,
  })
  const bots = (data && data.bots) || []
  const busy = bots.filter((b) => BUSY_STATES.has(b.state)).length
  const total = bots.length
  return jsx('button', {
    type: 'button',
    className: 'px-2 text-[0.6875rem] text-(--ui-text-tertiary) hover:text-(--ui-text-secondary)',
    onClick: () => { haptic('tap'); host.navigate('/bot-horizon') },
    title: 'Bot Horizon — open the town',
    children: `🏘️ ${busy > 0 ? `${busy} busy · ` : ''}${total} bots`,
  })
}

/* ------------------------------------------------------------------ *
 * Scene CSS — LIGHT UI (white surfaces, dark text) + colorful scene
 * ------------------------------------------------------------------ */

const STYLES = `
.bv-root{position:relative;display:flex;flex-direction:column;height:100%;font-size:13px;overflow:hidden;color:#2b3a24;background:#fbfaf4}
.bv-header{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #d5d8c9;flex:0 0 auto;flex-wrap:wrap;background:#fbfaf4}
.bv-town-name{cursor:pointer;font-weight:700;font-size:15px;color:#2b3a24;white-space:nowrap}
.bv-header-stats{color:#84907b;white-space:nowrap;font-size:12px;margin-left:4px}
.bv-mayor{display:flex;align-items:center;gap:8px;margin-left:auto;background:#fff;border:1px solid #d5d8c9;border-radius:10px;padding:4px 10px}
.bv-mayor-crown{font-size:16px}
.bv-mayor-title{display:flex;gap:8px;align-items:center;font-size:12px;color:#5a6b52}
.bv-mayor-rank{color:#e8890c;font-weight:700}
.bv-progress{width:110px;height:5px;border-radius:3px;background:#e8e8dd;overflow:hidden;margin-top:3px}
.bv-progress-fill{height:100%;background:#e8890c;border-radius:3px;transition:width .5s}
.bv-mayor-xp{font-size:10px;color:#84907b;margin-top:2px}
.bv-streak-hero{display:flex;align-items:center;gap:12px;padding:12px 0 6px}
.bv-streak-fire{font-size:40px}
.bv-streak-count{font-size:34px;font-weight:800;color:#e8890c;line-height:1}
.bv-streak-label{font-size:12px;color:#5a6b52}
.bv-streak-lives{display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:8px;padding:8px 0}
.bv-btn-disabled{opacity:.5;cursor:not-allowed}
.bv-streak-banner{position:absolute;top:12px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #e8890c;color:#2b3a24;border-radius:12px;padding:10px 16px;z-index:30;box-shadow:0 6px 20px rgba(0,0,0,.18);animation:bv-pop .3s ease-out;max-width:80%;text-align:center}
.bv-streak-risk{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);background:#ffe0b2;border:1px solid #f0a04c;color:#8a4b00;padding:8px 16px;border-radius:10px;font-size:12px;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.15);cursor:pointer;animation:bv-pulse 1.6s infinite}
@keyframes bv-pulse{0%,100%{opacity:1}50%{opacity:.65}}
.bv-iconbtn{background:#fff;border:1px solid #d5d8c9;border-radius:8px;padding:3px 8px;font-size:12px;color:#5a6b52;cursor:pointer;white-space:nowrap}
.bv-iconbtn:hover{color:#2b3a24;border-color:#e8890c}
.bv-scene{position:relative;flex:1;overflow:hidden;background:#7cbb5e}
.bv-grass{position:absolute;inset:0;background:
  radial-gradient(ellipse at 20% 30%, #8ccb6c 0%, transparent 60%),
  radial-gradient(ellipse at 80% 70%, #84c264 0%, transparent 55%),
  linear-gradient(180deg,#8ac968 0%,#75b258 100%)}
.bv-grass-patch{position:absolute;border-radius:50%;background:rgba(70,140,60,.18)}
.bv-gp1{width:180px;height:120px;left:12%;top:18%}
.bv-gp2{width:240px;height:160px;right:8%;top:55%}
.bv-gp3{width:150px;height:100px;left:55%;top:8%}
.bv-path{position:absolute;background:#d9b878;border-radius:24px;box-shadow:inset 0 0 0 3px rgba(160,120,60,.25)}
.bv-path-1{width:34%;height:16px;left:6%;top:30%;transform:rotate(-8deg)}
.bv-path-2{width:26%;height:14px;right:4%;top:62%;transform:rotate(12deg)}
.bv-pond{position:absolute;right:3%;top:16%;width:120px;height:84px;border-radius:50% 55% 60% 45%;background:radial-gradient(circle at 35% 30%, #aee3f5, #6db8d8 70%);box-shadow:inset 0 4px 10px rgba(255,255,255,.35), 0 4px 10px rgba(0,0,0,.12)}
.bv-plaza{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);width:150px;height:70px;border-radius:50%;background:rgba(214,178,120,.5);border:3px dashed rgba(180,140,80,.35)}
.bv-deco{position:absolute;font-size:26px;filter:drop-shadow(0 3px 3px rgba(0,0,0,.2));z-index:12;cursor:grab;touch-action:none;user-select:none;animation:bv-pop .35s ease-out}
.bv-deco:active{cursor:grabbing}
@keyframes bv-pop{0%{transform:scale(.2)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
.bv-moon{position:absolute;top:10px;left:14px;font-size:20px;z-index:1}
.bv-night .bv-grass{filter:brightness(.62) saturate(.85)}
.bv-night .bv-pond{filter:brightness(.8)}
.bv-empty{position:absolute;top:40%;left:50%;transform:translateX(-50%);color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.45);font-size:14px;z-index:6;text-align:center;max-width:80%}
.bv-plot{position:absolute;width:150px;height:150px;cursor:grab;touch-action:none;user-select:none}
.bv-plot:active{cursor:grabbing}
.bv-plot:hover{z-index:10}
.bv-offline-plot .bv-avatar-wrap{opacity:.55;filter:grayscale(.85)}
.bv-house{position:absolute;left:22px;top:8px;width:86px;height:74px;border-radius:14px;background:var(--roof,#c9b37c);box-shadow:0 6px 0 rgba(0,0,0,.18), inset 0 -6px 0 rgba(0,0,0,.08);z-index:1}
.bv-h-ridge{position:absolute;left:50%;top:0;bottom:0;width:10px;transform:translateX(-50%);background:rgba(0,0,0,.14);border-radius:4px}
.bv-h-window{position:absolute;top:14px;width:14px;height:14px;border-radius:4px;background:#f7e7b4;border:2px solid rgba(0,0,0,.18)}
.bv-h-w1{left:14px}
.bv-h-w2{right:14px}
.bv-h-door{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:20px;height:14px;border-radius:4px 4px 0 0;background:#8a5a3b;border:2px solid rgba(0,0,0,.18);z-index:2}
.bv-h-flag{position:absolute;top:-14px;right:-6px;font-size:15px}
.bv-h-lv{position:absolute;top:-11px;left:2px;font-size:8px;font-weight:800;color:#fff;background:#5a6b52;border-radius:6px;padding:1px 4px;letter-spacing:.3px;z-index:2}
.bv-h-star{position:absolute;top:-10px;left:-8px;font-size:14px}
.bv-house-t1{width:76px;height:64px;border-radius:50% 50% 14px 14px}
.bv-house-t2{width:82px;height:70px}
.bv-house-t3{width:88px;height:76px}
.bv-house-t4{width:94px;height:84px}
.bv-house-t5{width:98px;height:92px;border-radius:18px;box-shadow:0 8px 0 rgba(0,0,0,.2), inset 0 -8px 0 rgba(0,0,0,.1)}
.bv-bench{position:absolute;right:4px;top:26px;width:26px;height:18px;border-radius:4px;background:#a47551;box-shadow:0 3px 0 rgba(0,0,0,.15);z-index:3}
.bv-bench::after{content:'🛠️';position:absolute;top:-12px;left:50%;transform:translateX(-50%);font-size:12px}
.bv-flag{position:absolute;right:-2px;top:2px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:13px;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:6px;z-index:4}
.bv-sprite{position:absolute;left:50%;top:96px;transform:translateX(-50%);transition:left .9s cubic-bezier(.4,0,.2,1), top .9s cubic-bezier(.4,0,.2,1);z-index:3;cursor:pointer}
.bv-sprite.bv-target-bench{left:76%;top:88px}
.bv-sprite.bv-target-flag{left:80%;top:52px}
.bv-sprite.bv-wander{animation:bv-wander 7s ease-in-out infinite}
@keyframes bv-wander{0%,100%{transform:translateX(-50%) translate(0,0)}25%{transform:translateX(-50%) translate(-10px,3px)}50%{transform:translateX(-50%) translate(6px,-2px)}75%{transform:translateX(-50%) translate(-4px,4px)}}
.bv-shadow{position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:30px;height:8px;border-radius:50%;background:rgba(0,0,0,.22)}
.bv-avatar-wrap{position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);border:2px solid #d5d8c9}
.bv-avatar-img{width:40px;height:40px;border-radius:50%;object-fit:cover}
.bv-hat{position:absolute;top:-13px;left:50%;transform:translateX(-50%);font-size:17px;z-index:4;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}
.bv-pet{position:absolute;bottom:-8px;left:-14px;font-size:20px;z-index:5;filter:drop-shadow(0 2px 2px rgba(0,0,0,.3));animation:bv-hop 1.6s ease-in-out infinite;pointer-events:none}
@keyframes bv-hop{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}
.bv-eyes{animation:bv-blink 4.5s infinite}
@keyframes bv-blink{0%,92%,100%{opacity:1}95%{opacity:0}}
.bv-chip{position:absolute;right:-8px;bottom:-6px;background:#fff;border:1px solid #d5d8c9;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:5}
.bv-chip-off{filter:grayscale(1)}
.bv-pulse{animation:bv-pulse 1.2s ease-in-out infinite}
@keyframes bv-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
.bv-bubble{position:absolute;top:-22px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #d5d8c9;border-radius:10px;padding:3px 8px;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.15);z-index:6;white-space:nowrap}
.bv-bubble-dots{letter-spacing:1px;color:#5a6b52}
.bv-zzz{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:16px;animation:bv-float 2.4s ease-in-out infinite;z-index:5}
@keyframes bv-float{0%,100%{transform:translateY(0);opacity:.9}50%{transform:translateY(-5px);opacity:1}}
.bv-sparkles{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:16px;animation:bv-sparkle .9s ease-in-out infinite;z-index:7}
@keyframes bv-sparkle{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(1.4);opacity:.7}}
.bv-plot-label{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);display:flex;gap:5px;align-items:center;font-size:11px;max-width:140px;background:rgba(255,255,255,.92);border-radius:8px;padding:1px 6px;white-space:nowrap;z-index:4}
.bv-plot-name{color:#2b3a24;font-weight:700;overflow:hidden;text-overflow:ellipsis}
.bv-plot-rank{background:#fff;border:1px solid #d5d8c9;border-radius:8px;padding:0 5px;font-size:10px;color:#5a6b52}
.bv-plot-state{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);white-space:nowrap;z-index:4}
.bv-floater{position:absolute;font-size:13px;font-weight:800;color:#ffe066;text-shadow:0 1px 3px rgba(0,0,0,.6);animation:bv-rise 2.6s ease-out forwards;pointer-events:none;z-index:30}
@keyframes bv-rise{0%{transform:translateY(0);opacity:0}12%{opacity:1}100%{transform:translateY(-46px);opacity:0}}
.bv-tooltip{position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);width:230px;background:#fff;border:1px solid #d5d8c9;border-radius:10px;padding:8px 10px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:40;pointer-events:none}
.bv-tt-name{font-weight:700;color:#2b3a24;font-size:12px}
.bv-tt-desc{color:#84907b;font-size:10px;margin:2px 0 5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bv-tt-row{display:flex;justify-content:space-between;gap:8px;color:#5a6b52;font-size:10px;margin-top:3px}
.bv-tt-badges{display:flex;gap:3px;margin-top:5px;font-size:12px}
.bv-tt-open{margin-top:6px;color:#e8890c;font-size:10px}
.bv-quests{position:absolute;top:12px;right:12px;z-index:20;background:#fff;border:1px solid #d5d8c9;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);width:248px;max-height:44%;display:flex;flex-direction:column}
.bv-quests-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;font-size:12px;color:#2b3a24;padding:6px 8px 6px 10px;border-bottom:1px solid #d5d8c9}
.bv-quests-title-text{flex:1}
.bv-btn-tiny{padding:1px 7px;font-size:10px}
.bv-quests-mini{position:absolute;top:12px;right:12px;z-index:20}
.bv-quests-toggle{background:#fff;border:1px solid #d5d8c9;border-radius:10px;padding:5px 10px;font-size:12px;font-weight:700;color:#2b3a24;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.bv-quests-toggle:hover{border-color:#e8890c}
.bv-quests-list{overflow-y:auto;padding:6px 8px;display:flex;flex-direction:column;gap:5px}
.bv-quest{display:flex;gap:7px;align-items:flex-start;border-radius:8px;padding:5px 6px;background:#fbfaf4;border:1px solid #d5d8c9}
.bv-quest-emoji{font-size:13px}
.bv-quest-name{font-size:11px;color:#2b3a24;line-height:1.25}
.bv-quest-meta{font-size:9px;color:#84907b;margin-top:2px}
.bv-quests-empty{padding-bottom:8px}
.bv-quests-sub{padding:8px 10px;color:#84907b;font-size:11px}
.bv-quests-pets{border-top:1px dashed #d5d8c9;margin-top:6px;padding-top:4px}
.bv-quest-pet{background:#fdf6e3}
.bv-footer{flex:0 0 auto;padding:4px 14px;font-size:10px;color:#84907b;border-top:1px solid #d5d8c9;text-align:center;background:#fbfaf4}
.bv-overlay{position:absolute;inset:0;background:rgba(20,32,16,.55);display:flex;align-items:center;justify-content:center;z-index:50}
.bv-popover{background:#fff;border:1px solid #d5d8c9;border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.35);width:360px;max-height:82%;overflow-y:auto;padding:12px}
.bv-help{width:780px;max-width:95vw}
.bv-help-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px 18px;max-height:64vh;overflow:auto;padding-right:4px}
.bv-help-col{min-width:0}
.bv-pop-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.bv-pop-title{font-weight:700;color:#2b3a24;font-size:13px;flex:1}
.bv-balance{color:#e8890c;font-weight:700;font-size:12px}
.bv-btn{background:#e8890c;color:#fff;border:none;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer}
.bv-btn:disabled{opacity:.4;cursor:default}
.bv-btn-ghost{background:#fff;color:#5a6b52;border:1px solid #d5d8c9}
.bv-btn-danger{background:#d64545;color:#fff}
.bv-btn-block{width:100%;margin-top:8px}
.bv-tabs{display:flex;gap:6px;margin-bottom:8px}
.bv-tab{flex:1;padding:5px;border-radius:8px;border:1px solid #d5d8c9;background:#fff;color:#5a6b52;font-size:11px;cursor:pointer}
.bv-tab-on{background:#e8890c;color:#fff;border-color:#e8890c}
.bv-store-body{display:flex;flex-direction:column;gap:6px}
.bv-store-hint{font-size:10px;color:#84907b;margin-bottom:2px}
.bv-select{background:#fff;border:1px solid #d5d8c9;border-radius:8px;color:#2b3a24;font-size:11px;padding:3px 6px;max-width:130px}
.bv-store-item{display:flex;align-items:center;gap:8px;border:1px solid #d5d8c9;border-radius:10px;padding:6px 8px;background:#fbfaf4}
.bv-store-emoji{font-size:20px;width:30px;text-align:center}
.bv-store-info{flex:1;min-width:0}
.bv-store-name{font-size:11px;color:#2b3a24;text-transform:capitalize;font-weight:700}
.bv-store-price{font-size:10px;color:#84907b}
.bv-store-actions{display:flex;gap:5px;align-items:center}
.bv-owned{color:#e8890c;font-weight:800}
.bv-deco-item{flex-wrap:wrap}
.bv-deco-config{width:100%;margin-top:4px;display:flex;flex-direction:column;gap:4px}
.bv-slider-row{display:flex;align-items:center;gap:6px;font-size:10px;color:#5a6b52}
.bv-slider-row input{flex:1}
.bv-slider-val{width:38px;text-align:right;color:#84907b}
.bv-deco-actions{display:flex;gap:6px;margin-top:2px}
.bv-help-title{font-weight:700;color:#2b3a24;font-size:12px;margin:10px 0 4px}
.bv-help-sub{font-weight:700;color:#5a6b52;font-size:11px;margin:10px 0 2px}
.bv-help-list{display:flex;flex-direction:column;gap:3px}
.bv-help-row{display:flex;justify-content:space-between;font-size:11px;color:#5a6b52;padding:3px 6px;border-radius:6px;background:#fbfaf4}
.bv-help-hint{font-size:10px;color:#84907b;margin-bottom:6px}
.bv-help-note{margin-top:10px;font-size:10px;color:#84907b}
.bv-demos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.bv-demo{border:1px solid #d5d8c9;border-radius:10px;padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;background:#fbfaf4}
.bv-demo-scene{position:relative;width:44px;height:44px;display:flex;align-items:flex-end;justify-content:center}
.bv-demo-avatar{position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#e8f0e0;border:2px solid rgba(0,0,0,.12)}
.bv-demo-face{width:28px;height:28px;border-radius:50%;background:#e8890c;opacity:.85}
.bv-demo-label{font-size:9px;color:#5a6b52;text-align:center}
.bv-settings-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.bv-settings-label{font-size:11px;color:#5a6b52;min-width:70px}
.bv-name-input{background:#fff;border:1px solid #d5d8c9;border-radius:8px;color:#2b3a24;padding:3px 8px;font-size:12px;flex:1}
.bv-confirm{border:1px solid #d64545;border-radius:10px;padding:8px;margin-top:8px;background:#fdf2f0}
.bv-confirm-text{font-size:11px;color:#2b3a24;margin-bottom:6px}
.bv-confirm-actions{display:flex;gap:6px;justify-content:flex-end}
.bv-credits-hero{font-size:26px;text-align:center;margin:6px 0}
.bv-credits-line{font-size:11px;color:#5a6b52;text-align:center;margin-bottom:10px}
.bv-credits-links{display:flex;flex-direction:column;gap:6px}
.bv-credits-link{display:block;padding:7px 10px;border:1px solid #d5d8c9;border-radius:10px;color:#2b3a24;text-decoration:none;font-size:12px;text-align:center;background:#fff}
.bv-donate{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:14px}
.bv-donate-btn{display:inline-block;padding:9px 16px;background:#ffdd00;color:#1a1a1a;border:none;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none}
.bv-credits-link:hover{border-color:#e8890c;color:#e8890c}
`

/* ------------------------------------------------------------------ *
 * Plugin registration
 * ------------------------------------------------------------------ */

export default {
  id: 'bot-horizon',
  name: 'Bot Horizon',
  register(ctx) {
    const initialName = ctx.storage.get('townName') || 'Bot Horizon'
    ensureNav(ctx, initialName)

    ctx.register({
      id: 'page',
      area: ROUTES_AREA,
      data: { path: '/bot-horizon' },
      render: () => jsx(BotHorizonPage, { ctx }),
    })

    ctx.register({
      id: 'open',
      area: PALETTE_AREA,
      data: {
        id: 'bot-horizon.open',
        label: 'Bot Horizon — open the town',
        keywords: ['bot-horizon', 'bot horizon', 'town', 'bots', 'pueblo', 'botville', 'bot-ville'],
        run: () => host.navigate('/bot-horizon'),
      },
    })

    ctx.register({
      id: 'chip',
      area: STATUSBAR_AREAS.right,
      order: 150,
      render: () => jsx(StatusChip, { ctx }),
    })
  },
}
