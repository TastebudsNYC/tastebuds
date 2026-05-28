export function runWithViewTransition(update: () => void) {
  if (typeof document === 'undefined') {
    update()
    return
  }

  const nextDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  if (typeof nextDocument.startViewTransition === 'function') {
    nextDocument.startViewTransition(update)
    return
  }

  update()
}
