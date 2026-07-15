const render = () => {
  const getDeviceUrl = () => console.log("State is:", state);
  const state = { wifi: { mode: "AP" } };
  getDeviceUrl();
};
render();
