/**
 * GraphQL Request Logger
 * Tracks all GraphQL requests for debugging and monitoring
 */

interface RequestLog {
    id: string;
    timestamp: string;
    operation: string;
    variables?: any;
    duration?: number;
    success: boolean;
    error?: string;
    itemCount?: number;
}

class RequestLogger {
    private logs: RequestLog[] = [];
    private enabled: boolean = __DEV__; // Only enabled in development
    private maxLogs: number = 100; // Keep last 100 requests

    /**
     * Enable or disable request logging
     */
    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * Log a GraphQL request
     */
    logRequest(operation: string, variables?: any): string {
        if (!this.enabled) return '';

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const log: RequestLog = {
            id,
            timestamp,
            operation,
            variables: this.sanitizeVariables(variables),
            success: false,
        };

        this.logs.push(log);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift(); // Remove oldest log
        }

        // Console output for immediate debugging
        console.log(`[GraphQL Request] ${operation}`, {
            id,
            timestamp,
            variables: this.sanitizeVariables(variables),
        });

        return id;
    }

    /**
     * Complete a request log with success
     */
    logSuccess(id: string, itemCount?: number, duration?: number) {
        if (!this.enabled || !id) return;

        const log = this.logs.find((l) => l.id === id);
        if (log) {
            log.success = true;
            log.itemCount = itemCount;
            log.duration = duration;
            console.log(`[GraphQL Success] ${log.operation}`, {
                id,
                duration: duration ? `${duration}ms` : 'N/A',
                itemCount: itemCount ?? 'N/A',
            });
        }
    }

    /**
     * Complete a request log with error
     */
    logError(id: string, error: any, duration?: number) {
        if (!this.enabled || !id) return;

        const log = this.logs.find((l) => l.id === id);
        if (log) {
            log.success = false;
            log.error = this.extractErrorMessage(error);
            log.duration = duration;
            console.error(`[GraphQL Error] ${log.operation}`, {
                id,
                error: log.error,
                errorDetails: this.extractErrorDetails(error),
                duration: duration ? `${duration}ms` : 'N/A',
            });
        }
    }

    /**
     * Extract a readable error message from various error formats
     */
    private extractErrorMessage(error: any): string {
        if (!error) return 'Unknown error';

        // If it's already a string, return it
        if (typeof error === 'string') return error;

        // Try to get message property
        if (error?.message) return error.message;

        // Try GraphQL errors array
        if (Array.isArray(error?.errors) && error.errors.length > 0) {
            return error.errors[0]?.message || String(error.errors[0]);
        }

        // Try errors property (single error)
        if (error?.errors?.[0]?.message) {
            return error.errors[0].message;
        }

        // Try to stringify the error object
        try {
            const stringified = JSON.stringify(error, null, 2);
            // If it's a reasonable size, return it
            if (stringified.length < 500) {
                return stringified;
            }
            // Otherwise return a summary
            return `${stringified.substring(0, 200)}... (truncated)`;
        } catch {
            // If JSON.stringify fails, try toString
            if (error?.toString && error.toString !== Object.prototype.toString) {
                return error.toString();
            }
        }

        // Last resort: return type and keys
        const errorType = error?.constructor?.name || typeof error;
        const keys = error && typeof error === 'object' ? Object.keys(error).join(', ') : '';
        return `Error (${errorType})${keys ? `: ${keys}` : ''}`;
    }

    /**
     * Extract detailed error information for logging
     */
    private extractErrorDetails(error: any): any {
        if (!error) return null;

        // If it's a simple string, return as is
        if (typeof error === 'string') return error;

        // Try to extract useful properties
        const details: any = {};

        if (error.message) details.message = error.message;
        if (error.code) details.code = error.code;
        if (error.statusCode) details.statusCode = error.statusCode;
        if (error.errors) details.errors = error.errors;
        if (error.path) details.path = error.path;
        if (error.extensions) details.extensions = error.extensions;

        // If we have GraphQL errors, include them
        if (Array.isArray(error.errors)) {
            details.graphqlErrors = error.errors.map((e: any) => ({
                message: e.message,
                path: e.path,
                extensions: e.extensions,
            }));
        }

        // Include error type
        details.type = error?.constructor?.name || typeof error;

        return Object.keys(details).length > 0 ? details : error;
    }

    /**
     * Get all logs
     */
    getLogs(): RequestLog[] {
        return [...this.logs];
    }

    /**
     * Get logs summary
     */
    getSummary() {
        const total = this.logs.length;
        const successful = this.logs.filter((l) => l.success).length;
        const failed = this.logs.filter((l) => !l.success).length;
        const avgDuration =
            this.logs
                .filter((l) => l.duration !== undefined)
                .reduce((sum, l) => sum + (l.duration || 0), 0) /
            this.logs.filter((l) => l.duration !== undefined).length;

        const operations = this.logs.reduce((acc, log) => {
            acc[log.operation] = (acc[log.operation] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? ((successful / total) * 100).toFixed(1) + '%' : '0%',
            avgDuration: avgDuration ? `${avgDuration.toFixed(0)}ms` : 'N/A',
            operations,
        };
    }

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
        console.log('[GraphQL Logger] Logs cleared');
    }

    /**
     * Print summary to console
     */
    printSummary() {
        const summary = this.getSummary();
        console.group('📊 GraphQL Request Summary');
        console.log(`Total Requests: ${summary.total}`);
        console.log(`Successful: ${summary.successful}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Success Rate: ${summary.successRate}`);
        console.log(`Avg Duration: ${summary.avgDuration}`);
        console.log('Operations:', summary.operations);
        console.groupEnd();
    }

    /**
     * Sanitize variables for logging (remove sensitive data, limit size)
     */
    private sanitizeVariables(variables: any): any {
        if (!variables) return undefined;

        const sanitized = { ...variables };
        const maxStringLength = 100;

        // Limit string lengths
        const limitStrings = (obj: any): any => {
            if (typeof obj === 'string' && obj.length > maxStringLength) {
                return obj.substring(0, maxStringLength) + '...';
            }
            if (Array.isArray(obj)) {
                return obj.map(limitStrings);
            }
            if (obj && typeof obj === 'object') {
                const limited: any = {};
                for (const key in obj) {
                    limited[key] = limitStrings(obj[key]);
                }
                return limited;
            }
            return obj;
        };

        return limitStrings(sanitized);
    }
}

// Export singleton instance
export const requestLogger = new RequestLogger();

// Make it available globally for debugging
if (__DEV__) {
    (global as any).graphqlLogger = requestLogger;
}



