export type AnimationFn = (node: any, anim: any, autoplay: boolean) => void

interface AnimationStrategy {
  apply: AnimationFn
}

const animationStrategies: Record<string, AnimationStrategy> = {
  spin: {
    apply: (node, anim, autoplay) => {
      node.__animationRef = node.animate(
        { rotation: 360 },
        { duration: anim.duration || 2, loop: true, around: 'center' }
      )
      if (!autoplay && node.__animationRef) {
        setTimeout(() => {
          try { node.__animationRef.pause() } catch {}
        }, 10)
      }
    },
  },
  breathe: {
    apply: (node, anim, autoplay) => {
      node.__animationRef = node.animate(
        { opacity: 0.2 },
        { duration: anim.duration || 1, loop: true, yoyo: true, around: 'center' }
      )
      if (!autoplay && node.__animationRef) {
        setTimeout(() => {
          try { node.__animationRef.pause() } catch {}
        }, 10)
      }
    },
  },
}

export function executeAnimationStrategy(
  node: any,
  anim: any,
  autoplay: boolean,
  storeRotation?: number,
  storeOpacity?: number
) {
  if (node.__animationRef) {
    try { node.__animationRef.stop() } catch {}
    try { node.__animationRef.destroy() } catch {}
    node.__animationRef = null

    if (node.__initialRotation !== undefined) {
      node.rotation = node.__initialRotation
      delete node.__initialRotation
    }
    if (node.__initialOpacity !== undefined) {
      node.opacity = node.__initialOpacity
      delete node.__initialOpacity
    }
  }

  if (!anim || !anim.type || anim.type === 'none') {
    if (storeRotation !== undefined) node.rotation = storeRotation
    if (storeOpacity !== undefined) node.opacity = storeOpacity
    return
  }

  node.__initialRotation = storeRotation !== undefined ? storeRotation : (node.rotation ?? 0)
  node.__initialOpacity = storeOpacity !== undefined ? storeOpacity : (node.opacity ?? 1)

  const strategy = animationStrategies[anim.type]
  if (strategy) {
    strategy.apply(node, anim, autoplay)
  }
}
