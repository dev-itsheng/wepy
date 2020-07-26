import { omit } from 'lodash-es';

export const patchAppMethods = (option) => {
  const { methods } = option;

  return (
    methods ?
      { ...omit(option, ['methods']), ...methods } :
      option
  );
}
