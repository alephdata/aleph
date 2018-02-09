import React, { Component } from 'react';


class SearchFilterText extends Component {
  constructor(props)  {
    super(props);
    this.state = {value: props.query.getQ()};
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  // componentWillReceiveProps(nextProps) {
  //   this.setState({value: nextProps.query.getQ()});
  // }

  onChange({target}) {
    this.setState({value: target.value});
  }

  onSubmit(event) {
    event.preventDefault();
    const newQuery = this.props.query.setQ(this.state.value);
    this.props.updateQuery(newQuery);
  }

  render() {
    return (
      <form className="search-input pt-input-group pt-large"
            onSubmit={this.onSubmit}>
        <span className="pt-icon pt-icon-search"/>
        <input className="pt-input" type="search"
          onChange={this.onChange} value={this.state.value} />
      </form>
    )
  }
}

export default SearchFilterText;
