export const defaultOptions = {
  blockHeading: "relay feed",
  //filters
  filterLimit: 15,
  filterKinds: [1],
  filterAuthors: [],
  filterTopics: [],

  excludeOperator: false,
  hideNotesContainingImages: true,
  hideNotesContainingVideos: true,

  feedLayout: "grid",

  gridMinColWidth: 200,
  gridMaxColWidth: 800,
  gridGap: 20,
  gridAnimate: true,

  noteTemplate: "minimal",
}

export const optionsConfig = {
  blockHeading: {
    label: "Block Heading",
    type: "text",
    default: defaultOptions.blockHeading
  },

  filterLimit: {
    label: "Filter Limit",
    type: "number",
    default: defaultOptions.filterLimit
  },
  filterKinds: {
    label: "Filter Kinds",
    type: "text[]",
    default: defaultOptions.filterKinds,
    setter: (value: [string|number]): number[] => value.map(v => typeof v === 'string' ? parseInt(v) : v)
  },
  filterTopics: {
    label: "Filter Topics",
    type: "text[]",
    default: defaultOptions.filterTopics
    // setter: (object: { [key: string]: string[] }): { [key: string]: string[] } => {
    //   const result = {}
    //   for( let key in object) {
    //     const tagFilter = object[key]
    //     let [tag, tags] = tagFilter.split(':')
    //     result[tag] = tags.split(',')
    //   }
    //   return result
    // }
  },
  filterAuthors: {
    label: "Filter Authors",
    type: "text[]",
    default: defaultOptions.filterAuthors
  },

  excludeOperator: {
    label: "Exclude Operator",
    type: "checkbox",
    default: defaultOptions.excludeOperator
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
  },

  feedLayout: {
    label: "Feed Layout",
    type: "radio",
    default: defaultOptions.feedLayout,
    values: [
      {
        label: "Grid",
        value: "grid"
      },
      {
        label: "List",
        value: "list"
      }
    ]
  },
  
  gridMinColWidth: {
    label: "Grid Min Column Width",
    type: "number",
    default: defaultOptions.gridMinColWidth
  },
  gridMaxColWidth: {
    label: "Grid Max Column Width",
    type: "number",
    default: defaultOptions.gridMaxColWidth
  },
  gridGap: {
    label: "Grid Gap",
    type: "number",
    default: defaultOptions.gridGap
  },
  gridAnimate: {
    label: "Grid Animate",
    type: "checkbox",
    default: defaultOptions.gridAnimate
  },
  noteTemplate: {
    label: "Note Template",
    type: "dropdown",
    default: defaultOptions.gridColumns
  }
}