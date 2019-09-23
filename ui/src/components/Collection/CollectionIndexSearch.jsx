import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { ControlGroup, InputGroup } from '@blueprintjs/core';

import './CollectionIndexSearch.scss';

const messages = defineMessages({
  placeholder: {
    id: 'collection.index.placeholder',
    defaultMessage: 'Search datasets...',
  },
});

export class CollectionIndexSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      queryText: props.query.getString('q'),
    };
    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
  }

  onChangeQueryPrefix({ target }) {
    this.setState({ queryText: target.value });
  }

  onSubmit(event) {
    event.preventDefault();
    const { queryText } = this.state;
    const query = this.props.query.set('q', queryText);
    this.props.updateQuery(query);
  }

  toggleCreateCase() {
    this.setState(({ createIsOpen }) => ({ createIsOpen: !createIsOpen }));
  }

  render() {
    const { intl } = this.props;
    const { queryText } = this.state;
    return (
      <form onSubmit={this.onSubmit} className="CollectionIndexSearch">
        <ControlGroup fill>
          <InputGroup
            large
            fill
            autoFocus
            leftIcon="search"
            onChange={this.onChangeQueryPrefix}
            placeholder={intl.formatMessage(messages.placeholder)}
            value={queryText}
          />
        </ControlGroup>
      </form>
    );
  }
}

export default injectIntl(CollectionIndexSearch);
