export const VALID_TEMPLATE_IDS = ['redirect', 'gdrive'];
export const VALID_GPS_MODES = ['required', 'optional', 'disabled'];
export const TEMPLATES = [
    {
        id: 'redirect',
        name: 'Redirect',
        description: 'Shows a loading spinner, requests location, then redirects to target URL',
    },
    {
        id: 'gdrive',
        name: 'Google Drive',
        description: 'Mimics a Google Drive file page with a verify button that requests location',
    },
];
//# sourceMappingURL=types.js.map