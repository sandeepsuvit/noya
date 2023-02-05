import { SearchIcon } from '@chakra-ui/icons';
import {
  Avatar,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Spacer,
} from '@chakra-ui/react';
import { BlockDefinition } from 'noya-state';
import React from 'react';
import { parseBlock } from '../parse';
import { accentColor } from './blockTheme';
import { isWithinRectRange } from './score';
import { headerBarSymbol, headerBarSymbolId } from './symbols';
import { getBlockClassName } from './tailwind';

const placeholderText = `*Home, Projects, Team, FAQ`;

const globalHashtags = ['dark', 'accent', 'search', 'title'];

function getColors({ dark, accent }: { dark: boolean; accent: boolean }) {
  const permutation = `${dark ? 'dark' : 'light'}${
    accent ? '-accent' : ''
  }` as const;

  switch (permutation) {
    case 'dark':
      return {
        backgroundColor: 'rgba(11,21,48,0.9)',
        borderBottomColor: 'transparent',
        searchBackgroundColor: 'rgba(0,0,0,0.2)',
        color: '#fff',
        activeLinkBackgroundColor: 'rgba(255,255,255,0.1)',
      };
    case 'light':
      return {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderBottomColor: '#eee',
        searchBackgroundColor: 'rgba(0,0,0,0.02)',
        color: '#000',
        activeLinkBackgroundColor: 'rgba(0,0,0,0.1)',
      };
    case 'dark-accent':
      return {
        backgroundColor: accentColor[800],
        borderBottomColor: 'transparent',
        searchBackgroundColor: 'rgba(0,0,0,0.2)',
        color: '#fff',
        activeLinkBackgroundColor: 'rgba(255,255,255,0.1)',
      };
    case 'light-accent':
      return {
        backgroundColor: accentColor[50],
        borderBottomColor: 'rgba(0,0,0,0.05)',
        searchBackgroundColor: 'rgba(0,0,0,0.02)',
        color: 'rgba(0,0,0,0.8)',
        activeLinkBackgroundColor: accentColor[100],
      };
  }
}

export const HeaderBarBlock: BlockDefinition = {
  id: headerBarSymbolId,
  globalHashtags,
  placeholderText,
  infer: ({ frame, blockText, siblingBlocks }) => {
    if (
      siblingBlocks.find((block) => block.symbolId === headerBarSymbol.symbolID)
    ) {
      return 0;
    }

    return Math.max(
      isWithinRectRange(frame, 400, 30, 2000, 100) &&
        frame.x < 30 &&
        frame.y < 30
        ? 1
        : 0,
      0.1,
    );
  },
  render: (props) => {
    const {
      items,
      globalParameters: { dark, title, accent, search, ...globalParameters },
    } = parseBlock(props.blockText, 'commaSeparated', {
      placeholder: placeholderText,
    });

    const hashTags = Object.keys(globalParameters);
    const hasActiveItem = items.some((item) => item.parameters.active);

    const {
      backgroundColor,
      borderBottomColor,
      searchBackgroundColor,
      color,
      activeLinkBackgroundColor,
    } = getColors({ dark: !!dark, accent: !!accent });

    const hasTailwindBackground = hashTags.some((value) =>
      value.startsWith('bg-'),
    );
    const hasTailwindColor = hashTags.some((value) =>
      value.startsWith('text-'),
    );
    const hasTailwindBorder = hashTags.some((value) =>
      value.startsWith('border-'),
    );

    return (
      <Flex
        alignItems="center"
        borderBottomWidth={hasTailwindBorder ? undefined : 1}
        borderBottomColor={hasTailwindBorder ? undefined : borderBottomColor}
        height={`${props.frame.height}px`}
        paddingX="5px"
        backgroundColor={hasTailwindBackground ? undefined : backgroundColor}
        backdropFilter="auto"
        backdropBlur="10px"
        overflow="hidden"
        className={getBlockClassName(hashTags)}
      >
        {items.map(({ content, parameters: { active, ...rest } }, index) => {
          const className = getBlockClassName(Object.keys(rest));

          let backgroundColor = 'transparent';

          if (active || (!hasActiveItem && index === 0)) {
            backgroundColor = activeLinkBackgroundColor;
          }

          if (title && index === 0) {
            return (
              <Heading
                color={hasTailwindColor ? undefined : color}
                fontWeight="semibold"
                size="sm"
                margin="0 18px 0 15px"
                className={className}
              >
                {content}
              </Heading>
            );
          }

          return (
            <Link
              marginX="5px"
              padding="8px 14px"
              borderRadius="3px"
              fontSize="12px"
              fontWeight="medium"
              backgroundColor={backgroundColor}
              color={hasTailwindColor ? undefined : color}
              className={className}
            >
              {content}
            </Link>
          );
        })}
        <Spacer />
        {search && (
          <InputGroup
            flex="0.35"
            marginX="10px"
            size="sm"
            borderColor="rgba(0,0,0,0.1)"
            backgroundColor={searchBackgroundColor}
          >
            <InputLeftElement
              pointerEvents="none"
              children={
                <SearchIcon
                  color={hasTailwindColor ? undefined : color}
                  opacity={0.8}
                />
              }
            />
            <Input
              placeholder="Search"
              _placeholder={{ color: 'rgba(0,0,0,0.3)' }}
            />
          </InputGroup>
        )}
        <Avatar size={props.frame.height < 60 ? 'xs' : 'sm'} marginX="10px" />
      </Flex>
    );
  },
};
