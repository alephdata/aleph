import React from 'react';
import numeral from 'numeral';
import CountUp from 'react-countup';
import { FormattedNumber, injectIntl, WrappedComponentProps } from 'react-intl';

import './Numeric.scss';

interface INumericProps extends WrappedComponentProps {
  num?: number;
  abbr?: boolean;
  animate?: boolean;
}

class Numeric extends React.PureComponent<INumericProps> {
  renderAnimated(number: number) {
    return (
      <CountUp className="AnimatedCount__count" end={number} separator="," />
    );
  }
  render() {
    const { num, abbr = false, animate = false } = this.props;

    if (num === undefined) {
      return null;
    }

    let content;
    if (abbr) {
      content = numeral(num).format('0a');
      if (animate) {
        const match = content.match(/(?<val>[0-9]+)(?<suffix>[a-z]?)/);
        if (match?.groups) {
          const { val, suffix } = match.groups;
          content = (
            <>
              {this.renderAnimated(+val)}
              {suffix}
            </>
          );
        }
      }
    } else {
      content = animate ? (
        this.renderAnimated(num)
      ) : (
        <FormattedNumber value={num} />
      );
    }

    return <span className="Numeric">{content}</span>;
  }
}

export default injectIntl(Numeric);
