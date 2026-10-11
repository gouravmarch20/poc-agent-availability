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
