import React, { PureComponent } from 'react';
import { FormattedNumber } from 'react-intl';

export default class Score extends PureComponent {
  render() {
    const { score } = this.props;
    return (
      <FormattedNumber
        value={Number.parseInt(Number.parseFloat(score) * 100, 10)}
      />
    );
  }
}
