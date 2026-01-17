import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { EntityCreateDialog } from '/src/react-ftm/index.ts';

import withRouter from '/src/app/withRouter.jsx';
import entityEditorWrapper from '/src/components/Entity/entityEditorWrapper';
import collectionViewIds from '/src/components/Collection/collectionViewIds';
import { showSuccessToast, showErrorToast } from '/src/app/toast';
import { DialogToggleButton } from '/src/components/Toolbar';
import { QuickLinks } from '/src/components/common/index.jsx';
import DocumentUploadDialog from '/src/dialogs/DocumentUploadDialog/DocumentUploadDialog.jsx';
import EntitySetCreateDialog from '/src/dialogs/EntitySetCreateDialog/EntitySetCreateDialog.jsx';
import CollectionXrefDialog from '/src/dialogs/CollectionXrefDialog/CollectionXrefDialog.jsx';
import { selectModel } from '/src/selectors.js';

const messages = defineMessages({
  entity_create_error: {
    id: 'investigation.shortcut.entity_create_error',
    defaultMessage: 'Unable to create entity',
  },
  entity_create_success: {
    id: 'investigation.shortcut.entity_create_success',
    defaultMessage: 'Successfully created {name}',
  },
});

class InvestigationQuickLinks extends React.Component {
  onDocUpload = () => {
    const { navigate, location } = this.props;

    navigate({
      pathname: location.pathname,
      hash: queryString.stringify({ mode: collectionViewIds.DOCUMENTS }),
    });
  };

  onEntityCreate = async (entityData) => {
    const { entityManager, navigate, intl, location } = this.props;

    if (!entityData) {
      showErrorToast(intl.formatMessage(messages.entity_create_error));
    }

    const entity = await entityManager.createEntity(entityData);
    if (entity) {
      showSuccessToast(
        intl.formatMessage(messages.entity_create_success, {
          name: entity.getCaption(),
        })
      );
      navigate({
        pathname: location.pathname,
        hash: queryString.stringify({
          mode: collectionViewIds.ENTITIES,
          type: entityData.schema.name,
        }),
      });
    }
  };

  onXrefSubmit = () => {
    const { navigate, location } = this.props;
    navigate({
      pathname: location.pathname,
      hash: queryString.stringify({ mode: collectionViewIds.XREF }),
    });
  };

  render() {
    const { collection, intl, model } = this.props;

    return (
      <QuickLinks isPending={collection.id === undefined}>
        <div className="QuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: 'QuickLinks__item__content',
            }}
            Dialog={DocumentUploadDialog}
            dialogProps={{ collection, onUploadSuccess: this.onDocUpload }}
          >
            <>
              <div
                className="QuickLinks__item__image"
                style={{
                  backgroundImage: 'url(/static/investigation_upload.svg)',
                }}
              />
              <div className="QuickLinks__item__text">
                <p>
                  <FormattedMessage
                    id="investigation.shortcut.upload"
                    defaultMessage="Upload documents"
                  />
                </p>
              </div>
            </>
          </DialogToggleButton>
        </div>
        <div className="QuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: 'QuickLinks__item__content',
            }}
            Dialog={EntityCreateDialog}
            dialogProps={{
              onSubmit: this.onEntityCreate,
              model,
              schema: model.getSchema('Person'),
              intl,
            }}
          >
            <>
              <div
                className="QuickLinks__item__image"
                style={{
                  backgroundImage: 'url(/static/investigation_entities.svg)',
                }}
              />
              <div className="QuickLinks__item__text">
                <p>
                  <FormattedMessage
                    id="investigation.shortcut.entities"
                    defaultMessage="Create new entities"
                  />
                </p>
              </div>
            </>
          </DialogToggleButton>
        </div>
        <div className="QuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: 'QuickLinks__item__content',
            }}
            Dialog={EntitySetCreateDialog}
            dialogProps={{
              entitySet: { collection, type: 'diagram' },
              canChangeCollection: false,
            }}
          >
            <>
              <div
                className="QuickLinks__item__image"
                style={{ backgroundImage: 'url(/static/home_networks.svg)' }}
              />
              <div className="QuickLinks__item__text">
                <p>
                  <FormattedMessage
                    id="investigation.shortcut.diagram"
                    defaultMessage="Sketch a network diagram"
                  />
                </p>
              </div>
            </>
          </DialogToggleButton>
        </div>
        <div className="QuickLinks__item">
          <DialogToggleButton
            buttonProps={{
              minimal: true,
              className: 'QuickLinks__item__content',
            }}
            Dialog={CollectionXrefDialog}
            dialogProps={{ collection, onSubmit: this.onXrefSubmit }}
          >
            <>
              <div
                className="QuickLinks__item__image"
                style={{ backgroundImage: 'url(/static/home_xref.svg)' }}
              />
              <div className="QuickLinks__item__text">
                <p>
                  <FormattedMessage
                    id="investigation.shortcut.xref"
                    defaultMessage="Compare with other datasets"
                  />
                </p>
              </div>
            </>
          </DialogToggleButton>
        </div>
      </QuickLinks>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    model: selectModel(state),
  };
};

export default compose(
  withRouter,
  entityEditorWrapper,
  connect(mapStateToProps),
  injectIntl
)(InvestigationQuickLinks);
