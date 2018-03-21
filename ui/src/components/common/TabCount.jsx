import React, {Component} from 'react';
import { FormattedNumber } from 'react-intl';

class TabCount extends Component {
  render() {
    const { count } = this.props;

    if (count === undefined || count === 0) {
      return null;
    }

    return (
      <span className="pt-tag pt-round pt-intent-primary">
        <FormattedNumber value={count} />
      </span>
    );
  }
}

export default TabCount;
