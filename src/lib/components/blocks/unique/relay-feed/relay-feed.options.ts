export const defaultOptions = {
  blockHeading: "geo",
  gridColumns: 3,
  noteTemplate: "minimal",
  excludeOperator: false,
  includeAuthors: [],
  gridLimit: 15,
  filterTopics: [],
  hideNotesContainingImages: true,
  hideNotesContainingVideos: true
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },
  gridColumns: {
    label: "Grid Columns",
    type: "number",
    default: defaultOptions.gridColumns
  },
  noteTemplate: {
    label: "Note Template",
    type: "dropdown",
    default: defaultOptions.gridColumns
  },
  excludeOperator: {
    label: "Exclude Operator",
    type: "checkbox",
    default: defaultOptions.excludeOperator
  },
  includeAuthors: {
    label: "Include Authors",
    type: "text",
    default: defaultOptions.includeAuthors
  },
  gridLimit: {
    label: "Grid Limit",
    type: "number",
    default: defaultOptions.gridLimit
  },
  filterTopics: {
    label: "Filter Topics",
    type: "text",
    default: defaultOptions.filterTopics
  },
  hideNotesContainingImages: {
    label: "Hide Notes Containing Images",
    type: "checkbox",
    default: defaultOptions.hideNotesContainingImages
  },
  hideNotesContainingVideos: {
    label: "Hide Notes Containing Videos",
    type: "checkbox",
    default: defaultOptions.hideNotesContainingVideos
  }
}