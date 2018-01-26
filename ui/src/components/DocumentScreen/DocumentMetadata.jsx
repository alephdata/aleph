import React, {Component} from 'react';
import {FormattedMessage} from 'react-intl';

import Schema from 'src/components/common/Schema';
import Country from 'src/components/common/Country';
import Language from 'src/components/common/Language';
import Date from 'src/components/common/Date';
import FileSize from 'src/components/common/FileSize';
import URL from 'src/components/common/URL';
import Entity from 'src/components/EntityScreen/Entity';

import './DocumentMetadata.css';

class DocumentMetadata extends Component {
  render() {
    const {document} = this.props;
    return (
      <table className='info-sheet'>
        <tbody>
          <tr>
            <th><FormattedMessage id="document.type" defaultMessage="Type"/></th>
            <td>
              <Schema.Icon schema={document.schema}/>
              <Schema.Name schema={document.schema}/>
            </td>
          </tr>
          {document.file_name && (
            <tr>
              <th><FormattedMessage id="document.file_name" defaultMessage="File name"/></th>
              <td>{document.file_name}</td>
            </tr>
          )}
          {document.file_size && (
            <tr>
              <th><FormattedMessage id="document.file_size" defaultMessage="File size"/></th>
              <td><FileSize value={document.file_size}/></td>
            </tr>
          )}
          {document.parent && (
              <tr>
                  <th><FormattedMessage id="document.parent" defaultMessage="Folder"/></th>
                  <td><Entity.Link iconClass='icon_margin_right' entity={document.parent}
                                                        icon short/></td>
              </tr>
          )}
          {document.source_url && (
              <tr>
                  <th><FormattedMessage id="document.source_url" defaultMessage="Source URL"/></th>
                  <td><URL value={document.source_url} /></td>
              </tr>
          )}
          {document.author && (
              <tr>
                  <th><FormattedMessage id="document.author" defaultMessage="Author"/></th>
                  <td>{document.author}</td>
              </tr>
          )}
          {document.generator && (
              <tr>
                  <th><FormattedMessage id="document.generator" defaultMessage="Generator"/>
                  </th>
                  <td>{document.generator}</td>
              </tr>
          )}
          {document.languages && document.languages.length > 0 && (
              <tr>
                  <th><FormattedMessage id="document.languages" defaultMessage="Languages"/>
                  </th>
                  <td><Language.List codes={document.languages}/></td>
              </tr>
          )}
          {document.countries && document.countries.length > 0 && (
              <tr>
                  <th><FormattedMessage id="document.countries" defaultMessage="Countries"/>
                  </th>
                  <td><Country.List codes={document.countries}/></td>
              </tr>
          )}
          {document.date && (
              <tr>
                  <th><FormattedMessage id="document.date" defaultMessage="Date"/></th>
                  <td><Date value={document.date}/></td>
              </tr>
          )}
          {document.authored_at && (
              <tr>
                  <th><FormattedMessage id="document.authored_at" defaultMessage="Authored"/>
                  </th>
                  <td><Date value={document.authored_at}/></td>
              </tr>
          )}
          {document.modified_at && (
              <tr>
                  <th><FormattedMessage id="document.modified_at" defaultMessage="Modified"/>
                  </th>
                  <td><Date value={document.modified_at}/></td>
              </tr>
          )}
          {document.retrieved_at && (
              <tr>
                  <th><FormattedMessage id="document.retrieved_at"
                                                              defaultMessage="Retrieved"/></th>
                  <td><Date value={document.retrieved_at}/></td>
              </tr>
          )}
          {document.updated_at && (
              <tr>
                  <th><FormattedMessage id="document.updated_at" defaultMessage="Imported"/>
                  </th>
                  <td><Date value={document.updated_at}/></td>
              </tr>
          )}
          {document.mime_type && (
              <tr>
                  <th><FormattedMessage id="document.mime_type" defaultMessage="MIME"/></th>
                  <td>{document.mime_type}</td>
              </tr>
          )}
        </tbody>
      </table>
    );
  }
}

export default DocumentMetadata;
