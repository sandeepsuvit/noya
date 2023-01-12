import { useApplicationState } from 'noya-app-state-context';
import { Rect } from 'noya-geometry';
import { DropShadow, useColorFill } from 'noya-react-canvaskit';
import { getDragHandles, Primitives } from 'noya-state';
import React, { memo, useMemo } from 'react';
import { Group, Rect as RCKRect } from '../ComponentsContext';
import { useCanvasKit } from '../hooks/useCanvasKit';
import { pixelAlignRect } from '../pixelAlignment';
import { useZoom } from '../ZoomContext';

interface Props {
  rect: Rect;
}

export default memo(function DragHandles({ rect }: Props) {
  const CanvasKit = useCanvasKit();
  const [state] = useApplicationState();
  const zoom = useZoom();

  const dragHandleFill = useColorFill('#FFF');

  const dragHandles = getDragHandles(state, rect, zoom);

  const dropShadow = useMemo(
    (): DropShadow => ({
      type: 'dropShadow',
      color: CanvasKit.Color(0, 0, 0, 0.5),
      offset: { x: 0, y: 0 },
      radius: 1 / zoom,
    }),
    [CanvasKit, zoom],
  );

  return (
    <Group imageFilter={dropShadow}>
      {dragHandles.map((handle, index) => (
        <React.Fragment key={index}>
          <RCKRect
            rect={Primitives.rect(CanvasKit, pixelAlignRect(handle.rect, zoom))}
            paint={dragHandleFill}
          />
        </React.Fragment>
      ))}
    </Group>
  );
});
