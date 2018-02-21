import React from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import TableViewer from './viewers/TableViewer';
import TextViewer from './viewers/TextViewer';
import HtmlViewer from './viewers/HtmlViewer';
import PdfViewer from './viewers/PdfViewer';
import ImageViewer from './viewers/ImageViewer';
import FolderViewer from './viewers/FolderViewer';
import EmailViewer from './viewers/EmailViewer';

import './DocumentContent.css';

class DocumentContent extends React.Component {
  render() {
    const { document, fragId } = this.props;

    if (document.status === 'fail' && !(document.children !== undefined && document.children > 0)) {
      return (
        <DualPane.ContentPane>
          <section className="PartialError">
            <div className="pt-non-ideal-state">
              <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-issue"></span>
              </div>
              <h4 className="pt-non-ideal-state-title">
                <FormattedMessage id="document.status_fail"
                                  defaultMessage="Document failed to import"/>
              </h4>
              <div className="pt-non-ideal-state-description">
                { document.error_message }
              </div>
            </div>
          </section>
        </DualPane.ContentPane>
      )
    }
    
    return (
      <DualPane.ContentPane style={{padding: 0}}>
        {document.schema === 'Email' && (
          <EmailViewer document={document}/>
        )}

        {document.schema === 'Table' && (
          <TableViewer document={document}/>
        )}

        {document.text && !document.html && document.schema !== 'Email' && (
          <TextViewer document={document}/>
        )}

        {document.html && (
          <HtmlViewer document={document}/>
        )}

        {document.links && document.links.pdf && (
          <PdfViewer document={document} fragId={fragId} />
        )}

        {document.schema === 'Image' && (
          <ImageViewer document={document} />
        )}

        {document.children !== undefined && document.children > 0 && document.schema !== 'Email' && (
          <FolderViewer document={document} />
        )}
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;
