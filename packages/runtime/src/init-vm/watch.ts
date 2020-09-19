export default (vm, watch) => {
  for (const [key, value] of Object.entries(watch)) {
    vm.$watch(key, value);
  }
};
