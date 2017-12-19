import React, { Component } from 'react';
import { AnchorButton } from '@blueprintjs/core';
import { FormattedMessage } from 'react-intl';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Language from 'src/components/common/Language';
import DualPane from 'src/components/common/DualPane';
import CollectionSection from 'src/components/CollectionScreen/CollectionSection';

class DocumentMetadata extends Component {
  render() {
    const { document } = this.props;
    return (
      <table className="pt-table">
        <tbody>
          <tr>
            <th><FormattedMessage id="document.type" defaultMessage="Type"/></th>
            <td><Schema.Name schema={document.schema} /></td>
          </tr>
          { document.file_name && (
            <tr>
              <th><FormattedMessage id="document.file_name" defaultMessage="File name"/></th>
              <td>{document.file_name}</td>
            </tr>
          )}
          { document.file_size && (
            <tr>
              <th><FormattedMessage id="document.file_size" defaultMessage="File size"/></th>
              <td>{document.file_size}</td>
            </tr>
          )}
          { document.author && (
            <tr>
              <th><FormattedMessage id="document.author" defaultMessage="Author"/></th>
              <td>{document.author}</td>
            </tr>
          )}
          { document.generator && (
            <tr>
              <th><FormattedMessage id="document.generator" defaultMessage="Generator"/></th>
              <td>{document.generator}</td>
            </tr>
          )}
          { document.mime_type && (
            <tr>
              <th><FormattedMessage id="document.mime_type" defaultMessage="MIME type"/></th>
              <td>{document.mime_type}</td>
            </tr>
          )}
          { document.languages && document.languages.length > 0 && (
            <tr>
              <th><FormattedMessage id="document.languages" defaultMessage="Languages"/></th>
              <td><Language.List codes={document.languages} /></td>
            </tr>
          )}
          { document.countries && document.countries.length > 0 && (
            <tr>
              <th><FormattedMessage id="document.countries" defaultMessage="Countries"/></th>
              <td><Country.List codes={document.countries} /></td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }
}

export default DocumentMetadata;
