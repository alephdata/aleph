import React from 'react';
import { Dialog, Intent } from '@blueprintjs/core';
import JSONPretty from 'react-json-pretty';

const MappingPreviewDialog = ({ isOpen, mappings, toggleDialog }) => (
  <Dialog
    isOpen={isOpen}
    title="Preview"
    icon="eye-open"
    intent={Intent.PRIMARY}
    onClose={toggleDialog}
  >
    <div style={{ padding: '10px 30px' }}>
      <JSONPretty data={mappings.toApiFormat()} />
    </div>
  </Dialog>
);

export default MappingPreviewDialog;
