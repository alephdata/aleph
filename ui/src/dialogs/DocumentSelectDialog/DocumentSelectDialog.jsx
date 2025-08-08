import React, { Component } from 'react';
import { Classes, Dialog } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from '/src/app/withRouter.jsx';
import { Entity, Schema } from '/src/components/common/index.jsx';
import { entitySuggestQuery } from '/src/queries.js';
import { queryEntities } from '/src/actions/index.js';
import CollectionView from '/src/components/Collection/CollectionView';
import collectionViewIds from '/src/components/Collection/collectionViewIds';

import './DocumentSelectDialog.scss';

const messages = defineMessages({
  no_results: {
    id: 'entity.manager.bulk_import.no_results',
    defaultMessage: 'No matching documents found',
  },
  placeholder: {
    id: 'entity.manager.bulk_import.placeholder',
    defaultMessage: 'Select a table document',
  },
});

class DocumentSelectDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      query: '',
    };
    this.onQueryChange = this.onQueryChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.onQueryChange();
    }
  }

  onQueryChange(queryText) {
    const { collection, location } = this.props;
    const query = entitySuggestQuery(location, collection, 'Table', {
      q: queryText,
    });
    this.props.queryEntities({ query });

    this.setState({ query });
  }

  render() {
    const { collection, intl, schema, title, toggleDialog, isOpen, onSelect } =
      this.props;
    const { query } = this.state;

    return (
      <Dialog
        className="DocumentSelectDialog"
        isOpen={isOpen}
        title={title}
        onClose={toggleDialog}
        enforceFocus={false}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>
            <FormattedMessage
              id="entity.manager.bulk_import.description.1"
              defaultMessage={`Select a table below from which to import new {schema} entities.`}
              values={{
                schema: schema && (
                  <strong>
                    <Schema.Label schema={schema} />
                  </strong>
                ),
              }}
            />
          </p>
          <p>
            <FormattedMessage
              id="entity.manager.bulk_import.description.2"
              defaultMessage={`Once selected, you will be prompted to assign columns from that table to properties of the generated entities.`}
            />
          </p>

          <Entity.Select
            query={query}
            onQueryChange={this.onQueryChange}
            onSelect={onSelect}
            noResultsText={intl.formatMessage(messages.no_results)}
            buttonProps={{
              placeholder: intl.formatMessage(messages.placeholder),
            }}
          />
          <div className={Classes.FORM_HELPER_TEXT}>
            <FormattedMessage
              id="entity.manager.bulk_import.description.3"
              defaultMessage={`Don't see the table you're looking for? {link}`}
              values={{
                link: (
                  <CollectionView.Link
                    collection={collection}
                    id={collectionViewIds.DOCUMENTS}
                  >
                    <FormattedMessage
                      id="entity.manager.bulk_import.link_text"
                      defaultMessage={`Upload a new table document`}
                    />
                  </CollectionView.Link>
                ),
              }}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = () => ({});

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl
)(DocumentSelectDialog);
