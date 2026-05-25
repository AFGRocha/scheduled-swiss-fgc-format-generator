import {app, BrowserWindow, ipcMain, session} from 'electron';
import {join} from 'path';

type StartggAttendee = {
  name: string;
  seed: number | null;
};

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['script-src \'self\'']
      }
    })
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});

ipcMain.on('message', (event, message) => {
  console.log(message);
})

ipcMain.handle('startgg:get-seeded-attendees', async (_event, eventSlug: string) => {
  if (typeof eventSlug !== 'string' || !eventSlug.includes('/event/')) {
    throw new Error('Invalid start.gg event slug.');
  }

  const attendees: StartggAttendee[] = [];
  let page = 1;
  let totalPages = 1;
  let eventName = '';

  while (page <= totalPages) {
    const response = await fetch('https://www.start.gg/api/-/gql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-version': '20',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        operationName: 'EventEntrantsListQuery',
        variables: {
          eventSlug,
          page
        },
        query: `
          query EventEntrantsListQuery($eventSlug: String!, $page: Int!) {
            event(slug: $eventSlug) {
              name
              entrants(query: { page: $page, perPage: 64 }) {
                pageInfo {
                  totalPages
                }
                nodes {
                  name
                  initialSeedNum
                }
              }
            }
          }
        `
      })
    });

    if (!response.ok) {
      throw new Error(`start.gg request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors[0].message ?? 'start.gg returned a GraphQL error');
    }

    const event = payload.data?.event;
    if (!event) {
      throw new Error('Event not found. Please check the start.gg event link.');
    }

    if (!eventName) {
      eventName = event.name ?? '';
    }

    totalPages = Number(event.entrants?.pageInfo?.totalPages ?? 1);
    const nodes = event.entrants?.nodes ?? [];

    for (const node of nodes) {
      attendees.push({
        name: String(node?.name ?? 'Unknown'),
        seed: Number.isFinite(node?.initialSeedNum) ? Number(node.initialSeedNum) : null
      });
    }

    page += 1;
  }

  attendees.sort((a, b) => {
    if (a.seed === null && b.seed === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.seed === null) {
      return 1;
    }
    if (b.seed === null) {
      return -1;
    }
    return a.seed - b.seed;
  });

  return {
    eventName,
    attendees
  };
});