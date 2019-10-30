import React from 'react';
import { Dialog, Intent } from '@blueprintjs/core';
import JSONPretty from 'react-json-pretty';

const MappingPreviewDialog = props => (
  <Dialog
    isOpen={props.isOpen}
    title="Preview"
    icon="eye-open"
    intent={Intent.PRIMARY}
    onClose={props.toggleDialog}
  >
    <div style={{ padding: '10px 30px' }}>
      <JSONPretty data={props.mappings} />
    </div>
  </Dialog>
);

export default MappingPreviewDialog;
