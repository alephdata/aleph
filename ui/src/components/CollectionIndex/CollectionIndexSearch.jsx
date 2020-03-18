import React, { Component } from 'react';
import { ControlGroup, InputGroup } from '@blueprintjs/core';

import './CollectionIndexSearch.scss';

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
    const { placeholder } = this.props;
    const { queryText } = this.state;
    return (
      <ControlGroup fill className="CollectionIndexSearch">
        <form onSubmit={this.onSubmit} className="CollectionIndexSearch">
          <InputGroup
            large
            fill
            autoFocus
            leftIcon="search"
            onChange={this.onChangeQueryPrefix}
            placeholder={placeholder}
            value={queryText}
          />
        </form>
      </ControlGroup>
    );
  }
}

export default CollectionIndexSearch;
