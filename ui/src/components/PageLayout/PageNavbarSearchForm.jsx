import React, { PureComponent } from 'react';
import { withRouter } from 'react-router';
import queryString from 'query-string';

class PageNavbarSearchForm extends PureComponent {
  constructor() {
    super();
    this.state = {value: ''};

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange({ target }) {
    this.setState({value: target.value})
  }

  onSubmit(event) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: this.state.value
      })
    })
    this.setState({value: ''})
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <input className="pt-input"
               type="text"
               onChange={this.onChange}
               value={this.state.value} />
      </form>
    );
  }
}

export default withRouter(PageNavbarSearchForm);
