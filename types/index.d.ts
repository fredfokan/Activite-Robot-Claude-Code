export type Humeur = 'dort' | 'lit' | 'ecrit' | 'cherche' | 'joie'
export type Action = { id: string; icone: string; texte: string; heure: string }

declare module 'claude-code' {
  interface PluginState {
    'robot-activite': {
      humeur: Shaped<Humeur>
      actions: Shaped<Action[]>
    }
  }
}
