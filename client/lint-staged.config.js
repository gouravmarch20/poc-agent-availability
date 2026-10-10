export default {
  '*.{ts,tsx}': (files) => {
    const stagedFiles = files.map((file) => JSON.stringify(file)).join(' ');

    return [
      `eslint --fix ${stagedFiles}`,
      'tsc --noEmit --project tsconfig.json',
    ];
  },
};
