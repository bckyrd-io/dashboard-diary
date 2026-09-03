module.exports = function (api) {
  api.cache(true);
  return {
<<<<<<< Updated upstream
    presets: ["babel-preset-expo"],
=======
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
>>>>>>> Stashed changes
  };
};
