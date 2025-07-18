# word-play-helper

`word-play-helper` is a [TypeScript](https://www.typescriptlang.org/) project that shows you the optimal word for your current board.

## How to Run

- Install [Bun](https://bun.sh/).
- `git@github.com:Zamiell/word-play-helper.git`
- `cd word-play-helper`
- `vim src/runConstants.ts` (change the values to match your current run's modifiers)
- `bun run start`

Since the output of the program is usually very long, you will probably want to pipe the output `less` or a local file. You need to re-run the program each time you want to analyze a board.
