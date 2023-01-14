import { useApplicationState, useWorkspace } from 'noya-app-state-context';
import {
  createSectionedMenu,
  mergeEventHandlers,
  ReactEventHandlers,
  usePlatform,
  usePlatformModKey,
} from 'noya-designsystem';
import { Point, Rect } from 'noya-geometry';
import { handleKeyboardEvent } from 'noya-keymap';
import { OffsetPoint } from 'noya-react-utils';
import { useCanvasKit, useFontManager } from 'noya-renderer';
import {
  CompassDirection,
  DrawableLayerType,
  getCurrentPage,
  InteractionState,
  Layers,
  LayerTraversalOptions,
  Selectors,
  SetNumberMode,
  TextEditorCursorDirection,
  TextEditorCursorUnit,
  TextSelectionRange,
} from 'noya-state';
import { useMemo } from 'react';
import { ZERO_INSETS } from '../components/CanvasElement';
import { ICanvasElement } from '../components/types';
import { useMultipleClickCount } from '../hooks/useMultipleClickCount';
import { CopyPasteActions } from '../interactions/copyPaste';
import { DrawingActions } from '../interactions/drawing';
import { EditBlockActions } from '../interactions/editBlock';
import { EditTextActions } from '../interactions/editText';
import { EscapeActions } from '../interactions/escape';
import { MarqueeActions } from '../interactions/marquee';
import { MoveActions } from '../interactions/move';
import { PanActions } from '../interactions/pan';
import { ReorderActions } from '../interactions/reorder';
import { ScaleActions } from '../interactions/scale';
import { SelectionActions } from '../interactions/selection';
import { InteractionAPI } from '../interactions/types';
import { convertPoint } from '../utils/convertPoint';

function getPoint(event: OffsetPoint): Point {
  return { x: Math.round(event.offsetX), y: Math.round(event.offsetY) };
}

export type Actions = MarqueeActions &
  SelectionActions &
  MoveActions &
  ScaleActions &
  DrawingActions &
  PanActions &
  EditBlockActions &
  EditTextActions &
  CopyPasteActions &
  EscapeActions &
  ReorderActions;

export type Interaction = (
  actions: Actions,
) => (
  state: InteractionState,
  key: InteractionState['type'],
  api: InteractionAPI,
) => ReactEventHandlers;

interface Props {
  interactions?: Interaction[];
  elementInterface: ICanvasElement;
}

export function useInteractionHandlers({
  interactions = [],
  elementInterface,
}: Props) {
  const [state, dispatch] = useApplicationState();
  const { highlightedLayer } = useWorkspace();
  const CanvasKit = useCanvasKit();
  const fontManager = useFontManager();
  const platform = usePlatform();
  const platformModKey = usePlatformModKey();
  const meta = Selectors.getCurrentPageMetadata(state);
  const { zoomValue, scrollOrigin } = meta;
  const { getClickCount, setLatestClick } = useMultipleClickCount();
  const textSelection = Selectors.getTextSelection(state);

  const actions = useMemo((): Actions => {
    return {
      startMarquee: (point) => dispatch('interaction', ['startMarquee', point]),
      updateMarquee: (point) =>
        dispatch('interaction', ['updateMarquee', point]),
      reset: () => dispatch('interaction', ['reset']),
      selectLayer: (layerId, selectionType) =>
        dispatch('selectLayer', layerId, selectionType),
      deleteLayer: (layerId) => dispatch('deleteLayer', layerId),
      maybeMove: (point) => dispatch('interaction', ['maybeMove', point]),
      updateMoving: (point) => dispatch('interaction', ['updateMoving', point]),
      maybeScale: (point, direction) =>
        dispatch('interaction', ['maybeScale', point, direction]),
      updateScaling: (point, inferBlockType) =>
        dispatch('interaction', ['updateScaling', point, inferBlockType]),
      addDrawnLayer: () => dispatch('addDrawnLayer'),
      startDrawing: (layerType: DrawableLayerType, point: Point) =>
        dispatch('interaction', ['startDrawing', layerType, point]),
      updateDrawing: (point: Point, layerType?: DrawableLayerType) =>
        dispatch('interaction', ['updateDrawing', point, layerType]),
      pan: (point) => dispatch('pan*', point),
      startPanning: (point) => dispatch('interaction', ['startPanning', point]),
      updatePanning: (point) =>
        dispatch('interaction', ['updatePanning', point]),
      maybePan: (point) => dispatch('interaction', ['maybePan', point]),
      enablePanMode: () => dispatch('interaction', ['enablePanMode']),
      hoverHandle: (direction: CompassDirection) =>
        dispatch('interaction', ['hoverHandle', direction]),
      startEditingBlock: (layerId) =>
        dispatch('interaction', ['editingBlock', layerId]),
      startEditingText: (id: string, range: TextSelectionRange) =>
        dispatch('interaction', ['editingText', id, range]),
      setTextSelection: (range: TextSelectionRange) =>
        dispatch('setTextSelection', range),
      maybeSelectText: (point: Point) =>
        dispatch('interaction', ['maybeSelectText', point]),
      selectingText: (point: Point) =>
        dispatch('interaction', ['selectingText', point]),
      selectContainingText: (
        id: string,
        characterIndex: number,
        unit: 'word' | 'line',
      ) => dispatch('selectContainingText', id, characterIndex, unit),
      selectAllText: (id: string) => dispatch('selectAllText', id),
      insertText: (text: string) => dispatch('insertText', text),
      deleteText: (
        direction: TextEditorCursorDirection,
        unit: TextEditorCursorUnit,
      ) => dispatch('deleteText', direction, unit),
      moveCursor: (
        direction: TextEditorCursorDirection,
        unit: TextEditorCursorUnit,
      ) => dispatch('moveCursor', direction, unit),
      moveTextSelection: (
        direction: TextEditorCursorDirection,
        unit: TextEditorCursorUnit,
      ) => dispatch('moveTextSelection', direction, unit),
      setLayerX: (value: number, mode: SetNumberMode) =>
        dispatch('setLayerX', value, mode),
      setLayerY: (value: number, mode: SetNumberMode) =>
        dispatch('setLayerY', value, mode),
      selectAllLayers: () => dispatch('selectAllLayers'),
      addLayer: (layer) => dispatch('addLayer', layer),
      highlightLayer: (layerHighlight) =>
        dispatch('highlightLayer', layerHighlight),
      enterInsertMode: (layerType) =>
        dispatch('interaction', ['insert', layerType]),
      bringToFront: (id: string[]) => dispatch('bringToFront', id),
      sendToBack: (id: string[]) => dispatch('sendToBack', id),
    };
  }, [dispatch]);

  const api = useMemo((): InteractionAPI => {
    return {
      ...elementInterface,
      platform,
      platformModKey,
      zoomValue,
      getClickCount,
      selectedLayerIds: state.selectedLayerIds,
      selectedGradient: state.selectedGradient,
      highlightedLayerId: highlightedLayer?.id,
      textSelection,
      convertPoint: (point, system) =>
        convertPoint(scrollOrigin, zoomValue, point, system),
      getScreenPoint: getPoint,
      getCanvasPoint: (input: OffsetPoint) =>
        convertPoint(scrollOrigin, zoomValue, getPoint(input), 'canvas'),
      getLayerIdsInRect: (rect: Rect, options?: LayerTraversalOptions) => {
        const layers = Selectors.getLayersInRect(
          state,
          getCurrentPage(state),
          ZERO_INSETS,
          rect,
          options,
        );

        return layers.map((layer) => layer.do_objectID);
      },
      getLayerIdAtPoint: (point: Point, options?: LayerTraversalOptions) => {
        return Selectors.getLayerAtPoint(
          CanvasKit,
          fontManager,
          state,
          ZERO_INSETS,
          point,
          options,
        )?.do_objectID;
      },
      getLayerTypeById: (id: string) => {
        return Layers.find(
          getCurrentPage(state),
          (layer) => layer.do_objectID === id,
        )!._class;
      },
      getScaleDirectionAtPoint: (point: Point) =>
        Selectors.getScaleDirectionAtPoint(state, point),
      getCharacterIndexAtPoint: (layerId, point, mode) =>
        Selectors.getCharacterIndexAtPoint(
          CanvasKit,
          fontManager,
          state,
          layerId,
          point,
          mode,
        ),
      getCharacterIndexAtPointInSelectedLayer: (point, mode) =>
        Selectors.getCharacterIndexAtPointInSelectedLayer(
          CanvasKit,
          fontManager,
          state,
          point,
          mode,
        ),
      handleKeyboardEvent: (keyMap) => (event) =>
        handleKeyboardEvent(event.nativeEvent, api.platform, keyMap),
      getTextLength: (layerId) => {
        const layer = Layers.find(
          getCurrentPage(state),
          (layer) => layer.do_objectID === layerId,
        );

        if (layer && Layers.isTextLayer(layer)) {
          return layer.attributedString.string.length;
        } else {
          return 0;
        }
      },
    };
  }, [
    CanvasKit,
    elementInterface,
    fontManager,
    getClickCount,
    highlightedLayer?.id,
    platform,
    platformModKey,
    scrollOrigin,
    state,
    textSelection,
    zoomValue,
  ]);

  const handlers = interactions.map((interaction) =>
    interaction(actions)(
      state.interactionState,
      state.interactionState.type,
      api,
    ),
  );

  const getMenuItems = () =>
    createSectionedMenu(
      ...handlers.map((handler) =>
        handler.onContributeMenuItems ? handler.onContributeMenuItems() : [],
      ),
    );

  const onSelectMenuItem = (item: string) => {
    handlers.map(
      (handler) => handler.onSelectMenuItem && handler.onSelectMenuItem(item),
    );
  };

  const domHandlers = handlers.map((handler) => {
    const { onContributeMenuItems, onSelectMenuItem, ...rest } = handler;
    return rest;
  });

  return {
    api,
    actions,
    handlers: mergeEventHandlers(
      {
        onPointerDown: (event) => {
          setLatestClick(getPoint(event.nativeEvent));
        },
      },
      ...domHandlers,
    ),
    getMenuItems,
    onSelectMenuItem,
  };
}
