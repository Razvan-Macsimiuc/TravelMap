import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Directive to add press animation and haptic feedback to buttons.
 * Usage: <ion-button appButtonPress>Click me</ion-button>
 */
@Directive({
  selector: '[appButtonPress]',
  standalone: true,
})
export class ButtonPressDirective {
  private readonly el = inject(ElementRef);

  @HostListener('touchstart', ['$event'])
  @HostListener('mousedown', ['$event'])
  onPress(event: Event): void {
    const element = this.el.nativeElement as HTMLElement;
    
    // Add press class
    element.classList.add('button-pressing');
    
    // Trigger haptic feedback
    this.triggerHaptic();
  }

  @HostListener('touchend')
  @HostListener('mouseup')
  @HostListener('mouseleave')
  onRelease(): void {
    const element = this.el.nativeElement as HTMLElement;
    element.classList.remove('button-pressing');
  }

  private async triggerHaptic(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available, silently ignore
    }
  }
}




