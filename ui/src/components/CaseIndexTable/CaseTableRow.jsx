import React, {Component} from 'react';
import queryString from 'query-string';
import {FormattedMessage} from 'react-intl';
import {Icon} from '@blueprintjs/core';

import {Date} from 'src/components/common';


class CaseTableRow extends Component {
  constructor(props) {
    super(props);
    this.onRowClickHandler = this.onRowClickHandler.bind(this);
    this.onDeleteRole = this.onDeleteRole.bind(this);
  }

  onDeleteRole() {

  }

  onRowClickHandler(event) {
    event.preventDefault();
    const {history, location} = this.props;
    const parsedHash = queryString.parse(location.hash);

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {casefile, className, color} = this.props;

    let rowClassName = (className) ? `${className} nowrap` : 'nowrap';

    return (
      <tr className={rowClassName} onClick={this.onRowClickHandler}>
        <td><Icon icon="square" iconSize={25} color={color} style={{backgroundColor: color, opacity: 0.6}}/></td>
        <td className="schema">
          {casefile.label}
        </td>
        <td className="schema">
          {casefile.summary}
        </td>
        <td className="schema">
        </td>
        <td className="date">
          <Date value={casefile.created_at}/>
        </td>
        <td><a onClick={(e) => this.onDeleteRole(casefile, e)}><FormattedMessage id="case.index.remove"
                                                                                 defaultMessage="Remove"/></a></td>
      </tr>
    );
  }
}

export default CaseTableRow;
