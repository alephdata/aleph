import React from 'react';
import { FormattedMessage } from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import TableViewer from 'src/components/DocumentViewers/TableViewer';
import TextViewer from 'src/components/DocumentViewers/TextViewer';
import HtmlViewer from 'src/components/DocumentViewers/HtmlViewer';
import PdfViewer from 'src/components/DocumentViewers/PdfViewer';
import ImageViewer from 'src/components/DocumentViewers/ImageViewer';
import FolderViewer from 'src/components/DocumentViewers/FolderViewer';
import EmailViewer from 'src/components/DocumentViewers/EmailViewer';

import './DocumentContent.css';

class DocumentContent extends React.Component {
  render() {
    const { document, fragId } = this.props;

    if (document.status === 'fail' && !(document.children !== undefined && document.children > 0)) {
      return (
        <DualPane.ContentPane className="DocumentContent">
          <section className="PartialError">
            <div className="pt-non-ideal-state">
              <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
                <span className="pt-icon pt-icon-issue"/>
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
    } else if (document.children !== undefined) {
      documentViewer = <FolderViewer document={document} />
    }
    
    return (
      <DualPane.ContentPane className="DocumentContent">
        { documentViewer }
      </DualPane.ContentPane>
    );
  }
}

export default DocumentContent;



