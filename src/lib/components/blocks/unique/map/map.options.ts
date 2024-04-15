export const defaultOptions = {
  blockHeading: "geo",
  showMonitors: "always"
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },
  showMonitors: {
    label: "Monitor Visibility",
    type: "radio",
    default: defaultOptions.showMonitors,
    values: [
      {
        label: "Always",
        value: "always"
      },
      {
        label: "On hover",
        value: "onhover"
      },
      {
        label: "Never",
        value: "never"
      }
    ]
  }
}