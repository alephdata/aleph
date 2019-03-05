import React, { PureComponent } from 'react';
import c from 'classnames';
import numeral from 'numeral';
import { FormattedNumber } from 'react-intl';

import './Count.scss';

class Count extends PureComponent {
  render() {
    const { count, noTag = false, full = false } = this.props;

    if (count === undefined || count === 0) {
      return null;
    }
    return (
      <span className={c({ 'bp3-tag': !noTag }, 'bp3-round', 'bp3-intent-primary', 'count')}>
        {full ? <FormattedNumber value={count} /> : numeral(count).format('0a')}
      </span>
    );
  }
}

export default Count;
