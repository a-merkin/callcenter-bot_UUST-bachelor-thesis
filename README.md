# Telegram Bot

This is a Telegram bot that collects requests from students and applicants and sends them to a backend server for processing.

## Features

- Multi-language support (English and Russian)
- Step-by-step data collection
- Validation of full name format (including optional middle name)
- Sends collected data to a backend server via HTTP POST request

## Requirements

- Node.js
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/telegram-bot.git
   cd telegram-bot
   
2. Install dependencies:
   ```bash
   npm install

3. Edit .env and set your bot token and API URL.
4. Run bot:
   ```bash
   node --env-file=.env bot.js
