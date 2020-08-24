import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button } from '@blueprintjs/core';

import ExportDialog from 'src/dialogs/ExportDialog/ExportDialog';
import { selectSession } from 'src/selectors';


class ExportButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { disabled, onExport, text } = this.props;
    const { isOpen } = this.state;

    return (
      <>
        <Button
          className="bp3-intent-primary"
          icon="export"
          disabled={disabled}
          text={text}
          onClick={this.toggle}
        />
        <ExportDialog
          isOpen={isOpen}
          onExport={onExport}
          toggleDialog={this.toggle}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

export default compose(
  connect(mapStateToProps),
  injectIntl,
)(ExportButton);
