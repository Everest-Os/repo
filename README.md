# EverestOS Online Repository

This repository serves as the official online App Center backend for EverestOS. It contains applications, applets, desklets, and extensions that users can install directly from within the operating system.

## Structure

- \`registry.json\`: The master index used by the App Center to discover available packages.
- \`apps/\`: Contains standalone user applications.
- \`plugins/applets/\`: Contains panel applets.
- \`plugins/desklets/\`: Contains desktop widgets.
- \`plugins/extensions/\`: Contains background system extensions.

## Submitting an App or Plugin

1. Create a new folder matching your App ID or Plugin UUID in the appropriate directory.
2. Add your source files (\`app.js\`, \`app.json\` for apps, or \`extension.js\`, \`metadata.json\` for plugins).
3. Push your changes to the \`main\` branch.

Our GitHub Actions CI/CD pipeline will automatically package your source files into a \`bundle.zip\` release that EverestOS can download!
