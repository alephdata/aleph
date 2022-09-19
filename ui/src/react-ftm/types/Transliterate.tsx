import React from 'react';
import { Classes } from '@blueprintjs/core';
import {
  Tooltip2 as Tooltip,
  Classes as TooltipClasses,
} from '@blueprintjs/popover2';
import truncateText from 'truncate';
import c from 'classnames';

import './Transliterate.scss';

interface ITransliterateProps {
  value: string;
  lookup?: any;
  truncate?: number;
}

class Transliterate extends React.PureComponent<ITransliterateProps> {
  constructor(props: ITransliterateProps) {
    super(props);

    this.copyText = this.copyText.bind(this);
  }
  onOpen = () => {
    document.addEventListener('copy', this.copyText);
  };

  onClose = () => {
    document.removeEventListener('copy', this.copyText);
  };

  copyText = (e: any) => {
    e.clipboardData.setData('text/plain', this.getTranslitValue());
    e.preventDefault();
  };

  getTranslitValue() {
    const { lookup, value } = this.props;
    return lookup[value];
  }

  render() {
    const { lookup, value, truncate } = this.props;
    if (!lookup || !lookup[value]) {
      return truncate ? truncateText(value, truncate) : value;
    }
    const symbol = navigator.userAgent.indexOf('Mac OS X') != -1 ? '⌘' : 'Ctl';

    return (
      <>
        <Tooltip
          popoverClassName={c(
            'Transliterate__popover',
            Classes.MINIMAL,
            Classes.SMALL
          )}
          onOpening={this.onOpen}
          onClosing={this.onClose}
          content={
            <>
              <span className="Transliterate__popover__main">
                {this.getTranslitValue()}
              </span>
              <span className="Transliterate__popover__secondary">
                <code>{symbol}</code>+<code>C</code> to copy
              </span>
            </>
          }
        >
          <span
            className={c('Transliterate', TooltipClasses.TOOLTIP2_INDICATOR)}
          >
            {truncate ? truncateText(value, truncate) : value}
          </span>
        </Tooltip>
      </>
    );
  }
}

export default Transliterate;
