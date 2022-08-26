import * as React from 'react';
import { injectIntl, defineMessages, WrappedComponentProps } from 'react-intl';
import c from 'classnames';
import { Colors, Icon } from '@blueprintjs/core';
import {
  Tooltip2 as Tooltip,
  Popover2 as Popover,
} from '@blueprintjs/popover2';
import { HexColorPicker, HexColorInput } from 'react-colorful';

import './ColorPicker.scss';

const messages = defineMessages({
  blue: {
    id: 'editor.color_picker.blue',
    defaultMessage: 'Blue',
  },
  green: {
    id: 'editor.color_picker.green',
    defaultMessage: 'Green',
  },
  orange: {
    id: 'editor.color_picker.orange',
    defaultMessage: 'Orange',
  },
  red: {
    id: 'editor.color_picker.red',
    defaultMessage: 'Red',
  },
  violet: {
    id: 'editor.color_picker.violet',
    defaultMessage: 'Violet',
  },
  turquoise: {
    id: 'editor.color_picker.turquoise',
    defaultMessage: 'Turquoise',
  },
  custom: {
    id: 'editor.color_picker.custom',
    defaultMessage: 'Custom',
  },
});

const colorOptions = {
  blue: Colors.BLUE1,
  green: Colors.GREEN1,
  orange: Colors.ORANGE1,
  red: Colors.RED1,
  violet: Colors.VIOLET1,
  turquoise: Colors.TURQUOISE1,
};

interface IColorPickerProps extends WrappedComponentProps {
  currSelected?: string;
  onSelect: (color: string) => void;
  swatchShape?: string;
}

class ColorPicker extends React.PureComponent<IColorPickerProps> {
  constructor(props: IColorPickerProps) {
    super(props);

    this.renderColor = this.renderColor.bind(this);
  }

  renderColor(id: string, color: string | undefined, isCustom: boolean) {
    const { currSelected, onSelect, swatchShape, intl } = this.props;

    const style = {
      backgroundColor: color,
      borderColor: color,
    };

    return (
      <div
        key={color}
        className="ColorPicker__item"
        onClick={() => (isCustom || !color ? null : onSelect(color))}
      >
        <Tooltip content={intl.formatMessage(messages[id])} placement="top">
          <div
            className={c('ColorPicker__item__swatch', swatchShape, {
              active: currSelected === color,
              custom: isCustom,
            })}
            style={style}
          >
            {color && (
              <div className="ColorPicker__item__swatch__inner" style={style} />
            )}
            {isCustom && <Icon icon="plus" size={14} />}
          </div>
        </Tooltip>
      </div>
    );
  }

  render() {
    const { currSelected, onSelect } = this.props;
    const hasCustomColor =
      !!currSelected && Object.values(colorOptions).indexOf(currSelected) < 0;

    return (
      <div className="ColorPicker">
        {Object.entries(colorOptions).map(([id, color]) =>
          this.renderColor(id, color, false)
        )}
        <Popover
          content={
            <>
              <HexColorPicker color={currSelected} onChange={onSelect} />
              <HexColorInput
                color={currSelected}
                onChange={onSelect}
                className="ColorPicker__custom__hex-input"
                prefixed
              />
            </>
          }
          minimal
          popoverClassName="ColorPicker__custom"
        >
          {this.renderColor(
            'custom',
            hasCustomColor ? currSelected : undefined,
            true
          )}
        </Popover>
      </div>
    );
  }
}

export default injectIntl(ColorPicker);
