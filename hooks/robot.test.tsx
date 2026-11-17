import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'robot-activite',
  component: 'Pane',
  requestId: 'robot-activite',
  props: {
    title: 'Ce que fait Claude',
    isFocused: false,
    bodyColumns: 44,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('une lecture s’affiche en français, le robot lit, et l’outil tourne normalement', async ($, on) => {
  on('command.register', () => ({ value: { command: 'ce-que-fait-claude' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: { ok: 'contenu' } }))
  on('clock.every', () => ({ value: undefined }))
  on('ui.blit', () => ({ value: {} }))
  on('clock.now', () => ({ value: 1763380800000 }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const r = await $.tool.call({ tool: 'Read', file_path: '/home/x/devis-ondine.pdf' })
  expect(JSON.stringify(r)).toContain('contenu')

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    const ligne = await ui.find({ type: 'Text', text: /devis/ })
    expect(ligne?.text).toContain('📖 Je lis « devis-ondine.pdf »')
    expect((await ui.find({ type: 'Text', text: /attentivement/ }))?.text).toBe('Je lis attentivement')
    await ui.unmount()
  }
})
