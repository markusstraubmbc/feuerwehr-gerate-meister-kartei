
declare module 'react-to-print' {
  import React from 'react';

  export interface UseReactToPrintProps {
    content: () => React.RefObject<HTMLElement> | null;
    documentTitle?: string;
    onBeforePrint?: () => void;
    onAfterPrint?: () => void;
  }

  export function useReactToPrint(props: UseReactToPrintProps): () => void;
}
