import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';

import { decideCollectionXref } from 'actions';
import { showWarningToast } from 'app/toast';


class XrefDecisionButtons extends Component {
  constructor(props) {
    super(props);
    this.state = { blocking: false };
  }

  async onDecide(decision) {
    const { xref } = this.props;
    const data = { ...xref, decision: decision };
    this.setState({ blocking: true });
    try {
      await this.props.decideCollectionXref(data);
    } catch (e) {
      showWarningToast(e.message);
    }
    this.setState({ blocking: false });
  }

  render() {
    const { xref } = this.props;
    const { blocking } = this.state;

    if (!xref.writeable) {
      return null;
    }
    return (
      <ButtonGroup className="XrefDecisionButtons" vertical>
        <Button icon="tick"
          disabled={blocking}
          intent={xref.decision === 'positive' ? Intent.SUCCESS : Intent.NONE}
          active={xref.decision === 'positive'}
          onClick={(e) => this.onDecide('positive')} />
        <Button icon="help"
          disabled={blocking}
          active={xref.decision === 'unsure'}
          onClick={(e) => this.onDecide('unsure')} />
        <Button icon="cross"
          disabled={blocking}
          intent={xref.decision === 'negative' ? Intent.DANGER : Intent.NONE}
          active={xref.decision === 'negative'}
          onClick={(e) => this.onDecide('negative')} />
      </ButtonGroup>
    );
  }
}

XrefDecisionButtons = connect(null, { decideCollectionXref })(XrefDecisionButtons);
export default injectIntl(XrefDecisionButtons);
