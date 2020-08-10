import React, { Component } from 'react';
import { Classes, Dialog } from '@blueprintjs/core';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Entity, Schema } from 'components/common';
import { queryEntitySuggest } from 'queries';
import { queryEntities } from 'actions';
import getCollectionLink from 'util/getCollectionLink';


import './DocumentSelectDialog.scss';


const messages = defineMessages({
  title: {
    id: 'entity.manager.bulk_import.title',
    defaultMessage: 'Bulk import',
  },
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
      query: ''
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
    const query = queryEntitySuggest(location, collection, "Table", queryText);
    this.props.queryEntities({ query });

    this.setState({ query });
  }

  render() {
    const { collection, intl, schema, toggleDialog, isOpen, onSelect } = this.props;
    const { query } = this.state;

    return (
      <Dialog
        icon="import"
        className="DocumentSelectDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <div className={Classes.DIALOG_BODY}>
          <p>
            <FormattedMessage
              id='entity.manager.bulk_import.description.1'
              defaultMessage={
                `Select a table below from which to import new {schema} entities.`
              }
              values={{ schema: <strong><Schema.Label schema={schema} /></strong> }}
            />
          </p>
          <p>
            <FormattedMessage
              id='entity.manager.bulk_import.description.2'
              defaultMessage={
                `Once selected, you will be prompted to assign columns from that table to properties of the generated entities.`
              }
            />
          </p>

          <Entity.Select
            query={query}
            onQueryChange={this.onQueryChange}
            onSelect={onSelect}
            noResultsText={intl.formatMessage(messages.no_results)}
            buttonProps={{ placeholder: intl.formatMessage(messages.placeholder)}}
          />
          <div className="bp3-form-helper-text">
            <FormattedMessage
              id='entity.manager.bulk_import.description.3'
              defaultMessage={
                `Don't see the table you're looking for? {link}`
              }
              values={{
                 link: (
                  <Link to={`${getCollectionLink(collection)}#mode=documents`}>
                    <FormattedMessage
                      id='entity.manager.bulk_import.link_text'
                      defaultMessage={
                        `Import a new table`
                      }
                    />
                  </Link>
                 )
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
  injectIntl,
)(DocumentSelectDialog);
