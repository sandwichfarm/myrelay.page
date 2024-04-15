export const defaultOptions = {
  blockHeading: "",
  html: ""
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },
  html: {
    label: "HTML",
    type: "textarea",
    default: defaultOptions.html
  }
}