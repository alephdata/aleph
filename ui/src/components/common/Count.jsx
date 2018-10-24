import React, { PureComponent } from 'react';
import numeral from 'numeral';



class Count extends PureComponent {
  render() {
    const { count } = this.props;

    if (count === undefined || count === 0) {
      return null;
    }
    return (
      <span className="pt-tag pt-round pt-intent-primary">
        {numeral(count).format('0a')}
      </span>
    );
  }
}

export default Count;
