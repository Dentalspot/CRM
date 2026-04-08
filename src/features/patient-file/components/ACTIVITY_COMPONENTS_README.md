# Activity Management Components

This documentation covers the activity management system used in the patient file, specifically the `ActivityLibrarySelector` and `ActivityInputWithLibrary` components.

## 1. ActivityLibrarySelector

A modal component that allows users to browse and select activities from the global library or their own custom activities.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls visibility of the modal |
| `onClose` | `function` | Callback when modal closes |
| `onSelect` | `function(activities)` | Callback receiving array of selected activities |
| `availableActivities` | `array` | Optional. Pre-loaded activities to display. If not provided, fetches from DB. |
| `maxSelectable` | `number` | Optional. Max number of activities selectable at once. Default: 10. |

### Usage Example