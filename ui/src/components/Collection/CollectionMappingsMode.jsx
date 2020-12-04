import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
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

import './CollectionMappingsMode.scss';

const messages = defineMessages({
  create: {
    id: 'collection.mappings.create',
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
      <div className="CollectionMappingsMode">
        <div className="CollectionMappingsMode__description">
          <p>
            <FormattedMessage
              id="collection.mappings.create_description"
              defaultMessage="Entity mappings allow you to bulk generate structured Follow the Money entities (like People, Companies, and the relationships among them) from rows in a spreadsheet or CSV document."
            />
          </p>
          <p>
            <FormattedMessage
              id="collection.mappings.create_docs_link"
              defaultMessage="For more information, please refer to the {link}"
              values={{
                link: (
                  <a
                    href="https://docs.alephdata.org/developers/mappings"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FormattedMessage
                      id="mapping.infoLink"
                      defaultMessage="Aleph entity mapping documentation"
                    />
                  </a>
                ),
              }}
            />
          </p>
        </div>

        {collection.writeable && (
          <div className="CollectionMappingsMode__actions">
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
        <div className="CollectionMappingsMode__items">
          <MappingIndex query={query} />
        </div>
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
