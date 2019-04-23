import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { ControlGroup, InputGroup, Button } from '@blueprintjs/core';

import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';

import './CollectionIndexSearch.scss';

const messages = defineMessages({
  place_casefiles: {
    id: 'collection.index.casefiles.placeholder',
    defaultMessage: 'Search case files used in investigations...',
  },
  place_sources: {
    id: 'collection.index.sources.placeholder',
    defaultMessage: 'Search curated data sources...',
  },
  create: {
    id: 'collection.index.search.create',
    defaultMessage: 'New case',
  },
});

export class CollectionIndexSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createIsOpen: false,
      queryPrefix: props.query.getString('prefix'),
    };
    this.onSubmit = this.onSubmit.bind(this);
    this.toggleCreateCase = this.toggleCreateCase.bind(this);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
  }

  onChangeQueryPrefix({ target }) {
    this.setState({ queryPrefix: target.value });
  }

  onSubmit(event) {
    event.preventDefault();
    const { queryPrefix } = this.state;
    const query = this.props.query.set('prefix', queryPrefix);
    this.props.updateQuery(query);
  }

  toggleCreateCase() {
    this.setState(({ createIsOpen }) => ({ createIsOpen: !createIsOpen }));
  }

  render() {
    const { intl, casefiles = false } = this.props;
    const { queryPrefix } = this.state;
    const placeholder = casefiles ? messages.place_casefiles : messages.place_sources;
    return (
      <form onSubmit={this.onSubmit} className="CollectionIndexSearch">
        <ControlGroup fill>
          <InputGroup
            large
            fill
            leftIcon="search"
            onChange={this.onChangeQueryPrefix}
            placeholder={intl.formatMessage(placeholder)}
            value={queryPrefix}
          />
          { casefiles && (
            <Button
              onClick={this.toggleCreateCase}
              large
              icon="plus"
              className="bp3-intent-primary"
              text={intl.formatMessage(messages.create)}
            />
          )}
        </ControlGroup>
        <CreateCaseDialog
          isOpen={this.state.createIsOpen}
          toggleDialog={this.toggleCreateCase}
        />
      </form>
    );
  }
}

export default injectIntl(CollectionIndexSearch);
