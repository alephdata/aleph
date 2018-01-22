import React, { PureComponent } from 'react';

import { debounce } from 'lodash';


class SearchFilterText extends PureComponent {
  constructor(props)  {
    super(props);
    this.state = {value: props.query.getQ()};
    this.onChange = this.onChange.bind(this);
    this.updateQuery = debounce(this.updateQuery, 200);
  }

  updateQuery(value) {
    const query = this.props.query.setQ(value);
    this.props.updateQuery(query);
  }

  // componentWillReceiveProps(nextProps) {
  //   this.setState({value: nextProps.query.getQ()});
  // }

  onChange({target}) {
    this.setState({value: target.value});
    this.updateQuery(target.value);
  }

  render() {
    return (
      <div className="search-input pt-input-group pt-large">
        <span className="pt-icon pt-icon-search"/>
        <input className="pt-input" type="search"
          onChange={this.onChange} value={this.state.value} />    
      </div>
    )
  }
}

export default SearchFilterText;
