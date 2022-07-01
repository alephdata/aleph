import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import {
  AnchorButton,
  ButtonGroup,
  Classes,
  Intent,
  Position,
} from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import c from 'classnames';

import './JudgementButtons.scss';

const messages = defineMessages({
  disabled: {
    id: 'judgement.disabled',
    defaultMessage: 'You must have edit access in order to make judgements.',
  },
  positive: {
    id: 'judgement.positive',
    defaultMessage: 'Same',
  },
  negative: {
    id: 'judgement.negative',
    defaultMessage: 'Different',
  },
  unsure: {
    id: 'judgement.unsure',
    defaultMessage: 'Not enough information',
  },
});

class JudgementButtons extends Component {
  constructor(props) {
    super(props);
    this.state = { blocking: false };
  }

  async onChange(judgement) {
    const { obj, onChange } = this.props;
    obj.judgement = obj.judgement === judgement ? 'no_judgement' : judgement;
    this.setState({ blocking: true });
    onChange(obj);
    this.setState({ blocking: false });
  }

  render() {
    const { obj = {}, intl, isPending } = this.props;
    const { blocking } = this.state;
    const disabled = this.props.disabled || blocking || !obj.writeable;
    return (
      <Tooltip
        disabled={!disabled}
        content={intl.formatMessage(messages.disabled)}
      >
        <ButtonGroup
          className={c('JudgementButtons', { [Classes.SKELETON]: isPending })}
          vertical
        >
          <Tooltip
            content={intl.formatMessage(messages.positive)}
            position={Position.RIGHT}
            disabled={disabled}
          >
            <AnchorButton
              icon="tick"
              disabled={disabled}
              intent={
                obj.judgement === 'positive' ? Intent.SUCCESS : Intent.NONE
              }
              active={obj.judgement === 'positive'}
              onClick={(e) => this.onChange('positive')}
            />
          </Tooltip>
          <Tooltip
            content={intl.formatMessage(messages.unsure)}
            position={Position.RIGHT}
            disabled={disabled}
          >
            <AnchorButton
              icon="help"
              disabled={disabled}
              active={obj.judgement === 'unsure'}
              onClick={(e) => this.onChange('unsure')}
            />
          </Tooltip>
          <Tooltip
            content={intl.formatMessage(messages.negative)}
            position={Position.RIGHT}
            disabled={disabled}
          >
            <AnchorButton
              icon="cross"
              disabled={disabled}
              intent={
                obj.judgement === 'negative' ? Intent.DANGER : Intent.NONE
              }
              active={obj.judgement === 'negative'}
              onClick={(e) => this.onChange('negative')}
            />
          </Tooltip>
        </ButtonGroup>
      </Tooltip>
    );
  }
}

export default injectIntl(JudgementButtons);
