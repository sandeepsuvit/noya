import Sketch from '@sketch-hq/sketch-file-format-ts';
import { Paint } from 'canvaskit';
import { Group, Path, Rect, useReactCanvasKit } from 'noya-react-canvaskit';
import { Primitives } from 'noya-renderer';
import { Selectors, Layers } from 'noya-state';
import { AffineTransform } from 'noya-geometry';
import { ReactNode, useMemo } from 'react';

function useLayerPath(layer: Sketch.Rectangle | Sketch.Oval) {
  const { CanvasKit } = useReactCanvasKit();

  return useMemo(() => {
    const path = Primitives.path(
      CanvasKit,
      layer.points,
      layer.frame,
      Layers.getFixedRadius(layer),
    );

    path.setFillType(CanvasKit.FillType.EvenOdd);

    return path;
  }, [CanvasKit, layer]);
}

function useLayerFrameRect(layer: Sketch.AnyLayer) {
  const { CanvasKit } = useReactCanvasKit();

  return useMemo(() => {
    return Primitives.rect(CanvasKit, layer.frame);
  }, [CanvasKit, layer]);
}

interface HoverOutlinePathProps {
  layer: Sketch.Rectangle | Sketch.Oval;
  paint: Paint;
}

function HoverOutlinePath({ layer, paint }: HoverOutlinePathProps) {
  return <Path path={useLayerPath(layer)} paint={paint} />;
}

interface HoverOutlineRectProps {
  layer: Sketch.AnyLayer;
  paint: Paint;
}

function HoverOutlineRect({ layer, paint }: HoverOutlineRectProps) {
  return <Rect rect={useLayerFrameRect(layer)} paint={paint} />;
}

interface Props {
  layer: Sketch.AnyLayer;
  paint: Paint;
  transform: AffineTransform;
}

export default function HoverOutline({ layer, paint, transform }: Props) {
  let localTransform = useMemo(
    () =>
      AffineTransform.multiply(
        transform,
        Selectors.getLayerRotationTransform(layer),
      ),
    [layer, transform],
  );

  let element: ReactNode;

  switch (layer._class) {
    case 'artboard':
    case 'bitmap':
    case 'group':
    case 'text':
    case 'symbolInstance':
    case 'symbolMaster': {
      element = <HoverOutlineRect layer={layer} paint={paint} />;
      break;
    }
    case 'rectangle':
    case 'oval': {
      element = <HoverOutlinePath layer={layer} paint={paint} />;
      break;
    }
    default:
      console.info(layer._class, 'not handled');
      element = null;
      break;
  }

  return <Group transform={localTransform}>{element}</Group>;
}
