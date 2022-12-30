import type { CanvasKit } from 'canvaskit';
import { SuspendedValue } from 'noya-react-utils';
import React, { createContext, memo, ReactNode, useContext } from 'react';
import { loadCanvasKit } from '../loadCanvasKit';
// import loadSVGKit from 'noya-svgkit';

// We don't start loading CanvasKit until the Provider renders the first time,
// since we currently support setting the wasm path at runtime when the app starts,
// which needs to happen before `loadCanvasKit` is called.
let suspendedCanvasKit: SuspendedValue<CanvasKit>;

const CanvasKitContext = createContext<CanvasKit | undefined>(undefined);

export const CanvasKitProvider = memo(function CanvasKitProvider({
  children,
  CanvasKit,
}: {
  children?: ReactNode;
  CanvasKit?: CanvasKit;
}) {
  if (!suspendedCanvasKit) {
    suspendedCanvasKit = new SuspendedValue<CanvasKit>(loadCanvasKit());
  }

  const LoadedCanvasKit = CanvasKit ?? suspendedCanvasKit.getValueOrThrow();

  return (
    <CanvasKitContext.Provider value={LoadedCanvasKit}>
      {children}
    </CanvasKitContext.Provider>
  );
});

export function useCanvasKit() {
  const value = useContext(CanvasKitContext);

  if (!value) {
    throw new Error('Missing CanvasKitProvider');
  }

  return value;
}
