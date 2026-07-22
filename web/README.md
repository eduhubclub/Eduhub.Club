# Edu.Hub (web)

Modular React + Vite + Tailwind shell.

## Structure

```
src/
  App.jsx                 # ClassProvider → AppShell
  shell/                  # shared chrome
  nav/                    # accordion / panel / popout (opt-in per app)
  apps/
    hub/config.js
    classes/              # teacher foundation app
  data/classes/           # shared roster store (all apps read from here)
  shared/
```

## Shared student data

`ClassProvider` holds classes + students. Any app can:

```js
const { selectedClass, getStudentNamesFor, getStudentsFor } = useClasses();
getStudentNamesFor(); // names only (Randomizer, Groups, …)
getStudentsFor();     // full student objects
```

## Run

```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs-portable\node-v24.18.0-win-x64;$env:Path"
cd web
npm run dev
```
