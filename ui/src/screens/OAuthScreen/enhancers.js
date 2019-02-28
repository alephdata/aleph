import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouter from 'react-router/es/withRouter';
import { injectIntl } from 'react-intl';


export function connectedWIthRouter({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
    withRouter,
  );
}
export function translatableConnected({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
    injectIntl,
  );
}

export function enhancer({
  mapStateToProps = () => {}, mapDispatchToProps, mergeProps, options,
}) {
  return compose(
    injectIntl,
    connect(mapStateToProps, mapDispatchToProps, mergeProps, options),
    withRouter,
  );
}
