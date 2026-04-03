> [!IMPORTANT]
> This project is discontinued since December 2025.

# SCP: Dystopia Add-on

A Minecraft Bedrock add-on for SCP Foundation-themed creations.

## Installation (for users)

### Standard

1. Download an archive file with the `.mcaddon` extension for the version you want.
2. Open your file explorer app and find the file you downloaded in step 1.
3. Open the file to install. You should see a prompt like "Open with Minecraft".
4. Add the installed pack(s) to your (new) world.
5. Done!

### Manually

1. Download an archive file with the `.zip` extension for the version you want.

   ⚠️ Zip file may not be available. In that case, download the file the `.mcaddon` extension and
   change its file extension to `.zip`.

2. Open your file explorer app and find the file you downloaded in step 1.
3. Extract the zip file.
4. Copy and paste the extracted pack folder(s) into appropriate locations.

   You need to know where the `com.mojang` folder is. It heavily depends on what platform
   your device is on.

   On Windows:

   ```
   C:\Users\%username%\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang
   ```

   > For other platforms, find other resources online.

   Behavior pack must be copied into either `behavior_packs` or `development_behavior_packs`.

   Resource pack must be copied into either `resource_packs` or `development_resource_packs`.

5. Add the installed pack(s) to your (new) world.
6. Done!

## Installation (for developers)

> [!IMPORTANT]
> Mobile platforms are not supported.

Cheatsheet for developers can be found [here](./CHEATSHEET.md).

### Prerequisites

Please install these software on your system before proceeding:

- [Git](https://git-scm.com/install/)
- [Node.js](https://nodejs.org/) (v22 or later)
- [pnpm](https://pnpm.io/installation)

### Setup

1.  Clone this repository (or your fork) locally

2.  Install dependencies

    Run the following command:

    ```
    pnpm install
    ```

3.  Create the `.env` file

    Create a new file named `.env` at top-level, and paste the text below to the file.
    Don't forget to replace `{USERNAME}` with your actual username!

    ```env
    # Default paths on Windows. You can specify any directory paths.
    DEV_BEHAVIOR_PACKS_DIR="C:\Users\{USERNAME}\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\development_behavior_packs"
    DEV_RESOURCE_PACKS_DIR="C:\Users\{USERNAME}\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs"
    ```

### Build

After a build operation is complete, you can find the output in the `build/` folder.

- Development build

  Processed packs will be copied into the locations you specified in `.env`.

  ```bash
  pnpm run build:dev
  ```

- Development build + watch

  Processed packs will be copied into the locations you specified in `.env`.

  The build script will keep watching for file changes in the background until terminated.
  When any file changes are detected, it will automatically rebuild.

  ```bash
  pnpm run build:dev:watch
  ```

- Non-development build

  Create a non-development build version _0.6.9_.

  ```bash
  pnpm dotenv -v VERSION=0.6.9 -- pnpm run build
  ```
