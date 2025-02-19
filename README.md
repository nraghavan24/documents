# Document Editor with AI Assistance

A modern document editor built with React that leverages AI to help with content creation and editing.

## Features

- Rich text editing with formatting support
- AI-powered content suggestions
- Document versioning and history
- Real-time auto-save
- Feedback system for AI suggestions
- Append or replace content options
- Modern, responsive UI

## Tech Stack

- React + Vite
- TipTap for rich text editing
- Supabase for backend and storage
- OpenAI for AI assistance
- Tailwind CSS for styling
- Zustand for state management

## Setup

1. Clone the repository:
```bash
git clone https://github.com/nraghavan24/documents.git
cd documents
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your API keys:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. Run the Supabase setup SQL (found in `setup.sql` and `setup_suggestions.sql`)

5. Start the development server:
```bash
npm run dev
```

## Usage

1. Create a new document or select an existing one
2. Use the formatting toolbar for basic text formatting
3. Access AI assistance through the assistant panel
4. Get AI suggestions based on your content
5. Choose to append or replace content with suggestions
6. Provide feedback on AI suggestions
7. Documents auto-save as you type

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
