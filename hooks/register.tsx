// « Ce que fait Claude » : un panneau qui observe seulement.
// Aucun hook ne bloque, ne réécrit, n'envoie ni ne supprime quoi que ce soit :
// chaque tool.call passe `e` tel quel à next(e) et rend son résultat intact.
import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Action, Humeur } from '../types'

const PANE = 'robot-activite'
const TITRE = 'Ce que fait Claude'

const humeur = atom({ plugin: 'robot-activite', key: 'humeur' } as const, 'dort' as Humeur, {
  shape: 'humeur-1',
})
const actions = atom({ plugin: 'robot-activite', key: 'actions' } as const, [] as Action[], {
  shape: 'actions-1',
})

// ───────────────────────── Le robot, en formes vectorielles ─────────────────────────
// Une seule géométrie (viewBox 64×64) sert à la fois au SVG animé (bureau, VS Code,
// mobile) et aux pixels du terminal, qui n'a pas d'élément Svg.

type Forme =
  | { k: 'rect'; x: number; y: number; w: number; h: number; r?: number; c: string }
  | { k: 'cercle'; x: number; y: number; r: number; c: string }
  | { k: 'ellipse'; x: number; y: number; rx: number; ry: number; c: string }
  | { k: 'trait'; x1: number; y1: number; x2: number; y2: number; l: number; c: string }
  | { k: 'poly'; p: [number, number][]; c: string }

const ORANGE = '#E8762B'
const ORANGE_FONCE = '#B5531A'
const ECRAN = '#3A2A20'
const OEIL = '#FFE7CF'
const CLAIR = '#FFD9B8'
const GRIS = '#4A4A4A'
const VERRE = '#9FD3F0'
const PAPIER = '#FAF7F0'
const CRAYON = '#F5C542'
const BLEU_Z = '#8FA3FF'
const OMBRE = '#00000033'
const NB_IMAGES = 8

const trait = (x1: number, y1: number, x2: number, y2: number, l: number, c: string): Forme => ({
  k: 'trait', x1, y1, x2, y2, l, c,
})
const cercle = (x: number, y: number, r: number, c: string): Forme => ({ k: 'cercle', x, y, r, c })
const rect = (x: number, y: number, w: number, h: number, c: string, r = 0): Forme => ({
  k: 'rect', x, y, w, h, r, c,
})

function decaler(formes: Forme[], dx: number, dy: number): Forme[] {
  return formes.map(f => {
    switch (f.k) {
      case 'rect': return { ...f, x: f.x + dx, y: f.y + dy }
      case 'cercle': return { ...f, x: f.x + dx, y: f.y + dy }
      case 'ellipse': return { ...f, x: f.x + dx, y: f.y + dy }
      case 'trait': return { ...f, x1: f.x1 + dx, y1: f.y1 + dy, x2: f.x2 + dx, y2: f.y2 + dy }
      case 'poly': return { ...f, p: f.p.map(([x, y]) => [x + dx, y + dy] as [number, number]) }
    }
  })
}

function lettreZ(x: number, y: number, s: number): Forme[] {
  return [
    trait(x, y, x + s, y, 2, BLEU_Z),
    trait(x + s, y, x, y + s, 2, BLEU_Z),
    trait(x, y + s, x + s, y + s, 2, BLEU_Z),
  ]
}

function tete(yeux: Forme[], antenne = ORANGE): Forme[] {
  return [
    trait(32, 6, 32, 13, 2, ORANGE_FONCE),
    cercle(32, 5, 3, antenne),
    rect(14, 12, 36, 22, ORANGE, 6),
    rect(18, 16, 28, 14, ECRAN, 4),
    ...yeux,
  ]
}

function corps(): Forme[] {
  return [
    rect(28, 33, 8, 5, ORANGE_FONCE),
    rect(16, 37, 32, 18, ORANGE, 5),
    cercle(32, 46, 4, CLAIR),
    rect(21, 55, 7, 6, ORANGE_FONCE, 2),
    rect(36, 55, 7, 6, ORANGE_FONCE, 2),
  ]
}

function bras(x1: number, y1: number, x2: number, y2: number): Forme[] {
  return [trait(x1, y1, x2, y2, 4, ORANGE_FONCE), cercle(x2, y2, 3, ORANGE)]
}

const ombre = (largeur: number): Forme => ({ k: 'ellipse', x: 32, y: 62, rx: largeur, ry: 1.6, c: OMBRE })

const yeuxOuverts = (dx = 0, dy = 0) => [cercle(26 + dx, 23 + dy, 3.5, OEIL), cercle(38 + dx, 23 + dy, 3.5, OEIL)]

function image(h: Humeur, t: number): Forme[] {
  switch (h) {
    case 'dort': {
      const souffle = t % 4 < 2 ? 0 : 1
      const yeux = [rect(22, 23, 8, 2, OEIL, 1), rect(34, 23, 8, 2, OEIL, 1)]
      const zs: Forme[] = []
      for (let i = 0; i < 3; i++) {
        const phase = (t + i * 3) % NB_IMAGES
        if (phase > 5) continue
        const taille = 4 + phase * 0.7
        zs.push(...lettreZ(50 + phase * 0.8, 16 - phase * 2.4, taille))
      }
      return [
        ombre(14),
        ...decaler([...corps(), ...bras(16, 41, 13, 52), ...bras(48, 41, 51, 52), ...tete(yeux, ORANGE_FONCE)], 0, souffle),
        ...zs,
      ]
    }
    case 'lit': {
      const balayage = [-6, -4, -2, 0, 2, 4, 2, -2][t] ?? 0
      const lx = 40 + balayage
      return [
        ombre(14),
        ...corps(),
        ...tete(yeuxOuverts(balayage > 0 ? 1 : -1, 1)),
        // un livre dans la main gauche
        ...bras(16, 41, 11, 46),
        rect(4, 38, 12, 15, PAPIER, 1),
        trait(6, 42, 14, 42, 1, GRIS),
        trait(6, 45, 14, 45, 1, GRIS),
        trait(6, 48, 12, 48, 1, GRIS),
        // la loupe dans la main droite
        trait(lx + 5, 31, lx + 11, 38, 3, GRIS),
        ...bras(48, 41, lx + 11, 38),
        cercle(lx, 26, 7.5, GRIS),
        cercle(lx, 26, 5.5, VERRE),
        cercle(lx - 2, 24, 1.5, '#FFFFFF'),
      ]
    }
    case 'ecrit': {
      const px = 22 + (t % 4) * 5
      const py = 54 + (t >= 4 ? 3 : 0)
      const lignes: Forme[] = []
      for (let i = 0; i < t; i++) {
        const lx = 22 + (i % 4) * 5
        const ly = 54 + (i >= 4 ? 3 : 0)
        lignes.push(trait(lx - 1, ly, lx + 3, ly - 0.5, 1, GRIS))
      }
      return [
        ombre(14),
        ...corps(),
        ...tete(yeuxOuverts(0, 2)),
        ...bras(16, 41, 19, 52),
        rect(17, 49, 30, 13, PAPIER, 1),
        ...lignes,
        ...bras(48, 41, px + 9, py - 12),
        trait(px, py, px + 11, py - 15, 4, CRAYON),
        trait(px + 10, py - 13.5, px + 12, py - 16.5, 4, '#E88A9A'),
        trait(px, py, px + 2.2, py - 3, 2.4, GRIS),
      ]
    }
    case 'cherche': {
      const tourne = [-3, -2, 0, 2, 3, 2, 0, -2][t] ?? 0
      const jumelles: Forme[] = [
        rect(28, 20, 8, 5, GRIS),
        cercle(26, 23, 6.5, GRIS),
        cercle(38, 23, 6.5, GRIS),
        cercle(26, 23, 4, '#6BA4D8'),
        cercle(38, 23, 4, '#6BA4D8'),
        cercle(24.5, 21.5, 1.2, '#FFFFFF'),
        cercle(36.5, 21.5, 1.2, '#FFFFFF'),
      ]
      return [
        ombre(14),
        ...corps(),
        ...decaler([...tete([]), ...jumelles], tourne, 0),
        ...bras(16, 41, 20 + tourne, 29),
        ...bras(48, 41, 44 + tourne, 29),
      ]
    }
    case 'joie': {
      const saut = [0, -3, -6, -8, -6, -3, 0, 0][t] ?? 0
      const yeux: Forme[] = [
        trait(22, 25, 26, 21, 2, OEIL), trait(26, 21, 30, 25, 2, OEIL),
        trait(34, 25, 38, 21, 2, OEIL), trait(38, 21, 42, 25, 2, OEIL),
        { k: 'poly', p: [[28, 27], [36, 27], [32, 30]], c: OEIL },
      ]
      const couleurs = ['#FF5D73', '#FFC93C', '#4CC38A', '#5B8DEF', '#B36BFF']
      const confettis: Forme[] = []
      for (let i = 0; i < 7; i++) {
        const x = [2, 9, 54, 60, 5, 57, 11][i] ?? 2
        const y = (i * 11 + t * 4) % 36
        confettis.push(rect(x, y, 2.2, 2.2, couleurs[i % couleurs.length] ?? '#FFC93C'))
      }
      return [
        ombre(14 + saut),
        ...decaler(
          [...corps(), ...bras(16, 41, 7, 30), ...bras(48, 41, 57, 30), ...tete(yeux, CRAYON)],
          0,
          saut,
        ),
        ...confettis,
      ]
    }
  }
}

// ─── En SVG : les 8 images empilées, chacune visible à son tour (animation SMIL) ───

function formeSvg(f: Forme): string {
  const couleur = (c: string) =>
    c.length === 9 ? `"${c.slice(0, 7)}" fill-opacity="${(parseInt(c.slice(7), 16) / 255).toFixed(2)}"` : `"${c}"`
  switch (f.k) {
    case 'rect': return `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.r ?? 0}" fill=${couleur(f.c)}/>`
    case 'cercle': return `<circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill=${couleur(f.c)}/>`
    case 'ellipse': return `<ellipse cx="${f.x}" cy="${f.y}" rx="${f.rx}" ry="${f.ry}" fill=${couleur(f.c)}/>`
    case 'trait': return `<line x1="${f.x1}" y1="${f.y1}" x2="${f.x2}" y2="${f.y2}" stroke="${f.c}" stroke-width="${f.l}" stroke-linecap="round"/>`
    case 'poly': return `<polygon points="${f.p.map(p => p.join(',')).join(' ')}" fill=${couleur(f.c)}/>`
  }
}

const cacheSvg = new Map<Humeur, string>()
function robotSvg(h: Humeur): string {
  const deja = cacheSvg.get(h)
  if (deja) return deja
  const temps = Array.from({ length: NB_IMAGES }, (_, i) => (i / NB_IMAGES).toFixed(3)).join(';')
  const groupes = Array.from({ length: NB_IMAGES }, (_, i) => {
    const valeurs = Array.from({ length: NB_IMAGES }, (_, j) => (i === j ? 1 : 0)).join(';')
    return `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" values="${valeurs}" keyTimes="${temps}" calcMode="discrete" dur="2s" repeatCount="indefinite"/>${image(h, i).map(formeSvg).join('')}</g>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="160" height="160">${groupes}</svg>`
  cacheSvg.set(h, svg)
  return svg
}

// ─── Dans le terminal : la même géométrie échantillonnée en pixels (demi-cases) ───

const COLS = 32
const LIGNES = 16 // 32 pixels de haut, deux par case
const PAR_DEFAUT = 0x01000000

function couleurPixel(c: string): number | undefined {
  if (c.length === 9) return undefined // ombre translucide : ignorée en pixels
  return parseInt(c.slice(1, 7), 16)
}

function dedans(f: Forme, x: number, y: number): boolean {
  switch (f.k) {
    case 'rect': {
      if (x < f.x || x > f.x + f.w || y < f.y || y > f.y + f.h) return false
      const r = Math.min(f.r ?? 0, f.w / 2, f.h / 2)
      if (r <= 0) return true
      const cx = Math.min(Math.max(x, f.x + r), f.x + f.w - r)
      const cy = Math.min(Math.max(y, f.y + r), f.y + f.h - r)
      return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    }
    case 'cercle': return (x - f.x) ** 2 + (y - f.y) ** 2 <= f.r * f.r
    case 'ellipse': return ((x - f.x) / f.rx) ** 2 + ((y - f.y) / f.ry) ** 2 <= 1
    case 'trait': {
      const dx = f.x2 - f.x1
      const dy = f.y2 - f.y1
      const n = dx * dx + dy * dy
      const k = n === 0 ? 0 : Math.max(0, Math.min(1, ((x - f.x1) * dx + (y - f.y1) * dy) / n))
      const ex = f.x1 + k * dx - x
      const ey = f.y1 + k * dy - y
      return ex * ex + ey * ey <= (Math.max(f.l, 2) / 2) ** 2
    }
    case 'poly': {
      let interieur = false
      for (let i = 0, j = f.p.length - 1; i < f.p.length; j = i++) {
        const [xi, yi] = f.p[i] ?? [0, 0]
        const [xj, yj] = f.p[j] ?? [0, 0]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) interieur = !interieur
      }
      return interieur
    }
  }
}

function pixel(formes: Forme[], px: number, py: number): number {
  const x = (px + 0.5) * (64 / COLS)
  const y = (py + 0.5) * (64 / (LIGNES * 2))
  for (let i = formes.length - 1; i >= 0; i--) {
    const f = formes[i]
    if (!f) continue
    const c = couleurPixel(f.c)
    if (c !== undefined && dedans(f, x, y)) return c
  }
  return PAR_DEFAUT
}

const cacheCases = new Map<string, string>()
function robotCases(h: Humeur, t: number): string {
  const cle = `${h}:${t}`
  const deja = cacheCases.get(cle)
  if (deja) return deja
  const formes = image(h, t)
  const mots = new Uint32Array(COLS * LIGNES * 3)
  for (let row = 0; row < LIGNES; row++) {
    for (let col = 0; col < COLS; col++) {
      const haut = pixel(formes, col, row * 2)
      const bas = pixel(formes, col, row * 2 + 1)
      const i = (row * COLS + col) * 3
      if (haut === PAR_DEFAUT && bas === PAR_DEFAUT) {
        mots.set([0x20, PAR_DEFAUT, PAR_DEFAUT], i)
      } else if (haut === PAR_DEFAUT) {
        mots.set([0x2584, bas, PAR_DEFAUT], i) // ▄ : moitié basse colorée
      } else {
        mots.set([0x2580, haut, bas], i) // ▀ : moitié haute, fond = moitié basse
      }
    }
  }
  const cases = (new Uint8Array(mots.buffer) as Uint8Array & { toBase64: () => string }).toBase64()
  cacheCases.set(cle, cases)
  return cases
}

// ───────────────────────── Les actions, en français simple ─────────────────────────

function nomLisible(chemin: unknown): string {
  if (typeof chemin !== 'string' || chemin === '') return 'un fichier'
  const nom = chemin.split('/').filter(Boolean).pop() ?? chemin
  return `« ${nom} »`
}

function court(texte: unknown, max = 40): string {
  const s = typeof texte === 'string' ? texte.trim().replace(/\s+/g, ' ') : ''
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function domaine(url: unknown): string {
  try {
    return new URL(String(url)).hostname
  } catch {
    return 'une page web'
  }
}

type Decrit = { icone: string; texte: string; humeur?: Humeur }

function decrire(outil: string, e: Record<string, unknown>): Decrit {
  switch (outil) {
    case 'Read':
      return { icone: '📖', texte: `Je lis ${nomLisible(e.file_path)}`, humeur: 'lit' }
    case 'Write':
      return { icone: '✏️', texte: `Je crée ${nomLisible(e.file_path)}`, humeur: 'ecrit' }
    case 'Edit':
    case 'MultiEdit':
      return { icone: '✏️', texte: `Je modifie ${nomLisible(e.file_path)}`, humeur: 'ecrit' }
    case 'NotebookEdit':
      return { icone: '✏️', texte: `Je modifie le carnet ${nomLisible(e.notebook_path)}`, humeur: 'ecrit' }
    case 'Grep':
      return { icone: '🔭', texte: `Je cherche « ${court(e.pattern, 30)} » dans les fichiers`, humeur: 'cherche' }
    case 'Glob':
      return { icone: '🔭', texte: `Je cherche des fichiers (${court(e.pattern, 30)})`, humeur: 'cherche' }
    case 'WebSearch':
      return { icone: '🔭', texte: `Je cherche sur le web « ${court(e.query, 30)} »`, humeur: 'cherche' }
    case 'WebFetch':
      return { icone: '🌐', texte: `Je lis une page de ${domaine(e.url)}`, humeur: 'lit' }
    case 'Bash': {
      const commande = typeof e.command === 'string' ? e.command.trim() : ''
      const premier = commande.split(/\s+/)[0] ?? ''
      const h: Humeur = /^(grep|rg|find|fd|locate|which)$/.test(premier)
        ? 'cherche'
        : /^(cat|head|tail|less|sed|ls|tree|wc|jq|stat)$/.test(premier)
          ? 'lit'
          : 'ecrit'
      const quoi = court(e.description, 44) || court(commande, 44)
      return { icone: '⚙️', texte: `Je lance une commande : ${quoi}`, humeur: h }
    }
    case 'Agent':
    case 'Task':
      return { icone: '🤝', texte: `Je confie une tâche à un assistant : ${court(e.description, 30)}` }
    case 'TodoWrite':
      return { icone: '📝', texte: 'Je mets à jour ma liste de tâches', humeur: 'ecrit' }
    case 'AskUserQuestion':
      return { icone: '❓', texte: 'Je te pose une question' }
    case 'Skill':
      return { icone: '🧰', texte: `J'ouvre le mode d'emploi « ${court(e.skill, 30)} »`, humeur: 'lit' }
    case 'ToolSearch':
      return { icone: '🧰', texte: 'Je prépare mes outils', humeur: 'cherche' }
    case 'Artifact':
      return { icone: '🖼️', texte: 'Je prépare une page à partager', humeur: 'ecrit' }
    default: {
      if (outil.startsWith('mcp__')) {
        const morceaux = outil.split('__')
        const service = (morceaux[1] ?? '').replace(/^claude_ai_/, '').replace(/_/g, ' ')
        const action = (morceaux[2] ?? '').replace(/[_-]/g, ' ')
        return { icone: '🔌', texte: `J'utilise ${service} : ${action}` }
      }
      return { icone: '🔧', texte: `J'utilise l'outil ${outil}` }
    }
  }
}

function heure(ms: number): string {
  const d = new Date(ms)
  const deux = (n: number) => String(n).padStart(2, '0')
  return `${deux(d.getHours())}:${deux(d.getMinutes())}`
}

const LEGENDES: Record<Humeur, string> = {
  dort: 'Je me repose… z z z',
  lit: 'Je lis attentivement',
  ecrit: "J'écris",
  cherche: 'Je cherche',
  joie: "J'ai terminé !",
}

// ───────────────────────────────────── Les hooks ─────────────────────────────────────

export const register: Register = on => {
  let image0 = 0
  let finJoie: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ce-que-fait-claude',
      description: 'Ouvrir le panneau « Ce que fait Claude »',
    })
    void $.ui.open({ id: PANE, title: TITRE, columns: 44 })

    // Anime le robot du terminal ; ailleurs le SVG s'anime tout seul.
    $.clock.every(250, async () => {
      image0 = (image0 + 1) % NB_IMAGES
      const etat = await read($, humeur)
      await $.ui.blit({ requestId: PANE, key: 'robot', cells: robotCases(etat, image0) })
    })

    return next(e)
  })

  on('command.run', { command: 'ce-que-fait-claude' }, async $ => {
    await $.ui.open({ id: PANE, title: TITRE, columns: 44 })
    return { text: 'Panneau « Ce que fait Claude » ouvert.' }
  })

  // Observe chaque outil sans rien y changer.
  on('tool.call', async ($, e, next) => {
    try {
      finJoie?.cancel()
      const d = decrire(e.tool, e as unknown as Record<string, unknown>)
      const action: Action = { id: e.tool_use_id, icone: d.icone, texte: d.texte, heure: heure(await $.clock.now()) }
      await update($, actions, liste => [...liste, action].slice(-100))
      if (d.humeur) await update($, humeur, () => d.humeur as Humeur)
    } catch {
      // le panneau ne doit jamais gêner le travail
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const fini = await next(e)
    try {
      if (!(e as { agentId?: string }).agentId) {
        if (e.reason === 'answer') {
          await update($, humeur, () => 'joie' as Humeur)
          const quand = heure(await $.clock.now())
          await update($, actions, liste =>
            [...liste, { id: e.turnId, icone: '🎉', texte: "J'ai terminé", heure: quand }].slice(-100),
          )
          finJoie?.cancel()
          finJoie = $.clock.after(6000, () => void update($, humeur, x => (x === 'joie' ? 'dort' : x)))
        } else {
          await update($, humeur, () => 'dort' as Humeur)
        }
      }
    } catch {
      // idem : observer seulement
    }
    return fini
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const etat = await read($, humeur)
    const liste = await read($, actions)
    const place = Math.max(3, (e.viewport?.rows ?? 30) - 26)
    const recentes = liste.slice(-place).reverse()

    if (e.surface === 'terminal') {
      const { Box, Text: T, Raster } = $.ui.resolve(e)
      return (
        <Box flexDirection="column" gap={1}>
          <Box flexDirection="column" alignItems="center">
            <Raster key="robot" columns={COLS} rows={LIGNES} cells={robotCases(etat, image0)} />
            <T color="#E8762B" bold>{LEGENDES[etat]}</T>
          </Box>
          <Box flexDirection="column">
            {recentes.length === 0 && <T dimColor>Rien pour l'instant.</T>}
            {recentes.map(a => (
              <T wrap="truncate-end">
                <T dimColor>{a.heure}</T> {a.icone} {a.texte}
              </T>
            ))}
          </Box>
        </Box>
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column" alignItems="center">
          <Svg source={robotSvg(etat)} alt={`Le robot : ${LEGENDES[etat]}`} width={160} height={160} isInteractive />
          <Text color="#E8762B" bold>{LEGENDES[etat]}</Text>
        </Box>
        <Box flexDirection="column">
          {recentes.length === 0 && <Text dimColor>Rien pour l'instant.</Text>}
          {recentes.map(a => (
            <Text wrap="truncate-end">
              <Text dimColor>{a.heure}</Text> {a.icone} {a.texte}
            </Text>
          ))}
        </Box>
      </Box>
    )
  })
}
