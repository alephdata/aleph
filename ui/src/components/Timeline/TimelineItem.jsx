import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Divider } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { Count, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getEntityLink from 'util/getEntityLink';

import './TimelineItem.scss';


const messages = defineMessages({
  // search_placeholder: {
  //   id: 'entity.manager.search_placeholder',
  //   defaultMessage: 'Search {schema}',
  // },
  // empty: {
  //   id: 'timeline.empty',
  //   defaultMessage: 'This timeline is empty',
  // }
});

class TimelineItem extends Component {
  render() {
    const { item } = this.props;

    return (
      <div className="TimelineItem">
        Item
      </div>
    );
  }
}

export default TimelineItem;
