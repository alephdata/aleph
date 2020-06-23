import React, { Component } from 'react';
import { Classes, Dialog } from '@blueprintjs/core';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { Entity, Schema } from 'src/components/common';
import { queryExpand, queryEntitySuggest } from 'src/queries';
import { queryEntities } from 'src/actions';
import { showErrorToast, showSuccessToast } from 'src/app/toast';
import getEntityLink from 'src/util/getEntityLink';
import getCollectionLink from 'src/util/getCollectionLink';


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
    defaultMessage: 'Select a document',
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

  componentDidMount() {
    this.onQueryChange();
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
            inputProps={{ placeholder: intl.formatMessage(messages.placeholder)}}
          />
          <p>
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
          </p>
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
