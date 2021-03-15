import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import _ from 'lodash';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { EdgeCreateDialog, TableEditor } from '@alephdata/react-ftm';

import { Count, ErrorSection, QueryInfiniteLoad } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import EntityActionBar from 'components/Entity/EntityActionBar';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import { queryEntities } from 'actions';
import { selectModel } from 'selectors';
import { showErrorToast, showSuccessToast } from 'app/toast';
import getEntityLink from 'util/getEntityLink';


const messages = defineMessages({
  search_placeholder: {
    id: 'entity.manager.search_placeholder',
    defaultMessage: 'Search {schema}',
  },
  empty: {
    id: 'entity.manager.search_empty',
    defaultMessage: 'No matching {schema} results found',
  },
  edge_create_success: {
    id: 'entity.manager.edge_create_success',
    defaultMessage: 'Successfully linked {source} and {target}',
  },
  add_to_success: {
    id: 'entity.manager.entity_set_add_success',
    defaultMessage: 'Successfully added {count} {count, plural, one {entity} other {entities}} to {entitySet}',
  },
  bulk_import: {
    id: 'entity.viewer.bulk_import',
    defaultMessage: 'Bulk import',
  },
  add_link: {
    id: 'entity.viewer.add_link',
    defaultMessage: 'Create link',
  },
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class TimelineActionBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
    };
    this.updateQuery = this.updateQuery.bind(this);
  }



  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  render() {
    const { createNewItem, query, writeable } = this.props;

    return (
      <ButtonGroup>
        <Button
          icon="add"
          onClick={createNewItem}
        >
          <FormattedMessage id="timeline.add_new" defaultMessage="Add a new event" />
        </Button>
      </ButtonGroup>
    );
  }
}
export default compose(
  withRouter,
  connect(null, { queryEntities }),
  injectIntl,
)(TimelineActionBar);
