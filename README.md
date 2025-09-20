# Salt.Box Frontend Core

Frontend microfrontend for the Salt.Box core functionality.

## Development Setup

### Local Package Linking

For development with local changes to `@saltbox/saltbox-frontend-common`, you can link the package directly instead of using the published version:

1. **Configure the local path**:
   ```bash
   cp example.env .env
   # Edit .env and set: COMMON_REPO_PATH=../saltbox-frontend-common
   ```

2. **Link the package** (required for build system to detect type changes):
   ```bash
   # In the common package directory
   cd ../saltbox-frontend-common
   yarn link

   # Back in the core package directory
   cd ../saltbox-frontend-core
   yarn link @saltbox/saltbox-frontend-common
   ```

3. **Start development server**:
   ```bash
   yarn start
   ```

The development webpack configuration will automatically:
- Resolve `@saltbox/saltbox-frontend-common` imports to your local repository
- Handle CSS from the linked package
- Ensure React singleton compatibility

### Unlinking

To stop using the local package and return to the published version:

1. **Unlink the package**:
   ```bash
   # In the core package directory
   yarn unlink @saltbox/saltbox-frontend-common

   # In the common package directory (optional)
   cd ../saltbox-frontend-common
   yarn unlink
   ```

2. **Reinstall the published package**:
   ```bash
   # Back in the core package directory
   cd ../saltbox-frontend-core
   yarn --force
   ```

3. **Remove the environment variable**:
   ```bash
   # Remove COMMON_REPO_PATH from .env, set it to empty, or just comment the line like:
   #COMMON_REPO_PATH=../saltbox-frontend-common
   ```

4. **Restart the development server**:
   ```bash
   yarn start
   ```

The webpack configuration will automatically use the published package from `node_modules`.

### Without Local Linking

If you don't need to modify the common package, simply:
```bash
yarn start
```

The package will use the published version from npm.

## Used API's (Swagger OpenAPI links)

Core: http://localhost/api/core/docs
