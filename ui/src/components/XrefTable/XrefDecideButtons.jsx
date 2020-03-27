import React, { Component } from 'react';
import { injectIntl, FormattedNumber } from 'react-intl';
import Property from 'src/components/Property';
import { Button, ButtonGroup } from '@blueprintjs/core';
import {
  Collection, Entity, Skeleton,
} from 'src/components/common';

class XrefDecideButtons extends Component {
  
  render() {
    const { xref, contextId } = this.props;
    return (
      <ButtonGroup>
        <Button icon="" />
      </ButtonGroup>
    );
  }
}

export default injectIntl(XrefDecideButtons);
