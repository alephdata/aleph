import * as React from 'react';
import { defineMessages } from 'react-intl';
import { Classes, ControlGroup, InputGroup } from '@blueprintjs/core';
import {
  GraphContext,
  IGraphContext,
} from 'react-ftm/components/NetworkDiagram/GraphContext';
import { Dialog } from 'react-ftm/components/common';
import { Grouping } from 'react-ftm/components/NetworkDiagram/layout';

const messages = defineMessages({
  title: {
    id: 'dialog.grouping_create.title',
    defaultMessage: 'Group items',
  },
  placeholder: {
    id: 'dialog.grouping_create.placeholder',
    defaultMessage: 'Select a label for the grouping',
  },
});

interface IGroupingCreateDialogProps {
  isOpen: boolean;
  toggleDialog: () => any;
}

interface IGroupingCreateDialogState {
  label: string;
  color?: string;
  isProcessing: boolean;
}

export class GroupingCreateDialog extends React.Component<
  IGroupingCreateDialogProps,
  IGroupingCreateDialogState
> {
  static contextType = GraphContext;
  state: IGroupingCreateDialogState = {
    label: '',
    isProcessing: false,
  };

  constructor(props: any) {
    super(props);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeColor = this.onChangeColor.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChangeLabel(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ label: e.target.value });
  }

  onChangeColor(color: string) {
    this.setState({ color });
  }

  onSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    const { label, color } = this.state;
    const { layout, updateLayout } = this.context as IGraphContext;
    e.preventDefault();
    this.setState({ isProcessing: true });

    const selectedVertices = layout
      .getSelectedVertices()
      .filter((vertex) => !vertex.isHidden());
    const grouping = Grouping.fromVertices(
      layout,
      label,
      selectedVertices,
      color
    );

    if (grouping) {
      layout.addGrouping(grouping);
      layout.clearSelection();
      updateLayout(layout, null, { modifyHistory: true });
      this.setState({ label: '' });
      this.setState({ isProcessing: false });
      this.props.toggleDialog();
    }
  }

  render() {
    const { intl } = this.context as IGraphContext;
    const { isOpen, toggleDialog } = this.props;
    const { isProcessing } = this.state;

    return (
      <Dialog
        icon="group-objects"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={() => toggleDialog()}
        isProcessing={isProcessing}
      >
        <form onSubmit={this.onSubmit}>
          <div className={Classes.DIALOG_BODY}>
            <ControlGroup fill>
              <InputGroup
                autoFocus
                large
                className={Classes.FILL}
                value={this.state.label}
                onChange={this.onChangeLabel}
                placeholder={intl.formatMessage(messages.placeholder)}
              />
            </ControlGroup>
          </div>
        </form>
      </Dialog>
    );
  }
}
