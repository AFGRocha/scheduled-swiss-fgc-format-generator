/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  getSeededAttendees: (eventSlug: string) => Promise<{
    eventName: string;
    attendees: Array<{
      name: string;
      seed: number | null;
    }>;
  }>
}

declare global {
  interface Window {
    electronAPI: ElectronApi,
  }
}
