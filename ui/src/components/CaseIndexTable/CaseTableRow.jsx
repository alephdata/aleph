import React, {Component} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {Icon, Alert} from '@blueprintjs/core';
import {Link} from 'react-router-dom';

import {Date} from 'src/components/common';

import {deleteCollection} from 'src/actions';

class CaseTableRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAlertOpen: false,
      color: ''
    };

    this.onDeleteCase = this.onDeleteCase.bind(this);
    this.onOpenAlert = this.onOpenAlert.bind(this);
  }

  componentDidMount() {
    let color = this.getProperColor(this.props.colors, this.props.casefile.id);
    console.log('did', color, this.props.casefile.id);
  }

  async onDeleteCase(casefile) {
    this.props.deleteCase(casefile);
  }

  onOpenAlert() {
    this.setState({isAlertOpen: !this.state.isAlertOpen});
  }

  getProperColor(colors, casefileId) {
    colors.map(function (color, index) {
      if(color[casefileId] !== undefined) {
        console.log('uslo', color[casefileId])
        return color[casefileId];
      }
    });

    console.log('nee')
    return null;
  }

  render() {
    const {casefile, colors} = this.props;
    //let color = this.getProperColor(colors, casefile.id);
    //console.log(color)
    let color = 'white';

    return (
      <tr key={casefile.id + 1} className='nowrap'>
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
        <td>
          <a onClick={(e) => this.onDeleteCase(casefile, e)}>
            <FormattedMessage id="case.index.remove" defaultMessage="Remove"/>
          </a>
        </td>
      </tr>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({});

export default connect(mapStateToProps, {deleteCollection})(CaseTableRow);
