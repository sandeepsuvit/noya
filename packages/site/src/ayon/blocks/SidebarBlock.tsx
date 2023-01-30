import { Link, VStack } from '@chakra-ui/react';
import { BlockDefinition } from 'noya-state';
import React from 'react';
import { filterHashTagsAndSlashCommands } from '../parse';
import { isWithinRectRange, scoreCommandMatch } from './score';
import { sidebarSymbol, sidebarSymbolId } from './symbols';

export const SidebarBlock: BlockDefinition = {
  id: sidebarSymbolId,
  infer: ({ frame, blockText, siblingBlocks }) => {
    if (
      siblingBlocks.find((block) => block.symbolId === sidebarSymbol.symbolID)
    ) {
      return 0;
    }

    return Math.max(
      scoreCommandMatch(sidebarSymbol.name, blockText),
      isWithinRectRange(frame, 200, 400, 360, 2000) ? 1 : 0,
      0.1,
    );
  },
  render: (props) => {
    const { hashTags } = filterHashTagsAndSlashCommands(props.blockText);
    const backgroundColor = hashTags?.includes('dark')
      ? 'rgba(11,21,48,0.85)'
      : 'rgba(240,240,240,0.85)';
    const color = hashTags?.includes('dark') ? '#fff' : '#000';
    let links = props.blockText
      ?.split(/\r?\n/)
      .map((link) => filterHashTagsAndSlashCommands(link).content.trim());
    if (!links || links.join('') === '') {
      links = ['*Dashboard', 'Updates', 'Billing', 'Settings'];
    }
    if (links.filter((link) => link[0] === '*').length === 0) {
      links[0] = `*${links[0]}`;
    }
    return (
      <VStack
        alignItems="left"
        height={`${props.frame.height}px`}
        spacing="5px"
        paddingY="10px"
        paddingX="10px"
        backgroundColor={backgroundColor}
        backdropFilter="auto"
        backdropBlur="10px"
      >
        {links.map((link, index) => {
          let backgroundColor = 'transparent';
          let fontWeight = 'normal';
          if (link[0] === '*') {
            backgroundColor = hashTags?.includes('dark')
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(0,0,0,0.1)';
            fontWeight = 'medium';
          }
          const [, linkText] = /^\*?(.*)/.exec(link) || [];
          return (
            <Link
              padding="8px 10px"
              borderRadius="3px"
              fontSize="12px"
              fontWeight={fontWeight}
              backgroundColor={backgroundColor}
              color={color}
            >
              {linkText}
            </Link>
          );
        })}
      </VStack>
    );
  },
};
