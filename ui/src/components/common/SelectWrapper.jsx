import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { isLangRtl } from '@alephdata/react-ftm';
import { Position } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { selectLocale } from 'src/selectors';

const SelectWrapper = ({locale, ...rest}) => (
  <Select
    {...rest}
    popoverProps={{
      ...rest.popoverProps,
      position: isLangRtl(locale) ? Position.BOTTOM_RIGHT : Position.BOTTOM_LEFT,
   }} 
  />
);

const mapStateToProps = state => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(SelectWrapper);
