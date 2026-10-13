# LexiLedger 🧩

LexiLedger is a modern, feature-rich Scrabble score dashboard and game assistant. It replaces the traditional paper-and-pencil ledger with a digital interface that includes a real-time dictionary judge, game statistics, and a live tile bag reference.

![LexiLedger Hero](https://images.unsplash.com/photo-1591933596593-0c5393080004?auto=format&fit=crop&q=80&w=1000)

## ✨ Features

- **📊 Smart Ledger**: Effortlessly record turns, passes, and exchanges. Supports complex scoring like double/triple letters, word multipliers, and Bingos (50-point bonus).
- **📖 Dictionary Judge**: Real-time word verification against tournament lexicons and multiple online dictionary APIs (Free Dictionary API, Datamuse).
- **📈 Advanced Analytics**: Track your performance with a live leaderboard, average points per turn, bingo counts, and "Best Turn" highlights.
- **🎒 Tile Bag Reference**: See exactly which tiles are remaining in the bag based on the words played on the board.
- **🕒 Turn Timer**: Keep the game moving with an integrated turn timer and customizable player names.
- **💾 Auto-Persistence**: Games are automatically saved to your browser's local storage—never lose your score if the page refreshes.
- **📥 Data Export**: Export your entire game history to a CSV file for long-term tracking or analysis.
- **🔊 Tactile Feedback**: Custom-synthesized tabletop sound effects for a more immersive game experience.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or pnpm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/mitchleung/lexiledger.git
   cd lexiledger
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Start a New Game**: Set the number of players and their names in the "Setup" modal.
2. **Recording a Turn**: Enter the word played, select any letter multipliers (DL/TL), choose the word multiplier (DW/TW), and hit "Record".
3. **Dictionary Check**: Use the "Quick Check" tab or the live verification in the turn form to see if a word is valid and get its definition.
4. **History**: View the "History" tab to see a full log of turns, with the ability to undo or delete specific entries.
5. **Bag Reference**: Check the "Bag" tab during the game to strategize based on remaining tiles.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ for Scrabble enthusiasts.
