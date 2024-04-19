export const defaultOptions = {
  showDescription: true,
  descriptionAlternateText: "",
  showSupportedNips: true,
  showRestrictionsBoolean: true,
  showRestrictionsInteger: true,
  showSoftwareName: true,
  showSoftwareVersion: true
}

export const optionsConfig = {
  showDescription: {
    label: "Show Description",
    type: "checkbox",
    default: defaultOptions.showDescription
  },
  descriptionAlternateText: {
    label: "Description Alternate Text",
    type: "text",
    default: defaultOptions.descriptionAlternateText
  },
  showSupportedNips: {
    label: "Show Supported NIPs",
    type: "checkbox",
    default: defaultOptions.showSupportedNips
  },
  showRestrictionsBoolean: {
    label: "Show Restrictions Boolean",
    type: "checkbox",
    default: defaultOptions.showRestrictionsBoolean
  },
  showRestrictionsInteger: {
    label: "Show Restrictions Integer",
    type: "checkbox",
    default: defaultOptions.showRestrictionsInteger
  },
  showSoftwareName: {
    label: "Show Software Name",
    type: "checkbox",
    default: defaultOptions.showSoftwareName
  },
  showSoftwareVersion: {
    label: "Show Software Version",
    type: "checkbox",
    default: defaultOptions.showSoftwareVersion
  }
}