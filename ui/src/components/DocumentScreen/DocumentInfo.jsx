import React, { Component } from 'react';
import { AnchorButton } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import Schema from 'src/components/common/Schema';
import DualPane from 'src/components/common/DualPane';
import CollectionSection from 'src/components/CollectionScreen/CollectionSection';

class DocumentInfo extends Component {
  render() {
    const { document } = this.props;
    const hasTitle = !!document.title;
    return (
      <DualPane.InfoPane>
        <h1>
          <Schema.Icon schema={document.schema} />
          {hasTitle ? document.title : document.file_name}
        </h1>
        <table className="pt-table">
          <tbody>
            <tr>
              <th>
                <FormattedMessage id="document.type" defaultMessage="Type"/>
              </th>
              <td>
                <Schema.Name schema={document.schema} />
              </td>
            </tr>
          </tbody>
        </table>
        <ul>
          {hasTitle && <li>{document.file_name}</li>}
          <li>{document.created_at}</li>
        </ul>
        {document.links && document.links.file &&
          <AnchorButton
            href={document.links.file}
            download={document.file_name}
            intent="primary"
          >
            Download
          </AnchorButton>
        }

        <CollectionSection collection={document.collection} />
      </DualPane.InfoPane>
    );
  }
}

export default DocumentInfo;
