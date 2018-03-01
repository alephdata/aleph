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
                <FormattedMessage
                  id="document.status_fail"
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
    
    // @ TODO Check if downlink link exist and display download button
    let documentViewer = <section className="PartialError">
      <div className="pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-issue"></span>
        </div>
        <h4 className="pt-non-ideal-state-title">
          <FormattedMessage
            id="document.no_viewer"
            defaultMessage="No preview is available for this document"/>
        </h4>
        <div className="pt-non-ideal-state-description">
          { document.error_message }
        </div>
      </div>
    </section>

    if (document.schema === 'Email') {
      documentViewer = <EmailViewer document={document}/>
    } else if (document.schema === 'Table' && document.extension !== 'xlsx' && document.children !== undefined) {
      documentViewer = <TableViewer document={document}/>
    } else if (document.text && !document.html) {
      documentViewer = <TextViewer document={document}/>
    } else if (document.html) {
      documentViewer = <HtmlViewer document={document}/>
    } else if (document.links && document.links.pdf) {
      documentViewer = <PdfViewer document={document} fragId={fragId} />
    } else if (document.schema === 'Image') {
      documentViewer = <ImageViewer document={document} />
    } else if (document.children !== undefined && document.children > 0) {
      documentViewer = <FolderViewer document={document} />
    }
    
    return (
      <DualPane.ContentPane style={{padding: 0}}>
      { documentViewer }
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;



