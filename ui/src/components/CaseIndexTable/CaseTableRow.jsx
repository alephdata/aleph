import React, {Component} from 'react';
import queryString from 'query-string';
import { connect } from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {Icon} from '@blueprintjs/core';
import { Link } from 'react-router-dom';

import {Date} from 'src/components/common';

import {deleteCollection} from 'src/actions';
import {showSuccessToast} from "../../app/toast";

class CaseTableRow extends Component {
  constructor(props) {
    super(props);
    
    this.onDeleteCase = this.onDeleteCase.bind(this);
  }

  async onDeleteCase(casefile) {
    try {
      this.props.deleteCollection(casefile);
      showSuccessToast('Success');
    } catch (e) {
      alert("eerror");
    }
  }

  render() {
    const {casefile, className, color} = this.props;

    let rowClassName = (className) ? `${className} nowrap` : 'nowrap';

    return (
      <tr key={casefile.id} className={rowClassName}>
        <td><Icon icon="square" iconSize={25} color={color} style={{backgroundColor: color, opacity: 0.6}}/></td>
        <td className="schema">
          <Link to={`/cases/${casefile.id}`}>{casefile.label}</Link>
        </td>
        <td className="schema">
          {casefile.summary}
        </td>
        <td className="schema">
        </td>
        <td className="date">
          <Date value={casefile.created_at}/>
        </td>
        <td><a onClick={(e) => this.onDeleteCase(casefile, e)}><FormattedMessage id="case.index.remove"
                                                                                 defaultMessage="Remove"/></a></td>
      </tr>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({

});

export default connect(mapStateToProps, {deleteCollection})(CaseTableRow);
