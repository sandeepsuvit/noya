import { SearchIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Button,
  ChakraProvider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Spacer,
  Spinner,
  Switch,
  SystemProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useApplicationState, useWorkspace } from 'noya-app-state-context';
import Sketch from 'noya-file-format';
import {
  createRect,
  createResizeTransform,
  Size,
  transformRect,
} from 'noya-geometry';
import { useSize } from 'noya-react-utils';
import { BlockProps, Layers, Selectors } from 'noya-state';
import React, { ComponentProps, ReactNode, useEffect, useRef } from 'react';
import { AvatarBlock } from './blocks/AvatarBlock';
import { BoxBlock } from './blocks/BoxBlock';
import { ButtonBlock } from './blocks/ButtonBlock';
import { CheckboxBlock } from './blocks/CheckboxBlock';
import { ImageBlock } from './blocks/ImageBlock';
import {
  avatarSymbol,
  boxSymbol,
  buttonSymbol,
  checkboxSymbol,
  headerBarNavUserSymbol,
  heading1Symbol,
  heading2Symbol,
  heading3Symbol,
  heading4Symbol,
  heading5Symbol,
  heading6Symbol,
  heroSymbol,
  iconButtonSymbol,
  imageSymbol,
  inputSymbol,
  switchSymbol,
  textSymbol,
  writeSymbol,
} from './blocks/symbols';
import {
  filterHashTagsAndSlashCommands,
  filterTextPropertyHashTags,
} from './parse';

export const symbolIdToElement: Record<
  string,
  (props: BlockProps) => ReactNode
> = {
  [buttonSymbol.symbolID]: ButtonBlock.render,
  [avatarSymbol.symbolID]: AvatarBlock.render,
  [boxSymbol.symbolID]: BoxBlock.render,
  [checkboxSymbol.symbolID]: CheckboxBlock.render,
  [iconButtonSymbol.symbolID]: (props) => <IconButton aria-label={''} />,
  [inputSymbol.symbolID]: (props) => {
    const [value, setValue] = React.useState(props.blockText ?? '');

    useEffect(() => {
      setValue(props.blockText ?? '');
    }, [props.blockText]);

    return (
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
    );
  },
  [switchSymbol.symbolID]: (props) => <Switch />,
  [textSymbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Text
        color={color}
        fontWeight={fontWeight}
        fontSize={fontSize}
        align={align as SystemProps['textAlign']}
      >
        {content}
      </Text>
    );
  },
  [imageSymbol.symbolID]: ImageBlock.render,
  [heading1Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="2xl"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [heading2Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="xl"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [heading3Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="lg"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [heading4Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="md"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [heading5Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="sm"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [heading6Symbol.symbolID]: (props) => {
    const { content, color, fontWeight, fontSize, align } =
      filterTextPropertyHashTags(props.blockText);
    return (
      <Flex justify={align}>
        <Heading
          size="xs"
          color={color}
          fontWeight={fontWeight}
          fontSize={fontSize}
        >
          {content}
        </Heading>
      </Flex>
    );
  },
  [writeSymbol.symbolID]: (props) => {
    const { color, fontWeight, fontSize, align } = filterTextPropertyHashTags(
      props.blockText,
    );
    return (
      <Text
        color={color}
        fontWeight={fontWeight}
        fontSize={fontSize}
        align={align as SystemProps['textAlign']}
      >
        {props.resolvedBlockData?.resolvedText ?? (
          <Flex align="center">
            {props.blockText && (
              <>
                <Spinner
                  thickness="3px"
                  color="gray"
                  size={fontSize}
                  speed="1.5s"
                />
                <span style={{ marginLeft: 10 }}>Thinking...</span>
              </>
            )}
            {!props.blockText && 'Waiting for input...'}
          </Flex>
        )}
      </Text>
    );
  },
  [headerBarNavUserSymbol.symbolID]: (props) => {
    const { content, hashTags } = filterHashTagsAndSlashCommands(
      props.blockText,
    );
    const backgroundColor = hashTags?.includes('dark')
      ? 'rgba(11,21,48,0.9)'
      : 'rgba(255,255,255,0.9)';
    const borderBottomColor = hashTags?.includes('dark')
      ? 'transparent'
      : '#eee';
    const searchBackgroundColor = hashTags?.includes('dark')
      ? 'rgba(0,0,0,0.2)'
      : 'rgba(0,0,0,0.02)';
    const color = hashTags?.includes('dark') ? '#fff' : '#000';
    const links = content
      ? content.split(',').map((link) => link.trim())
      : ['*Home', 'Projects', 'Team', 'FAQ'];
    if (links.filter((link) => link[0] === '*').length === 0) {
      links[0] = `*${links[0]}`;
    }
    return (
      <Flex
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor={borderBottomColor}
        height={`${props.frame.height}px`}
        paddingX="10px"
        backgroundColor={backgroundColor}
        backdropFilter="auto"
        backdropBlur="10px"
      >
        {links.map((link, index) => {
          let backgroundColor = 'transparent';
          if (link[0] === '*') {
            backgroundColor = hashTags?.includes('dark')
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(0,0,0,0.1)';
          }
          const [, linkText] = /^\*?(.*)/.exec(link) || [];
          return (
            <Link
              marginX="10px"
              padding="5px 10px"
              borderRadius="3px"
              fontSize="12px"
              fontWeight="medium"
              backgroundColor={backgroundColor}
              color={color}
            >
              {linkText}
            </Link>
          );
        })}
        <Spacer />
        {hashTags?.includes('search') && (
          <InputGroup
            flex="0.35"
            marginX="10px"
            size="sm"
            borderColor="rgba(0,0,0,0.1)"
            backgroundColor={searchBackgroundColor}
          >
            <InputLeftElement
              pointerEvents="none"
              children={<SearchIcon color={color} />}
            />
            <Input placeholder="Search" />
          </InputGroup>
        )}
        <Avatar size={props.frame.height < 60 ? 'xs' : 'sm'} marginX="10px" />
      </Flex>
    );
  },
  [heroSymbol.symbolID]: (props) => {
    const { align, textAlign } = filterTextPropertyHashTags(props.blockText);
    const blockText = props.blockText
      ? props.blockText.split(/\r?\n/)
      : [
          'Create, iterate, inspire.',
          'Turn great ideas into new possibilities.',
          'Get started',
          'Learn more',
        ];

    let headline,
      subheadline,
      button,
      button2,
      defaultHeadlineSize = 'xl',
      defaultSubheadlineSize = 'md',
      defaultButtonSize = 'sm',
      defaultSpacing = 2;

    if (props.frame.width > 800 && props.frame.height > 370) {
      defaultHeadlineSize = '3xl';
      defaultSubheadlineSize = '2xl';
      defaultButtonSize = 'lg';
      defaultSpacing = 4;
    } else if (props.frame.width > 500 && props.frame.height > 270) {
      defaultHeadlineSize = '2xl';
      defaultSubheadlineSize = 'lg';
      defaultButtonSize = 'md';
      defaultSpacing = 3;
    }

    if (blockText[0]) {
      headline = filterTextPropertyHashTags(blockText[0]);
    }

    if (blockText[1]) {
      subheadline = filterTextPropertyHashTags(blockText[1]);
    }

    if (blockText[2]) {
      button = filterTextPropertyHashTags(blockText[2]);
    }

    if (blockText[3]) {
      button2 = filterTextPropertyHashTags(blockText[3]);
    }
    return (
      <Flex
        flexDirection="column"
        height="100%"
        justifyContent="center"
        paddingX={8}
      >
        <VStack align={align ?? 'center'} spacing={defaultSpacing}>
          {headline && (
            <Heading
              size={defaultHeadlineSize}
              color={headline.color}
              fontWeight={headline.fontWeight}
              fontSize={headline.fontSize}
              textAlign={textAlign ?? 'center'}
            >
              {headline.content}
            </Heading>
          )}
          {subheadline && (
            <Text
              color={subheadline.color}
              fontWeight={subheadline.fontWeight}
              fontSize={defaultSubheadlineSize ?? subheadline.fontSize}
              textAlign={textAlign ?? 'center'}
            >
              {subheadline.content}
            </Text>
          )}
          <HStack
            paddingTop={defaultSpacing * 2}
            spacing={4}
            justifyContent={align}
          >
            {button && (
              <Button
                size={defaultButtonSize}
                colorScheme={button.colorScheme ?? 'green'}
                fontWeight={button.fontWeight}
                fontSize={button.fontSize}
                alignSelf="flex-start"
              >
                {button.content}
              </Button>
            )}
            {button2 && (
              <Button
                size={defaultButtonSize}
                colorScheme={button2.colorScheme}
                fontWeight={button2.fontWeight}
                fontSize={button2.fontSize}
                alignSelf="flex-start"
              >
                {button2.content}
              </Button>
            )}
          </HStack>
        </VStack>
      </Flex>
    );
  },
};

function SymbolRenderer({
  frame,
  symbolId,
  blockText,
  resolvedBlockData,
}: { symbolId: string } & BlockProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
      }}
    >
      {symbolIdToElement[symbolId]({
        symbolId,
        frame,
        blockText,
        resolvedBlockData,
      })}
    </div>
  );
}

function DOMRendererContent({
  size,
  resizeBehavior,
  padding = 0,
}: {
  size: Size;
  resizeBehavior: ResizeBehavior;
  padding?: number;
}): JSX.Element {
  const [state] = useApplicationState();
  const { canvasInsets } = useWorkspace();
  const page = Selectors.getCurrentPage(state);
  const artboard = page.layers[0] as Sketch.Artboard;
  const rect = Selectors.getBoundingRect(page, [artboard.do_objectID])!;

  const containerTransform = createResizeTransform(artboard.frame, size, {
    scalingMode: 'down',
    resizePosition: 'top',
    padding,
  });
  const canvasTransform = Selectors.getCanvasTransform(state, canvasInsets);
  const transform =
    resizeBehavior === 'match-canvas' ? canvasTransform : containerTransform;

  const paddedRect = transformRect(rect, transform);

  return (
    <ChakraProvider>
      <div
        style={{
          position: 'absolute',
          width: paddedRect.width,
          height: paddedRect.height,
          left: paddedRect.x,
          top: paddedRect.y,
          outline: '1px solid #e0e0e0',
        }}
      />
      <div
        style={{
          position: 'absolute',
          transform: transform.toString(),
          transformOrigin: 'top left',
          background: 'white',
          width: rect.width,
          height: rect.height,
        }}
      >
        {artboard.layers.filter(Layers.isSymbolInstance).map((layer) => (
          <SymbolRenderer
            key={layer.do_objectID}
            frame={layer.frame}
            symbolId={layer.symbolID}
            blockText={layer.blockText}
            resolvedBlockData={layer.resolvedBlockData}
          />
        ))}
        {state.interactionState.type === 'drawing' && (
          <SymbolRenderer
            key="drawing"
            frame={createRect(
              state.interactionState.origin,
              state.interactionState.current,
            )}
            symbolId={
              typeof state.interactionState.shapeType === 'string'
                ? buttonSymbol.symbolID
                : state.interactionState.shapeType.symbolId
            }
          />
        )}
      </div>
    </ChakraProvider>
  );
}

type ResizeBehavior = 'match-canvas' | 'fit-container';

export function DOMRenderer(
  props: Omit<ComponentProps<typeof DOMRendererContent>, 'size'>,
): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useSize(containerRef);

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }}>
        {size && <DOMRendererContent size={size} {...props} />}
      </div>
    </div>
  );
}
