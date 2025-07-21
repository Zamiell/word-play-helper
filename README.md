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
- Change the values in the "src/runConstants.ts" file to match your current run's modifiers. (You will have to restart the script every time you need to change these values.)
- Run the script: `bun run start`
- The program will run forever, scanning for changes to the "current-letters.txt" file. It will output possible words to the "output.txt" file in the "word-play-helper" directory. (You can cancel the script with Ctrl + C.)

### 5) Set Up a Hotkey (Optional)

You can use [AutoHotkey](https://www.autohotkey.com/) to set up a hotkey to run this script and/or automatically enter a word. For example:

```ahk
; ---------
; WORD PLAY
; ---------

#HotIf WinExist("ahk_exe Word Play.exe")
  ; Ctrl + 1
  ^1:: {
    WinActivate("ahk_exe Word Play.exe")
  }

  ; Ctrl + 2
  ^2:: {
    Run("bun run C:\Repositories\word-play-helper\src\main.ts", , "Hide")
    WinActivate("ahk_exe Code.exe")
  }

  ; Ctrl + 3
  ^3:: {
    Click(2) ; To highlight the word.
    Send("{Ctrl down}c{Ctrl up}")
    Sleep(25)
    WinActivate("ahk_exe Word Play.exe")
    WinWaitActive("ahk_exe Word Play.exe")
    Sleep(25)
    text := A_Clipboard
    Loop Parse, text {
      SendText(A_LoopField)
      Sleep(25)
    }
  }
#HotIf
```
