/**
 * Haptics Utility - Wrapper for Capacitor Haptics
 * Provides tactile feedback for native app interactions
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

export const haptic = {
  /** Light impact - for subtle UI interactions like tab switches */
  light: () => isNative() && Haptics.impact({ style: ImpactStyle.Light }),
  
  /** Medium impact - for confirmatory actions like menu opens */
  medium: () => isNative() && Haptics.impact({ style: ImpactStyle.Medium }),
  
  /** Heavy impact - for significant actions like deletions */
  heavy: () => isNative() && Haptics.impact({ style: ImpactStyle.Heavy }),
  
  /** Success notification - for completed actions */
  success: () => isNative() && Haptics.notification({ type: NotificationType.Success }),
  
  /** Warning notification - for caution-worthy actions */
  warning: () => isNative() && Haptics.notification({ type: NotificationType.Warning }),
  
  /** Error notification - for failed actions */
  error: () => isNative() && Haptics.notification({ type: NotificationType.Error }),
  
  /** Selection change - for picker/selection changes */
  selection: () => isNative() && Haptics.selectionChanged(),
};

export default haptic;
