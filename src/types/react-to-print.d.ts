
declare module 'react-to-print' {
  import React from 'react';

  export interface UseReactToPrintProps {
    content: () => React.RefObject<HTMLElement>['current'] | null;
    documentTitle?: string;
    onBeforeGetContent?: () => void | Promise<void>;
    onBeforePrint?: () => void | Promise<void>;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    pageStyle?: string;
    trigger?: () => React.ReactNode;
  }

  export function useReactToPrint(props: UseReactToPrintProps): () => void;
  
  export interface ReactToPrintProps {
    trigger?: () => React.ReactNode;
    content: () => React.ReactNode;
    documentTitle?: string;
    onBeforeGetContent?: () => void | Promise<void>;
    onBeforePrint?: () => void | Promise<void>;
    onAfterPrint?: () => void;
    removeAfterPrint?: boolean;
    pageStyle?: string;
    copyStyles?: boolean;
  }
  
  export default class ReactToPrint extends React.Component<ReactToPrintProps> {}
}
