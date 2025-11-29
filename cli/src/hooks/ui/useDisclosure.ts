/**
 * useDisclosure Hook
 * Chakra UI pattern for managing boolean open/close states
 * Uses Zustand UI store internally to avoid useState boilerplate
 */

import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';

export interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
}

/**
 * Hook for managing disclosure state (modals, dialogs, dropdowns, etc.)
 * Similar to Chakra UI's useDisclosure pattern
 * 
 * @param id - Unique identifier for the disclosure (default: 'default')
 * @returns Object with isOpen, onOpen, onClose, onToggle
 * 
 * @example
 * ```tsx
 * const { isOpen, onOpen, onClose, onToggle } = useDisclosure('my-modal');
 * 
 * // For multiple disclosures
 * const modal1 = useDisclosure('modal-1');
 * const modal2 = useDisclosure('modal-2');
 * ```
 */
export function useDisclosure(id: string = 'default'): UseDisclosureReturn {
  const isOpen = useUIStore((state) => state.disclosures[id] ?? false);
  const openDisclosure = useUIStore((state) => state.openDisclosure);
  const closeDisclosure = useUIStore((state) => state.closeDisclosure);
  const toggleDisclosure = useUIStore((state) => state.toggleDisclosure);

  const onOpen = useCallback(() => {
    openDisclosure(id);
  }, [id, openDisclosure]);

  const onClose = useCallback(() => {
    closeDisclosure(id);
  }, [id, closeDisclosure]);

  const onToggle = useCallback(() => {
    toggleDisclosure(id);
  }, [id, toggleDisclosure]);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
}

