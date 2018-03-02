import React, { Component } from 'react';
import { InputGroup } from '@blueprintjs/core';


class SearchFilterText extends Component {
  constructor(props)  {
    super(props);
    this.state = {value: props.query ? props.query.getString('q') : null};
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange({target}) {
    this.setState({value: target.value});
  }

  onSubmit(event) {
    event.preventDefault();
    const newQuery = this.props.query.set('q', this.state.value);
    this.props.updateQuery(newQuery);
  }

  render() {
    const { children } = this.props;

    return (
      <form className="search-input"
            onSubmit={this.onSubmit}>
        <InputGroup type="search" leftIcon="search" className="pt-large"
            onChange={this.onChange} value={this.state.value}
            rightElement={children} />
      </form>
    )
  }
}

export default SearchFilterText;
