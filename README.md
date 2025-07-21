# word-play-helper

`word-play-helper` is a [TypeScript](https://www.typescriptlang.org/) project that shows you the optimal word for your current board.

## How to Run

### 1) Install BepInEx

- Go to the [BepInExPack page for Word Play](https://thunderstore.io/c/word-play/p/BepInEx/BepInExPack/) and click on the "Manual Download" button. This will download a zip file.
- Extract the contents of the zip file to a new directory. This will contain 3 files and a subdirectory called "BepInExPack". Inside that subdirectory will be:
  - BepInEx (directory)
  - doorstop_config.ini
  - winhttp.dll
- Copy these 3 files/directories to your Word Play installation folder. (By default, this is "C:\Program Files (x86)\Steam\steamapps\common\Word Play".)
- Launch Word Play. Now, with BepInEx properly installed, you should have a separate console window that contains log output.

### 2) Clone the Repo

- `git clone git@github.com:Zamiell/word-play-helper.git`
- `cd word-play-helper`

### 3) Compile the Mod

- Install Visual Studio. (You need to be able to compile C# code.)
- Modify the `mods/LettersToTextFile/LettersToTextFile/LettersToTextFile.csproj` file to match the location of Word Play on your system. (There are 6 separate lines to edit.)
- Use Visual Studio to open the "LettersToTextFile.sln" file.
- Select "Build" from the top menu and then select "Build Solution".
- After building, you should have a "LettersToTextFile.dll" file in your plugins directory, which by default is at "C:\Program Files (x86)\Steam\steamapps\common\Word Play\BepInEx\plugins\LettersToTextFile.dll".
- Now, when you play Word Play, your letters will be written to the "C:\Program Files (x86)\Steam\steamapps\common\Word Play\current-letters.txt" file.

### 4) Run the Analyzer

- Install [Bun](https://bun.sh/).
- Change the values in the "src/runConstants.ts" file to match your current run's modifiers.
- `bun run start`
- Open "output.txt" in the text editor of your choice. (The output is also written to standard out.)

You need to re-run the program each time you want to analyze a board.
