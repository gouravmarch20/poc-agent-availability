import type { CSSProperties } from 'react';
import { Toaster } from 'sonner';

// One toaster for the whole app. Top-centre keeps toasts clear of the thumb area and on-screen keyboard on phones,
// and the offset keeps them below the sticky header. Swiping a toast away works on touch screens.
export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      visibleToasts={3}
      offset={{ top: 80 }}
      mobileOffset={{ top: 68, left: 12, right: 12 }}
      // Success toasts are blue (errors stay red). Sonner's rich colours read these variables.
      style={{
        '--success-bg': '#eaf2ff',
        '--success-border': '#8fb4e6',
        '--success-text': '#1e40af',
      } as CSSProperties}
      toastOptions={{
        classNames: {
          toast: 'app-toast',
          title: 'app-toast-title',
          description: 'app-toast-description',
        },
      }}
    />
  );
}
