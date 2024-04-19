export const defaultOptions = {
  blockHeading: "",
  markdown: ""
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },
  markdown: {
    label: "Markdown",
    type: "textarea",
    default: defaultOptions.markdown
  }
}