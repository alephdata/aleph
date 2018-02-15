import { Intent, Position, Toaster } from "@blueprintjs/core";

export const toaster = Toaster.create({
  position: Position.TOP,
});

const showToast = (userProps, intentProps) => {
  if (typeof userProps === "string") userProps = {message: userProps};
  toaster.show({...intentProps, ...userProps});
};

export const showInfoToast = (props) => showToast(props, {
  intent: Intent.PRIMARY,
  icon: "info-sign",
});

export const showSuccessToast = (props) => showToast(props, {
  intent: Intent.SUCCESS,
  icon: "tick",
});

export const showWarningToast = (props) => showToast(props, {
  intent: Intent.WARNING,
  icon: "warning-sign",
});

export const showErrorToast = (props) => showToast(props, {
  intent: Intent.DANGER,
  icon: "error",
});
