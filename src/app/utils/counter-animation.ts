/**
 * Counter animation utility for smooth number counting effects.
 * Counts from 0 to target value with easing.
 */

export class CounterAnimation {
  private animationId: number | null = null;
  private startTime: number = 0;
  private readonly duration: number;
  private readonly easing: (t: number) => number;

  constructor(duration: number = 1000) {
    this.duration = duration;
    // Ease out expo function
    this.easing = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  }

  /**
   * Animate counter from 0 to target value.
   */
  animate(
    target: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ): void {
    this.stop();
    this.startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      const easedProgress = this.easing(progress);
      const currentValue = Math.floor(target * easedProgress);

      onUpdate(currentValue);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(step);
      } else {
        onUpdate(target); // Ensure we hit exact target
        onComplete?.();
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(step);
  }

  /**
   * Stop the current animation.
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

/**
 * Animate multiple counters simultaneously.
 * Returns a cleanup function to stop all animations.
 */
export function animateCounters(
  counters: Array<{ target: number; onUpdate: (val: number) => void }>,
  duration: number = 1000
): () => void {
  const animations = counters.map((counter) => {
    const anim = new CounterAnimation(duration);
    anim.animate(counter.target, counter.onUpdate);
    return anim;
  });

  // Return cleanup function
  return () => {
    animations.forEach((anim) => anim.stop());
  };
}

