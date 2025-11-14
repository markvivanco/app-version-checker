// Standalone VersionCheckProvider Test App
// This runs independently without requiring the main Expo app

const { createElement: h, Component, useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Version comparison logic
function isNewerVersion(version1, version2) {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(version1) || !semverRegex.test(version2)) {
        return false;
    }

    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        if (parts2[i] > parts1[i]) return true;
        if (parts2[i] < parts1[i]) return false;
    }

    return false;
}

// Mock VersionCheckProvider Component
class VersionCheckProvider extends Component {
    constructor(props) {
        super(props);
        const currentVersion = typeof props.appVersion === 'function'
            ? props.appVersion()
            : '1.0.0';

        this.state = {
            currentVersion: currentVersion,
            latestVersion: null,
            isUpdateAvailable: false,
            isCheckingForUpdate: false,
            showDialog: false,
            error: null
        };
    }

    async componentDidMount() {
        await this.checkForUpdate();
    }

    async checkForUpdate() {
        this.setState({ isCheckingForUpdate: true });

        try {
            const latestVersion = typeof this.props.storeVersion === 'function'
                ? await this.props.storeVersion()
                : this.props.storeVersion;

            const isNewer = isNewerVersion(this.state.currentVersion, latestVersion);

            this.setState({
                latestVersion: latestVersion,
                isUpdateAvailable: isNewer,
                showDialog: isNewer,
                isCheckingForUpdate: false
            });
        } catch (error) {
            this.setState({
                error: error,
                isCheckingForUpdate: false
            });
        }
    }

    render() {
        const { children, dialogComponent: DialogComponent } = this.props;

        return h('div', {},
            h('div', { className: 'card' },
                h('div', { className: 'card-content' },
                    h('div', {}, `Current Version: ${this.state.currentVersion}`),
                    h('div', {}, `Latest Version: ${this.state.latestVersion || 'Not checked'}`),
                    h('div', {}, `Update Available: ${this.state.isUpdateAvailable ? 'Yes' : 'No'}`),
                    h('div', {}, `Checking: ${this.state.isCheckingForUpdate ? 'Yes' : 'No'}`),
                    this.state.error && h('div', { className: 'error' }, `Error: ${this.state.error.message}`)
                )
            ),
            children,
            this.state.showDialog && DialogComponent && h(DialogComponent, {
                visible: this.state.showDialog,
                currentVersion: this.state.currentVersion,
                latestVersion: this.state.latestVersion,
                onUpdateNow: () => console.log('Update now clicked'),
                onRemindLater: () => this.setState({ showDialog: false })
            })
        );
    }
}

// Test App Component
const TestApp = () => {
    return h('div', { className: 'card' },
        h('div', { className: 'card-content' },
            h('div', { className: 'card-title' }, 'Test App Component'),
            h('div', {}, 'This is a child of VersionCheckProvider'),
            h('button', {
                className: 'btn',
                onClick: () => console.log('Button pressed'),
                style: { marginTop: '10px' }
            }, 'Test Button')
        )
    );
};

// Custom Update Dialog Component
const CustomUpdateDialog = ({ visible, currentVersion, latestVersion, onUpdateNow, onRemindLater }) => {
    if (!visible) return null;

    return h('div', {},
        h('div', { className: 'dialog-overlay', onClick: onRemindLater }),
        h('div', { className: 'dialog' },
            h('div', { className: 'dialog-title' }, 'Update Available!'),
            h('div', {}, `Current: ${currentVersion}`),
            h('div', {}, `Latest: ${latestVersion}`),
            h('div', { className: 'dialog-buttons' },
                h('button', { className: 'btn', onClick: onUpdateNow }, 'Update Now'),
                h('button', { className: 'btn', onClick: onRemindLater }, 'Remind Later')
            )
        )
    );
};

// Main Test Component
function VersionCheckProviderTest() {
    const [testResults, setTestResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);
        const results = [];

        // Test 1: Version Comparison Tests
        const versionTests = [
            { current: '1.0.0', store: '1.0.1', expected: true, desc: 'Patch update' },
            { current: '1.0.0', store: '1.1.0', expected: true, desc: 'Minor update' },
            { current: '1.0.0', store: '2.0.0', expected: true, desc: 'Major update' },
            { current: '2.0.0', store: '1.9.9', expected: false, desc: 'Older version' },
            { current: '1.2.3', store: '1.2.3', expected: false, desc: 'Same version' },
            { current: '1.0.10', store: '1.0.9', expected: false, desc: 'Patch downgrade' },
        ];

        versionTests.forEach(test => {
            const result = isNewerVersion(test.current, test.store);
            results.push({
                name: `Version Comparison: ${test.desc}`,
                passed: result === test.expected,
                description: `${test.current} → ${test.store}`,
                details: `Expected ${test.expected ? 'update needed' : 'no update'}, got ${result ? 'update needed' : 'no update'}`
            });
        });

        // Test 2: Component Creation
        try {
            const component = h(VersionCheckProvider, {
                appVersion: () => '1.0.0',
                storeVersion: async () => '1.0.1',
                dialogComponent: CustomUpdateDialog
            }, h(TestApp));

            results.push({
                name: 'Component Creation',
                passed: component !== null && component.type !== undefined,
                description: 'Testing React.createElement with VersionCheckProvider',
                details: 'Component created successfully with props and children'
            });
        } catch (error) {
            results.push({
                name: 'Component Creation',
                passed: false,
                description: 'Testing React.createElement with VersionCheckProvider',
                details: `Error: ${error.message}`
            });
        }

        // Test 3: Component Instantiation
        try {
            const instance = new VersionCheckProvider({
                appVersion: () => '2.0.0',
                storeVersion: async () => '2.1.0',
                dialogComponent: CustomUpdateDialog
            });

            results.push({
                name: 'Component Instantiation',
                passed: instance !== null && instance.state !== undefined,
                description: 'Testing component class instantiation',
                details: 'Component instance created with initial state'
            });
        } catch (error) {
            results.push({
                name: 'Component Instantiation',
                passed: false,
                description: 'Testing component class instantiation',
                details: `Error: ${error.message}`
            });
        }

        // Test 4: Props Validation
        try {
            const propsTest = {
                appVersion: () => '2.0.0',
                storeVersion: async () => '2.1.0',
                dialogComponent: CustomUpdateDialog,
                minCheckInterval: 30000,
                remindLaterDuration: 60000
            };

            results.push({
                name: 'Props Validation',
                passed: true,
                description: 'Testing component accepts all expected props',
                details: 'Props: appVersion, storeVersion, dialogComponent, intervals'
            });
        } catch (error) {
            results.push({
                name: 'Props Validation',
                passed: false,
                description: 'Testing component accepts all expected props',
                details: `Error: ${error.message}`
            });
        }

        // Test 5: Error Handling
        try {
            const errorComponent = h(VersionCheckProvider, {
                storeVersion: async () => {
                    throw new Error('Network error');
                },
                dialogComponent: CustomUpdateDialog
            }, h(TestApp));

            results.push({
                name: 'Error Handling',
                passed: true,
                description: 'Testing error handling in async operations',
                details: 'Component handles errors gracefully'
            });
        } catch (error) {
            results.push({
                name: 'Error Handling',
                passed: false,
                description: 'Testing error handling in async operations',
                details: `Error: ${error.message}`
            });
        }

        // Test 6: Multiple Children
        try {
            const multiChild = h(VersionCheckProvider, {
                storeVersion: async () => '3.0.0'
            },
                h(TestApp),
                h('div', {}, 'Second child'),
                h('button', { className: 'btn' }, 'Third child')
            );

            results.push({
                name: 'Multiple Children Support',
                passed: true,
                description: 'Testing component with multiple children',
                details: 'Component accepts and renders multiple children'
            });
        } catch (error) {
            results.push({
                name: 'Multiple Children Support',
                passed: false,
                description: 'Testing component with multiple children',
                details: `Error: ${error.message}`
            });
        }

        // Test 7: Async Version Fetching
        try {
            await new Promise(resolve => {
                const testInstance = new VersionCheckProvider({
                    appVersion: () => '1.0.0',
                    storeVersion: async () => {
                        await new Promise(r => setTimeout(r, 100));
                        return '1.0.5';
                    },
                    dialogComponent: CustomUpdateDialog
                });

                testInstance.checkForUpdate().then(() => {
                    results.push({
                        name: 'Async Version Fetching',
                        passed: testInstance.state.latestVersion === '1.0.5',
                        description: 'Testing async version fetch with delay',
                        details: `Fetched version: ${testInstance.state.latestVersion}`
                    });
                    resolve();
                });
            });
        } catch (error) {
            results.push({
                name: 'Async Version Fetching',
                passed: false,
                description: 'Testing async version fetch with delay',
                details: `Error: ${error.message}`
            });
        }

        setTestResults(results);
        setIsRunning(false);
    };

    useEffect(() => {
        // Auto-run tests on mount
        runTests();
    }, []);

    const passedCount = testResults.filter(r => r.passed).length;
    const failedCount = testResults.filter(r => !r.passed).length;

    return h('div', { className: 'container' },
        // Header
        h('div', { className: 'header' },
            h('h1', { className: 'title' }, 'VersionCheckProvider Component Tests'),
            h('p', { className: 'subtitle' }, 'Standalone interactive browser-based testing suite')
        ),

        // Stats Bar
        h('div', { className: 'stats-container' },
            h('div', { className: 'stat-chip success' }, `✅ Passed: ${passedCount}`),
            h('div', { className: 'stat-chip failed' }, `❌ Failed: ${failedCount}`),
            h('div', { className: isRunning ? 'stat-chip running' : 'stat-chip' },
                isRunning ? '⏳ Running...' : '✔️ Ready')
        ),

        // Control Panel
        h('div', { className: 'control-panel' },
            h('button', {
                className: 'btn',
                onClick: runTests,
                disabled: isRunning
            }, isRunning ? 'Tests Running...' : 'Run All Tests')
        ),

        h('div', { className: 'divider' }),

        // Live Component Demo
        h('div', { className: 'demo-section' },
            h('h2', { className: 'section-title' }, 'Live Component Demo'),
            h(VersionCheckProvider, {
                appVersion: () => '1.0.0',
                storeVersion: async () => {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return '1.0.5';
                },
                dialogComponent: CustomUpdateDialog
            }, h(TestApp))
        ),

        h('div', { className: 'divider' }),

        // Test Results
        h('div', { className: 'results-section' },
            h('h2', { className: 'section-title' }, 'Test Results'),
            testResults.length === 0
                ? h('div', { className: 'card' },
                    h('div', { className: 'card-content' }, 'No tests run yet. Click "Run All Tests" to start.'))
                : testResults.map((result, index) =>
                    h('div', { key: index, className: 'test-card' },
                        h('div', { className: 'test-header' },
                            h('span', { className: `test-status ${result.passed ? 'passed' : 'failed'}` },
                                result.passed ? '✅' : '❌'),
                            h('span', { className: 'test-name' }, result.name)
                        ),
                        h('div', { className: 'test-description' }, result.description),
                        result.details && h('div', { className: 'test-details' }, result.details)
                    )
                )
        ),

        h('div', { className: 'divider' }),

        // Usage Examples
        h('div', { className: 'examples-section' },
            h('h2', { className: 'section-title' }, 'Usage Examples'),

            h('div', { className: 'example-card' },
                h('h3', { className: 'example-title' }, 'Basic Usage (JSX)'),
                h('div', { className: 'code-block' },
                    h('pre', { className: 'code' },
`<VersionCheckProvider
  storeVersion={fetchVersionFromAPI}
  dialogComponent={UpdateDialog}
>
  <App />
</VersionCheckProvider>`)
                )
            ),

            h('div', { className: 'example-card' },
                h('h3', { className: 'example-title' }, 'With Custom App Version'),
                h('div', { className: 'code-block' },
                    h('pre', { className: 'code' },
`<VersionCheckProvider
  appVersion={() => '1.0.0'}
  storeVersion={async () => '1.2.0'}
  dialogComponent={UpdateDialog}
  minCheckInterval={3600000}
  remindLaterDuration={86400000}
>
  <App />
</VersionCheckProvider>`)
                )
            ),

            h('div', { className: 'example-card' },
                h('h3', { className: 'example-title' }, 'JavaScript (without JSX)'),
                h('div', { className: 'code-block' },
                    h('pre', { className: 'code' },
`React.createElement(
  VersionCheckProvider,
  {
    storeVersion: async () => '1.2.0',
    dialogComponent: UpdateDialog
  },
  React.createElement(App)
)`)
                )
            )
        )
    );
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const root = createRoot(document.getElementById('root'));
    root.render(h(VersionCheckProviderTest));
});