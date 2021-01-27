import { Action, ApplicationState, PageLayer, Point, Rect } from 'ayano-state';
import type { CanvasKit, Surface } from 'canvaskit-wasm';
import { useEffect, useRef, useState } from 'react';
import { drawRectangle, load } from 'sketch-canvas';
import produce from 'immer';
import './App.css';
import rectangleExample from './rectangleExample';

declare module 'canvaskit-wasm' {
  interface Surface {
    flush(): void;
  }
}

interface Props {
  state: ApplicationState;
  dispatch: (action: Action) => void;
}

function getPoint(event: MouseEvent): Point {
  return { x: event.offsetX, y: event.offsetY };
}

function createRect(initialPoint: Point, finalPoint: Point): Rect {
  return {
    width: Math.abs(finalPoint.x - initialPoint.x),
    height: Math.abs(finalPoint.y - initialPoint.y),
    x: Math.min(finalPoint.x, initialPoint.x),
    y: Math.min(finalPoint.y, initialPoint.y),
  };
}

export default function Canvas({ state, dispatch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [CanvasKit, setCanvasKit] = useState<CanvasKit | null>(null);
  const [surface, setSurface] = useState<Surface | null>(null);

  useEffect(() => {
    load().then(setCanvasKit);
  }, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;

    if (!canvasElement || !CanvasKit) return;

    const surface = CanvasKit.MakeCanvasSurface(canvasElement.id);

    if (!surface) {
      setSurface(null);

      console.log('failed to create surface');
      return;
    }

    setSurface(surface);
  }, [CanvasKit]);

  useEffect(() => {
    if (!surface || !CanvasKit) return;

    const { sketch, selectedPage, interactionState } = state;
    const context = { CanvasKit, canvas: surface.getCanvas() };

    const page = sketch.pages.find((page) => page.do_objectID === selectedPage);

    if (!page) return;

    page.layers.forEach((layer) => {
      if (layer._class === 'rectangle') {
        drawRectangle(context, layer);
      }
    });

    if (interactionState.type === 'drawing') {
      drawRectangle(context, interactionState.value as any);
    }

    surface.flush();
  }, [CanvasKit, surface, state]);

  return (
    <canvas
      onMouseDown={(event) => {
        const point = getPoint(event.nativeEvent);
        const rect = createRect(point, point);

        const layer: PageLayer = {
          ...rectangleExample,
          frame: {
            _class: 'rect',
            constrainProportions: false,
            ...rect,
          },
        };

        dispatch({
          type: 'interaction',
          state: {
            type: 'drawing',
            value: layer,
            origin: point,
          },
        });
      }}
      onMouseMove={(event) => {
        if (state.interactionState.type !== 'drawing') return;

        const point = getPoint(event.nativeEvent);
        const rect = createRect(state.interactionState.origin, point);

        const layer = produce(state.interactionState.value, (layer) => {
          layer.frame = {
            ...layer.frame,
            ...rect,
          };
        });

        dispatch({
          type: 'interaction',
          state: {
            type: 'drawing',
            value: layer,
            origin: state.interactionState.origin,
          },
        });
      }}
      onMouseUp={(event) => {
        if (state.interactionState.type !== 'drawing') return;

        const point = getPoint(event.nativeEvent);
        const rect = createRect(state.interactionState.origin, point);

        const layer = produce(state.interactionState.value, (layer) => {
          layer.frame = {
            ...layer.frame,
            ...rect,
          };
        });

        dispatch({
          type: 'interaction',
          state: {
            type: 'ready',
          },
        });
        dispatch({
          type: 'addLayer',
          layer,
        });
      }}
      width={window.innerWidth}
      height={window.innerHeight}
      id="main"
      ref={canvasRef}
    />
  );
}
