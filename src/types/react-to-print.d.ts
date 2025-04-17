
declare module 'react-to-print' {
  import React from 'react';

  export interface UseReactToPrintProps {
    content: () => React.ReactInstance | null;
    documentTitle?: string;
    onBeforePrint?: () => void;
    onAfterPrint?: () => void;
  }

  export function useReactToPrint(props: UseReactToPrintProps): () => void;
}
