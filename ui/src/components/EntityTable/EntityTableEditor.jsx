import React, { Component } from 'react';
// import c from 'classnames';
import { compose } from 'redux';
import { withRouter } from 'react-router';

class EntityTableEditor extends Component {
  render() {
    const { entities, isPending, location, sort } = this.props;
    const { hideCollection = false, documentMode = false, showPreview = true } = this.props;
    const { updateSelection, selection } = this.props;
    const { field: sortedField, direction } = sort;

    const skeletonItems = [...Array(15).keys()];

    console.log('rendering editor');

    return null;
  }
}

export default compose(
  withRouter,
)(EntityTableEditor);
