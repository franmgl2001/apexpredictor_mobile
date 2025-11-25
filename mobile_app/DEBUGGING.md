# GraphQL Request Debugging Guide

This guide explains how to track and debug GraphQL requests in the app.

## Quick Start

### 1. View Request Summary in Console

Open your React Native debugger console and run:

```javascript
graphqlLogger.printSummary()
```

This will show:
- Total requests made
- Success/failure counts
- Success rate
- Average duration
- Operations breakdown

### 2. View All Request Logs

```javascript
graphqlLogger.getLogs()
```

Returns an array of all logged requests with:
- `id` - Unique request ID
- `timestamp` - When the request was made
- `operation` - Operation name (e.g., "getApexEntity", "listApexEntities")
- `variables` - Request variables (sanitized)
- `duration` - Request duration in milliseconds
- `success` - Whether the request succeeded
- `itemCount` - Number of items returned
- `error` - Error message if failed

### 3. Clear Logs

```javascript
graphqlLogger.clear()
```

### 4. Enable/Disable Logging

```javascript
// Disable logging
graphqlLogger.setEnabled(false)

// Enable logging
graphqlLogger.setEnabled(true)
```

## Using React Native Debugger

### Option 1: Chrome DevTools (Recommended)

1. Open your app in development mode
2. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
3. Select "Debug"
4. Chrome DevTools will open
5. Go to Console tab
6. Type `graphqlLogger.printSummary()` to see overview

### Option 2: React Native Debugger App

1. Download [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Open the app
3. Connect your React Native app
4. Use the console to run debugging commands

### Option 3: Flipper (Advanced)

1. Install [Flipper](https://fbflipper.com/)
2. Connect your device
3. Use the Network plugin to see all network requests
4. Use the Logs plugin to see console logs

## Example Debugging Session

```javascript
// 1. Check current status
graphqlLogger.printSummary()

// Output:
// 📊 GraphQL Request Summary
// Total Requests: 15
// Successful: 14
// Failed: 1
// Success Rate: 93.3%
// Avg Duration: 245ms
// Operations: { listApexEntities: 10, getApexEntity: 5 }

// 2. Get detailed logs
const logs = graphqlLogger.getLogs()
console.table(logs)

// 3. Filter failed requests
const failed = logs.filter(log => !log.success)
console.log('Failed requests:', failed)

// 4. Find slow requests
const slow = logs.filter(log => log.duration > 1000)
console.log('Slow requests (>1s):', slow)

// 5. Check specific operation
const listRequests = logs.filter(log => log.operation === 'listApexEntities')
console.log('List requests:', listRequests)
```

## Automatic Logging

All GraphQL requests are automatically logged with:
- ✅ Request start time
- ✅ Operation name and variables
- ✅ Success/failure status
- ✅ Duration
- ✅ Item count returned

Logs appear in the console with prefixes:
- `[GraphQL Request]` - When request starts
- `[GraphQL Success]` - When request succeeds
- `[GraphQL Error]` - When request fails

## Tips

1. **Filter Console**: Use console filters to see only GraphQL logs by searching for `[GraphQL`
2. **Performance**: Check `avgDuration` to identify slow operations
3. **Errors**: Review failed requests to understand error patterns
4. **Operations**: Use operations breakdown to see which queries are used most

## Production

Logging is automatically disabled in production builds (`__DEV__ === false`). The logger only runs in development mode.



