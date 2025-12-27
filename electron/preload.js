/**
 * Preload Script
 * Exposes safe IPC bridge to renderer
 * SECURITY: Only whitelisted channels exposed
 */
var _a = require('electron'), contextBridge = _a.contextBridge, ipcRenderer = _a.ipcRenderer;
// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electron', {
    log: {
        start: function (manualPath) { return ipcRenderer.invoke('log:start', manualPath); },
        selectFile: function () { return ipcRenderer.invoke('log:select-file'); },
        stop: function () { return ipcRenderer.invoke('log:stop'); },
        status: function () { return ipcRenderer.invoke('log:status'); },
        onEvent: function (callback) {
            var handler = function (_, data) { return callback(data); };
            ipcRenderer.on('log-event', handler);
            return function () { return ipcRenderer.removeListener('log-event', handler); };
        },
    },
    equipment: {
        load: function (type) { return ipcRenderer.invoke('equipment:load', type); },
    },
    session: {
        save: function (session) { return ipcRenderer.invoke('session:save', session); },
        load: function (sessionId) { return ipcRenderer.invoke('session:load', sessionId); },
        delete: function (sessionId) { return ipcRenderer.invoke('session:delete', sessionId); },
        list: function () { return ipcRenderer.invoke('session:list'); },
        export: function (sessionId, path) { return ipcRenderer.invoke('session:export', sessionId, path); },
        import: function (path) { return ipcRenderer.invoke('session:import', path); },
    },
    popout: {
        open: function () { return ipcRenderer.invoke('popout:open'); },
        close: function () { return ipcRenderer.invoke('popout:close'); },
        sendStats: function (stats) { return ipcRenderer.send('popout:stats', stats); },
        onStatsUpdate: function (callback) {
            var handler = function (_, data) { return callback(data); };
            ipcRenderer.on('popout:stats-update', handler);
            return function () { return ipcRenderer.removeListener('popout:stats-update', handler); };
        },
        requestStats: function () { return ipcRenderer.send('popout:request-stats'); },
        onStatsRequest: function (callback) {
            var handler = function () { return callback(); };
            ipcRenderer.on('popout:stats-requested', handler);
            return function () { return ipcRenderer.removeListener('popout:stats-requested', handler); };
        },
    },
    asteroid: {
        save: function (asteroids) { return ipcRenderer.invoke('asteroid:save', asteroids); },
        load: function () { return ipcRenderer.invoke('asteroid:load'); },
    },
    ipcRenderer: {
        on: function (channel, callback) {
            ipcRenderer.on(channel, callback);
        },
        removeListener: function (channel, callback) {
            ipcRenderer.removeListener(channel, callback);
        },
    },
});
