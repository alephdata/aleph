import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import Numeric from './Numeric';
import c from 'classnames';

import './Count.scss';

interface ICountProps extends WrappedComponentProps {
  count: number;
  full?: boolean;
  className?: string;
  isPending?: boolean;
  animate?: boolean;
}

class Count extends React.PureComponent<ICountProps> {
  render() {
    const { count, full = false, isPending, animate = false } = this.props;

    if (!isPending && count == null) {
      return null;
    }
    const showLoading = isPending && count == null;

    return (
      <span
        className={c(
          'Count',
          Classes.TAG,
          Classes.SMALL,
          Classes.MINIMAL,
          Classes.ROUND,
          showLoading && Classes.SKELETON
        )}
      >
        {showLoading && <span>--</span>}
        {!showLoading && <Numeric num={count} abbr={!full} animate={animate} />}
      </span>
    );
  }
}

export default injectIntl(Count);
