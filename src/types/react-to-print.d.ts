
declare module 'react-to-print' {
  import React from 'react';

  export interface UseReactToPrintProps {
    content: () => React.RefObject<HTMLElement>['current'] | null;
    documentTitle?: string;
    onBeforePrint?: () => void;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
  }

  export function useReactToPrint(props: UseReactToPrintProps): () => void;
}
