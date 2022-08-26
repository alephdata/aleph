import { Intent, Position, Toaster } from '@blueprintjs/core';

export const toaster = Toaster.create({
  position: Position.TOP,
  className: 'aleph-toaster',
});

const showToast = (userProps: any, intentProps: any) => {
  let userPropsConfig;
  if (typeof userProps === 'string') userPropsConfig = { message: userProps };
  else userPropsConfig = userProps;
  toaster.show({ ...intentProps, ...userPropsConfig });
};

export const showInfoToast = (props: any) =>
  showToast(props, {
    intent: Intent.PRIMARY,
    icon: 'info-sign',
  });

export const showSuccessToast = (props: any) =>
  showToast(props, {
    intent: Intent.SUCCESS,
    icon: 'tick',
  });

export const showWarningToast = (props: any) =>
  showToast(props, {
    intent: Intent.WARNING,
    icon: 'warning-sign',
  });

export const showErrorToast = (props: any) =>
  showToast(props, {
    intent: Intent.DANGER,
    icon: 'error',
  });
