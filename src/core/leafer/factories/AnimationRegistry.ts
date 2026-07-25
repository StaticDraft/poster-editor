export type AnimationFn = (node: any, anim: any, autoplay: boolean) => void

interface AnimationStrategy {
  apply: AnimationFn
}

const animationStrategies: Record<string, AnimationStrategy> = {
  spin: {
    apply: (node, anim, autoplay) => {
      node.around = 'center'
      node.__animationRef = node.animate({ rotation: 360 }, { duration: anim.duration || 2, loop: true })
      if (!autoplay && node.__animationRef) {
        setTimeout(() => {
          try { node.__animationRef.pause() } catch {}
        }, 10)
      }
    },
  },
  breathe: {
    apply: (node, anim, autoplay) => {
      node.__animationRef = node.animate({ opacity: 0.2 }, { duration: anim.duration || 1, loop: true, yoyo: true })
      if (!autoplay && node.__animationRef) {
        setTimeout(() => {
          try { node.__animationRef.pause() } catch {}
        }, 10)
      }
    },
  },
}

export function executeAnimationStrategy(node: any, anim: any, autoplay: boolean) {
  if (node.__animationRef) {
    try { node.__animationRef.stop() } catch {}
    try { node.__animationRef.destroy() } catch {}
    node.__animationRef = null
    node.rotation = 0
    node.opacity = 1
  }

  if (!anim || !anim.type || anim.type === 'none') return

  const strategy = animationStrategies[anim.type]
  if (strategy) {
    strategy.apply(node, anim, autoplay)
  }
}
