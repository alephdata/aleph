import React from 'react';
import { connect } from 'react-redux';
import { isLangRtl } from 'react-ftm';
import { Position } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';
import { selectLocale } from 'selectors';

const SelectWrapper = ({ locale, ...rest }) => (
  <Select
    {...rest}
    popoverProps={{
      ...rest.popoverProps,
      position: isLangRtl(locale)
        ? Position.BOTTOM_RIGHT
        : Position.BOTTOM_LEFT,
    }}
  />
);

const mapStateToProps = (state) => ({
  locale: selectLocale(state),
});

export default connect(mapStateToProps)(SelectWrapper);
