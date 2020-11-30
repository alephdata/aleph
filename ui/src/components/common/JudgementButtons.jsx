import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent, Tooltip, Position } from '@blueprintjs/core';

const messages = defineMessages({
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
        const { obj, intl } = this.props;
        const { blocking } = this.state;

        if (!obj.writeable) {
            return null;
        }
        return (
            <ButtonGroup className="JudgementButtons" vertical>
                <Tooltip content={intl.formatMessage(messages.positive)} position={Position.RIGHT}>
                    <Button icon="tick"
                        disabled={blocking}
                        intent={obj.judgement === 'positive' ? Intent.SUCCESS : Intent.NONE}
                        active={obj.judgement === 'positive'}
                        onClick={(e) => this.onChange('positive')} />
                </Tooltip>
                <Tooltip content={intl.formatMessage(messages.unsure)} position={Position.RIGHT}>
                    <Button icon="help"
                        disabled={blocking}
                        active={obj.judgement === 'unsure'}
                        onClick={(e) => this.onChange('unsure')} />
                </Tooltip>
                <Tooltip content={intl.formatMessage(messages.negative)} position={Position.RIGHT}>
                    <Button icon="cross"
                        disabled={blocking}
                        intent={obj.judgement === 'negative' ? Intent.DANGER : Intent.NONE}
                        active={obj.judgement === 'negative'}
                        onClick={(e) => this.onChange('negative')} />
                </Tooltip>
            </ButtonGroup>
        );
    }
}

export default injectIntl(JudgementButtons);
