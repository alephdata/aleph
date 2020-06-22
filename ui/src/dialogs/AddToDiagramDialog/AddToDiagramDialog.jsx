import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import FormDialog from 'src/dialogs/common/FormDialog';
import { queryDiagrams, updateDiagram } from 'src/actions';
import { queryCollectionDiagrams } from 'src/queries';
import { selectDiagramsResult } from 'src/selectors';
import { Collection, Diagram, FileImport } from 'src/components/common';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { processApiEntity } from 'src/components/Diagram/util';


const messages = defineMessages({
  title: {
    id: 'diagram.add_entities.title',
    defaultMessage: 'Add to diagram',
  },
  placeholder: {
    id: 'diagram.add_entities.select_placeholder',
    defaultMessage: 'Select an existing diagram',
  },
  success_update: {
    id: 'diagram.add_entities.success',
    defaultMessage: 'Successfully added {count} entities to the diagram',
  },
});


class AddToDiagramDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { processing: false };

    this.onSelect = this.onSelect.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded()
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result && !result.isPending && !result.isError) {
      this.props.queryDiagrams({ query });
    }
  }

  async onSelect(diagram) {
    const { entities, history, intl } = this.props;
    const { processing } = this.state;

    if (processing) return;
    this.setState({ processing: true });

    const entityIds = entities.map(e => e.id);
    const newDiagramData = {
      ...diagram,
      entities: diagram.entities ? [...diagram.entities, ...entityIds] : entityIds,
    };

    try {
      const updatedDiagram = await this.props.updateDiagram(diagram.id, newDiagramData);
      this.setState({ processing: false });
      this.props.toggleDialog();

      const oldCount = diagram?.entities?.length;
      const newCount = updatedDiagram?.data?.entities?.length || 0;
      const updatedCount = oldCount ? newCount - oldCount : newCount;

      console.log(oldCount, newCount, updatedCount)

      showSuccessToast(
        intl.formatMessage(messages.success_update, {count: updatedCount}),
      );
      history.push({
        pathname: getDiagramLink(updatedDiagram.data),
      });
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }

  render() {
    const { intl, isOpen, openCreateDialog, result, toggleDialog } = this.props;
    const { processing } = this.state;

    return (
      <FormDialog
        icon="send-to-graph"
        className="AddToDiagramDialog"
        processing={processing}
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <div className="bp3-dialog-body">
          <Diagram.Select
            onSelect={this.onSelect}
            items={result.results}
            buttonProps={{
              disabled: result.isLoading || result.shouldLoad,
              text: intl.formatMessage(messages.placeholder)
            }}
          />
          <Button icon="graph" onClick={openCreateDialog} fill>
            <FormattedMessage id="diagram.add.create_new" defaultMessage="Create new diagram" />
          </Button>
        </div>
      </FormDialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const query = queryCollectionDiagrams(location, collection.id);
  return {
    query,
    result: selectDiagramsResult(state, query),
  };
};

export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { queryDiagrams, updateDiagram }),
)(AddToDiagramDialog);
