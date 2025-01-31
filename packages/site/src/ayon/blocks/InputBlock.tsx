import { Input } from '@chakra-ui/react';
import { BlockDefinition } from 'noya-state';
import React from 'react';
import { parseBlock } from '../parse';
import { getBlockThemeColors } from './colors';
import { isWithinRectRange } from './score';
import { inputSymbolId } from './symbols';

const globalHashtags = ['dark', 'accent', 'disabled'];

const parser = 'regular';

export const InputBlock: BlockDefinition = {
  id: inputSymbolId,
  parser,
  hashtags: globalHashtags,
  infer: ({ frame, blockText }) =>
    isWithinRectRange(frame, 60, 25, 600, 80) ? 0.75 : 0,
  render: (props) => {
    const {
      content,
      parameters: { dark, accent, disabled },
    } = parseBlock(props.blockText, parser);

    const size =
      props.frame.height >= 45 ? 'lg' : props.frame.height >= 30 ? 'md' : 'sm';

    const { backgroundColor, color, borderColor } = getBlockThemeColors({
      dark,
      accent,
    });

    return (
      <Input
        value={content}
        size={size}
        backgroundColor={backgroundColor}
        color={color}
        borderColor={borderColor}
        isDisabled={!!disabled}
      />
    );
  },
};
