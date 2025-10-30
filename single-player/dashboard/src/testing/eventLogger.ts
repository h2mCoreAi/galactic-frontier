import { dashboardState, subscribe } from '../state';
import type { DashboardSubscriber } from '../types';

const containerId = 'eventLogger';
const MAX_LOG_ENTRIES = 100;

interface LogEntry {
  readonly timestamp: number;
  readonly level: 'info' | 'warn' | 'error' | 'event';
  readonly message: string;
  readonly source?: string;
}

const logs: LogEntry[] = [];

const addLog = (entry: LogEntry): void => {
  // Prevent recursive calls
  if (isLogging) {
    return;
  }
  
  try {
    isLogging = true;
    logs.push(entry);
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.shift();
    }
    renderLogs();
  } finally {
    isLogging = false;
  }
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${timeStr}.${ms}`;
};

const renderLogs = (): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const filtered = logs.slice().reverse(); // Show newest first

  container.innerHTML = `
    <div class="gf-event-logger">
      <div class="gf-event-logger__header">
        <div class="gf-event-logger__controls">
          <button id="eventLoggerClear" class="gf-button gf-button--secondary" type="button">Clear Logs</button>
          <button id="eventLoggerExport" class="gf-button gf-button--secondary" type="button">Export Logs</button>
          <label class="gf-event-logger__filter">
            <span>Filter:</span>
            <select id="eventLoggerFilter">
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warnings</option>
              <option value="error">Errors</option>
              <option value="event">Events</option>
            </select>
          </label>
        </div>
        <div class="gf-event-logger__stats">
          <span>Total: ${logs.length}</span>
          <span>Info: ${logs.filter(l => l.level === 'info').length}</span>
          <span>Warnings: ${logs.filter(l => l.level === 'warn').length}</span>
          <span>Errors: ${logs.filter(l => l.level === 'error').length}</span>
        </div>
      </div>
      <div class="gf-event-logger__entries" id="eventLoggerEntries">
        ${filtered.length === 0 
          ? '<p class="gf-event-logger__empty">No events logged yet. Game events will appear here when the preview is active.</p>'
          : filtered.map(log => `
            <div class="gf-event-logger__entry gf-event-logger__entry--${log.level}" data-level="${log.level}">
              <span class="gf-event-logger__timestamp">${formatTimestamp(log.timestamp)}</span>
              <span class="gf-event-logger__level">${log.level.toUpperCase()}</span>
              <span class="gf-event-logger__message">${log.message}</span>
              ${log.source ? `<span class="gf-event-logger__source">[${log.source}]</span>` : ''}
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  // Attach event listeners
  const clearBtn = container.querySelector('#eventLoggerClear');
  const exportBtn = container.querySelector('#eventLoggerExport');
  const filterSelect = container.querySelector<HTMLSelectElement>('#eventLoggerFilter');

  clearBtn?.addEventListener('click', () => {
    logs.length = 0;
    renderLogs();
  });

  exportBtn?.addEventListener('click', () => {
    const logText = logs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}${log.source ? ` [${log.source}]` : ''}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galactic-frontier-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  filterSelect?.addEventListener('change', () => {
    const filter = filterSelect.value;
    const entries = container.querySelectorAll('.gf-event-logger__entry');
    entries.forEach((entry) => {
      const level = entry.getAttribute('data-level');
      entry.classList.toggle('gf-event-logger__entry--hidden', filter !== 'all' && level !== filter);
    });
  });

  // Auto-scroll to top (newest entries)
  const entriesContainer = container.querySelector('.gf-event-logger__entries');
  if (entriesContainer) {
    entriesContainer.scrollTop = 0;
  }
};

const handleGameMessage = (event: MessageEvent): void => {
  const message = event.data;
  if (!message || typeof message !== 'object') {
    return;
  }

  switch (message.type) {
    case 'log': {
      addLog({
        timestamp: Date.now(),
        level: 'info',
        message: message.payload || String(message.payload),
        source: 'game',
      });
      break;
    }
    case 'error': {
      addLog({
        timestamp: Date.now(),
        level: 'error',
        message: message.payload || String(message.payload),
        source: 'game',
      });
      break;
    }
    case 'game-ready': {
      addLog({
        timestamp: Date.now(),
        level: 'event',
        message: 'Game preview ready',
        source: 'system',
      });
      break;
    }
    case 'metrics': {
      // Don't log every metrics update, but could log significant events
      break;
    }
    default:
      break;
  }
};

// Listen for game events
window.addEventListener('message', handleGameMessage);

// Track if we're inside our own logging to prevent recursion
let isLogging = false;

// Also listen for dashboard events via message events only
// Don't override console methods to avoid recursion issues
// Game messages are already handled via handleGameMessage

const updateEventLogger: DashboardSubscriber['notify'] = (snapshot) => {
  // Event logger doesn't need to react to state changes, but we keep the subscriber for consistency
};

export const initializeEventLogger = (): void => {
  // Container should already exist in HTML, but create if missing
  if (!document.getElementById(containerId)) {
    const debugSection = document.querySelector('[aria-labelledby="testing-debug-heading"]');
    if (debugSection) {
      const loggerDiv = document.createElement('div');
      loggerDiv.id = containerId;
      loggerDiv.className = 'gf-event-logger-container';
      debugSection.appendChild(loggerDiv);
    }
  }

  const subscriber: DashboardSubscriber = {
    id: 'event-logger',
    notify: updateEventLogger,
  };
  subscribe(subscriber);
  
  renderLogs();
  
  // Log initialization
  addLog({
    timestamp: Date.now(),
    level: 'event',
    message: 'Event logger initialized',
    source: 'system',
  });
};

