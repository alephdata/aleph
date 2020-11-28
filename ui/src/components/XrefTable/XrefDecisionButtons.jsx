import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';

import { pairwiseJudgement } from 'actions';
import { showWarningToast } from 'app/toast';


class XrefDecisionButtons extends Component {
  constructor(props) {
    super(props);
    this.state = { blocking: false };
  }

  async onDecide(judgement) {
    const { xref } = this.props;
    xref.judgement = xref.judgement === judgement ? 'no_judgement' : judgement;
    this.setState({ blocking: true });
    try {
      await this.props.pairwiseJudgement(xref);
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
          intent={xref.judgement === 'positive' ? Intent.SUCCESS : Intent.NONE}
          active={xref.judgement === 'positive'}
          onClick={(e) => this.onDecide('positive')} />
        <Button icon="help"
          disabled={blocking}
          active={xref.judgement === 'unsure'}
          onClick={(e) => this.onDecide('unsure')} />
        <Button icon="cross"
          disabled={blocking}
          intent={xref.judgement === 'negative' ? Intent.DANGER : Intent.NONE}
          active={xref.judgement === 'negative'}
          onClick={(e) => this.onDecide('negative')} />
      </ButtonGroup>
    );
  }
}

XrefDecisionButtons = connect(null, { pairwiseJudgement })(XrefDecisionButtons);
export default injectIntl(XrefDecisionButtons);
