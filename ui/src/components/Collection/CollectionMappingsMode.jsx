import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { queryCollectionMappings } from 'queries';
import getEntityLink from 'util/getEntityLink';
import DocumentSelectDialog from 'dialogs/DocumentSelectDialog/DocumentSelectDialog';
import { DialogToggleButton } from 'components/Toolbar';
import MappingIndex from 'components/MappingIndex/MappingIndex';

const messages = defineMessages({
  create: {
    id: 'mappings.create',
    defaultMessage: 'Create a new entity mapping',
  },
});

class CollectionMappingsMode extends React.Component {
  onDocSelected = (doc) => {
    const { history } = this.props;
    const pathname = getEntityLink(doc);
    if (pathname) {
      history.push({ pathname, hash: queryString.stringify({ mode: 'mapping' }) });
    }
  }

  render() {
    const { collection, intl, query } = this.props;

    return (
      <div>
        {collection.writeable && (
          <div style={{ marginBottom: '20px' }}>
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.create),
                icon: "new-object",
                intent: Intent.PRIMARY
              }}
              Dialog={DocumentSelectDialog}
              dialogProps={{
                title: intl.formatMessage(messages.create),
                collection,
                onSelect: this.onDocSelected
              }}
            />
          </div>
        )}
        <MappingIndex query={query} />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  return {
    query: queryCollectionMappings(location, collection.id),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionMappingsMode);
