export const defaultOptions = {
  blockHeading: "",
  imageUrl: "",
  width: "",
  height: "",
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },
  imageUrl: {
    label: "Image URL",
    type: "text",
    default: defaultOptions.imageUrl
  },
  width: {
    label: "Width",
    type: "text",
    default: defaultOptions.width
  },
  height: {
    label: "Height",
    type: "text",
    default: defaultOptions.height
  }
}