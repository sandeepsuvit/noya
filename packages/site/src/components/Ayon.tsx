import * as ChakraUI from '@chakra-ui/react';
import { VStack } from '@chakra-ui/react';
import produce from 'immer';
import { NoyaAPI } from 'noya-api';
import { StateProvider } from 'noya-app-state-context';
import {
  Button,
  DropdownMenu,
  Popover,
  RadioGroup,
  SEPARATOR_ITEM,
  Small,
  Spacer,
  Stack,
} from 'noya-designsystem';
import Sketch from 'noya-file-format';
import { toZipFile } from 'noya-filesystem';
import { Size } from 'noya-geometry';
import {
  BoxIcon,
  ChevronDownIcon,
  CodeIcon,
  FigmaLogoIcon,
  FileIcon,
  GroupIcon,
  ImageIcon,
  PlusIcon,
  SketchLogoIcon,
  TransformIcon,
  ViewVerticalIcon,
} from 'noya-icons';
import { amplitude } from 'noya-log';
import { setPublicPath } from 'noya-public-path';
import {
  CanvasKitProvider,
  FontManagerProvider,
  ImageCacheProvider,
  useCanvasKit,
  useFontManager,
} from 'noya-renderer';
import { SketchFile } from 'noya-sketch-file';
import { SketchModel } from 'noya-sketch-model';
import {
  createInitialWorkspaceState,
  Layers,
  Selectors,
  WorkspaceAction,
  workspaceReducer,
  WorkspaceState,
} from 'noya-state';
import { UTF16 } from 'noya-utils';
import React, {
  ComponentProps,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useState,
} from 'react';
import { Blocks } from '../ayon/blocks';
import {
  allAyonSymbols,
  ayonLibraryId,
  boxSymbolId,
} from '../ayon/blocks/symbols';
import { Content, ViewType } from '../ayon/Content';
import { useProject } from '../contexts/ProjectContext';
import { downloadBlob } from '../utils/download';
import { ProjectMenu } from './ProjectMenu';
import { ProjectTitle } from './ProjectTitle';
import { ShareMenu } from './ShareMenu';

const Components = new Map<unknown, string>();

Object.entries(ChakraUI).forEach(([key, value]) => {
  Components.set(value, key);
});

export type ExportType = NoyaAPI.ExportFormat | 'figma' | 'sketch' | 'react';

const persistedViewType =
  (typeof localStorage !== 'undefined' &&
    (localStorage.getItem('noya-ayon-preferred-view-type') as ViewType)) ||
  'split';

function Workspace({
  fileId,
  uploadAsset,
  initialDocument,
  onChangeDocument,
  name,
  onChangeName,
  onDuplicate,
  viewType: initialViewType = persistedViewType,
  padding,
  canvasRendererType,
  downloadFile,
}: {
  fileId: string;
  initialDocument: SketchFile;
  onChangeDocument?: (document: SketchFile) => void;
  onDuplicate?: () => void;
  name: string;
  onChangeName?: (name: string) => void;
  viewType?: ViewType;
  downloadFile?: (type: NoyaAPI.ExportFormat, size: Size, name: string) => void;
} & Pick<
  ComponentProps<typeof Content>,
  'uploadAsset' | 'padding' | 'canvasRendererType'
>): JSX.Element {
  const CanvasKit = useCanvasKit();
  const fontManager = useFontManager();
  const [viewType, setViewTypeMemory] = useState<ViewType>(initialViewType);
  const { setRightToolbar, setCenterToolbar, setLeftToolbar } = useProject();

  const setViewType = useCallback(
    (type: ViewType) => {
      switch (type) {
        case 'split':
          amplitude.logEvent('Project - View - Switched to Split View');
          break;
        case 'combined':
          amplitude.logEvent('Project - View - Switched to Combined View');
          break;
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('noya-ayon-preferred-view-type', type);
      }

      setViewTypeMemory(type);
    },
    [setViewTypeMemory],
  );

  const reducer = useCallback(
    (state: WorkspaceState, action: WorkspaceAction) =>
      workspaceReducer(state, action, CanvasKit, fontManager),
    [CanvasKit, fontManager],
  );

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const workspace = createInitialWorkspaceState(initialDocument);

    return produce(workspace, (draft) => {
      draft.preferences.showDotGrid = true;
      draft.preferences.wireframeMode = true;

      const artboardId = Layers.find(
        draft.history.present.sketch.pages[0],
        Layers.isArtboard,
      )?.do_objectID;

      draft.history.present.isolatedLayerId = artboardId;

      draft.history.present.sketch.document.foreignSymbols = allAyonSymbols.map(
        (symbol) =>
          SketchModel.foreignSymbol({
            symbolMaster: symbol,
            libraryID: ayonLibraryId,
          }),
      );

      return draft;
    });
  });

  useEffect(() => {
    const documentWithoutForeignSymbols = produce(
      state.history.present.sketch,
      (draft) => {
        draft.document.foreignSymbols = [];
      },
    );

    onChangeDocument?.(documentWithoutForeignSymbols);
  }, [state.history.present.sketch, onChangeDocument]);

  const artboard = Layers.find<Sketch.Artboard>(
    Selectors.getCurrentPage(state.history.present),
    Layers.isArtboard,
  );

  const interactionState = state.history.present.interactionState;
  const cursorType =
    interactionState.type === 'insert' || interactionState.type === 'drawing'
      ? 'insert'
      : interactionState.type === 'selectionMode' ||
        interactionState.type === 'marquee'
      ? 'region'
      : '';

  useEffect(() => {
    setLeftToolbar(
      <Stack.H alignSelf={'center'} width={60}>
        <RadioGroup.Root
          value={cursorType}
          variant="secondary"
          allowEmpty
          onValueChange={(value: typeof cursorType) => {
            if (!value) {
              dispatch(['interaction', ['reset']]);
              return;
            }

            switch (value) {
              case 'region': {
                dispatch(['interaction', ['enableSelectionMode', 'mouse']]);
                break;
              }
              case 'insert': {
                dispatch([
                  'interaction',
                  ['insert', { symbolId: boxSymbolId }, 'mouse'],
                ]);
                break;
              }
            }
          }}
        >
          <RadioGroup.Item
            value="insert"
            tooltip={
              <VStack alignItems="start">
                <Small fontWeight={600}>Insert over everything</Small>
                <Small>Hold Cmd/Ctrl to activate</Small>
              </VStack>
            }
          >
            <PlusIcon />
          </RadioGroup.Item>
          <RadioGroup.Item
            value="region"
            tooltip={
              <VStack alignItems="start">
                <Small fontWeight={600}>Select region</Small>
                <Small>Hold Shift to activate</Small>
              </VStack>
            }
          >
            <GroupIcon />
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Stack.H>,
    );
  }, [cursorType, setLeftToolbar]);

  useLayoutEffect(() => {
    setRightToolbar(
      <Stack.H gap={8}>
        <DropdownMenu<ViewType>
          items={[
            {
              value: 'split',
              title: 'Split View',
              icon: <ViewVerticalIcon />,
              checked: viewType === 'split',
            },
            {
              value: 'combined',
              title: 'Combined View',
              icon: <BoxIcon />,
              checked: viewType === 'combined',
            },
          ]}
          onSelect={setViewType}
          onOpenChange={() => {
            dispatch(['selectLayer', []]);
          }}
        >
          <Button>
            View
            <Spacer.Horizontal size={4} />
            <ChevronDownIcon />
          </Button>
        </DropdownMenu>
        <DropdownMenu<ExportType>
          items={[
            {
              value: 'png',
              title: 'PNG',
              icon: <ImageIcon />,
            },
            {
              value: 'pdf',
              title: 'PDF',
              icon: <FileIcon />,
            },
            {
              value: 'svg',
              title: 'SVG',
              icon: <TransformIcon />,
            },
            SEPARATOR_ITEM,
            {
              value: 'figma',
              title: 'Figma',
              icon: <FigmaLogoIcon />,
            },
            {
              value: 'sketch',
              title: 'Sketch',
              icon: <SketchLogoIcon />,
            },
            SEPARATOR_ITEM,
            {
              value: 'react',
              title: 'React Code',
              icon: <CodeIcon />,
            },
          ]}
          onSelect={async (value) => {
            if (!artboard) return;

            switch (value) {
              case 'png':
              case 'pdf':
              case 'svg':
                switch (value) {
                  case 'png':
                    amplitude.logEvent('Project - Export - Exported PNG');
                    break;
                  case 'pdf':
                    amplitude.logEvent('Project - Export - Exported PDF');
                    break;
                  case 'svg':
                    amplitude.logEvent('Project - Export - Exported SVG');
                    break;
                }

                downloadFile?.(value, artboard.frame, `Design.${value}`);
                return;
              case 'figma':
                amplitude.logEvent('Project - Export - Exported Figma');
                downloadFile?.('svg', artboard.frame, `Drag into Figma.svg`);
                return;
              case 'sketch':
                amplitude.logEvent('Project - Export - Exported Sketch');
                downloadFile?.('pdf', artboard.frame, `Drag into Sketch.pdf`);
                return;
              case 'react': {
                amplitude.logEvent('Project - Export - Exported React Code');
                const { compile } = await import('noya-compiler');
                const result = compile({
                  artboard,
                  Blocks,
                  Components,
                });
                const zipFile = await toZipFile(
                  {
                    'App.tsx': UTF16.toUTF8(result['App.tsx']),
                    'package.json': UTF16.toUTF8(result['package.json']),
                  },
                  'App.zip',
                );
                downloadBlob(zipFile);
                return;
              }
            }
          }}
          onOpenChange={() => {
            dispatch(['selectLayer', []]);
          }}
        >
          <Button>
            Export
            <Spacer.Horizontal size={4} />
            <ChevronDownIcon />
          </Button>
        </DropdownMenu>
        <Popover
          trigger={
            <Button>
              Share
              <Spacer.Horizontal size={4} />
              <ChevronDownIcon />
            </Button>
          }
          onOpenChange={() => {
            dispatch(['selectLayer', []]);
          }}
        >
          <Stack.V width={240}>
            <ShareMenu fileId={fileId} />
          </Stack.V>
        </Popover>
      </Stack.H>,
    );
  }, [
    downloadFile,
    setRightToolbar,
    state.history.present,
    viewType,
    artboard,
    setViewType,
    name,
    onChangeName,
    fileId,
  ]);

  useLayoutEffect(() => {
    setCenterToolbar(
      <StateProvider state={state} dispatch={dispatch}>
        <Popover
          trigger={<ProjectTitle>{name}</ProjectTitle>}
          onOpenChange={() => {
            dispatch(['selectLayer', []]);
          }}
        >
          <Stack.V width={240}>
            <ProjectMenu
              name={name}
              onChangeName={onChangeName || (() => {})}
              onDuplicate={onDuplicate || (() => {})}
            />
          </Stack.V>
        </Popover>
      </StateProvider>,
    );
  }, [name, onChangeName, onDuplicate, setCenterToolbar, state]);

  return (
    <StateProvider state={state} dispatch={dispatch}>
      <Content
        canvasRendererType={canvasRendererType}
        uploadAsset={uploadAsset}
        viewType={viewType}
        padding={padding}
      />
    </StateProvider>
  );
}

let initialized = false;

export default memo(function Ayon(
  props: ComponentProps<typeof Workspace>,
): JSX.Element {
  if (!initialized) {
    setPublicPath('https://www.noya.design');
    initialized = true;
  }

  return (
    <Suspense fallback={null}>
      <ImageCacheProvider>
        <CanvasKitProvider
          library={
            props.canvasRendererType === 'canvas' ? 'canvaskit' : 'svgkit'
          }
        >
          <FontManagerProvider>
            <Workspace {...props} />
          </FontManagerProvider>
        </CanvasKitProvider>
      </ImageCacheProvider>
    </Suspense>
  );
});
