import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';

import { decideCollectionXref } from 'src/actions';
import { showWarningToast } from 'src/app/toast';


class XrefDecisionButtons extends Component {
  constructor(props) {
    super(props);
    this.state = { blocking: false };
  }

  async onDecide(decision) {
    const { xref, contextId } = this.props;
    const data = { ...xref, decision: decision };
    this.setState({ blocking: true });
    try {
      await this.props.decideCollectionXref(data, contextId);
    } catch (e) {
      showWarningToast(e.message);
    }
    this.setState({ blocking: false });
  }

  render() {
    const { xref, contextId } = this.props;
    const { blocking } = this.state;

    if (!contextId) {
      return null;
    }
    return (
      <ButtonGroup className="XrefDecisionButtons" vertical>
        <Button icon="tick"
                disabled={blocking}
                intent={xref.decision === true ? Intent.SUCCESS : Intent.NONE}
                active={xref.decision === true}
                onClick={(e) => this.onDecide(true)} />
        <Button icon="help"
                disabled={blocking}
                active={xref.decision === undefined}
                onClick={(e) => this.onDecide(undefined)} />
        <Button icon="cross"
                disabled={blocking}
                intent={xref.decision === false ? Intent.DANGER : Intent.NONE}
                active={xref.decision === false}
                onClick={(e) => this.onDecide(false)} />
      </ButtonGroup>
    );
  }
}

XrefDecisionButtons = connect(null, { decideCollectionXref })(XrefDecisionButtons);
export default injectIntl(XrefDecisionButtons);
