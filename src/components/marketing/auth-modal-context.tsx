"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthGateModal } from "./auth-gate-modal";

interface AuthModalContextType {
  openAuthModal: (targetUrl?: string) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

export function AuthModalProvider({
  children,
  isLoggedIn = false,
}: {
  children: ReactNode;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | undefined>(undefined);

  const openAuthModal = (url?: string) => {
    if (isLoggedIn) {
      router.push(url ?? "/dashboard");
      return;
    }
    setTargetUrl(url);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
    setTargetUrl(undefined);
  };

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUrl?: string }>;
      openAuthModal(customEvent.detail?.targetUrl);
    };

    window.addEventListener("open-auth-modal", handleOpen);
    return () => window.removeEventListener("open-auth-modal", handleOpen);
  }, [isLoggedIn]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      {isOpen && (
        <AuthGateModal
          open={isOpen}
          targetUrl={targetUrl}
          onClose={closeAuthModal}
          onAuthenticated={(redirectTo) => {
            closeAuthModal();
            router.push(redirectTo);
            router.refresh();
          }}
        />
      )}
    </AuthModalContext.Provider>
  );
}

export function AuthActionButton({
  children,
  className,
  targetUrl,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  targetUrl?: string;
  onClick?: () => void;
}) {
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        openAuthModal(targetUrl);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
