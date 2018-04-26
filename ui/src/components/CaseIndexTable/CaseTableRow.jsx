import React, { Component } from 'react';
import queryString from 'query-string';

import { Date } from 'src/components/common';


class EntityTableRow extends Component {
  constructor(props) {
    super(props);
    this.onRowClickHandler = this.onRowClickHandler.bind(this);
  }

  onRowClickHandler(event) {
    event.preventDefault();
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { casefile, className, location: loc } = this.props;
    const parsedHash = queryString.parse(loc.hash);

    let rowClassName = (className) ? `${className} nowrap` : 'nowrap';

    return (
      <tr className={rowClassName} onClick={this.onRowClickHandler}>
        <td className="entity">
          NAME
        </td>
        <td className="schema">
          SUMMARY
        </td>
        <td className="date">
          emina@occrp.orh
        </td>
        {/*<td className="date">
          <Date.Earliest values={casefile.date} />
        </td>*/}
      </tr>
    );
  }
}

export default EntityTableRow;
