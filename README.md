# Udaan Sarathi - Recruitment Portal

A comprehensive agency-facing recruitment management portal built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd udaan-sarathi

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Tailwind CSS Setup

This project uses Tailwind CSS for styling. If you see "Unknown at rule" warnings in VS Code, follow these steps:

### Option 1: Install Tailwind CSS IntelliSense Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Tailwind CSS IntelliSense"
4. Install the extension by Brad Cornes

### Option 2: VS Code Settings (Already Configured)
The project includes `.vscode/settings.json` that disables CSS validation warnings for Tailwind directives.

### Option 3: Manual VS Code Configuration
Add this to your VS Code `settings.json`:
```json
{
  "css.validate": false,
  "less.validate": false, 
  "scss.validate": false,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns + date-fns-tz
- **Nepali Calendar**: nepali-date-converter

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ErrorBoundary.jsx
│   ├── Loading.jsx
│   ├── ToastProvider.jsx
│   ├── ConfirmProvider.jsx
│   ├── DateDisplay.jsx
│   ├── NepaliCalendar.jsx
│   ├── Layout.jsx
│   ├── InterviewScheduling.jsx
│   └── ScheduledInterviews.jsx
├── pages/              # Main application pages
│   ├── Dashboard.jsx
│   ├── Jobs.jsx
│   ├── JobDetails.jsx
│   ├── Applications.jsx
│   ├── Interviews.jsx
│   ├── Workflow.jsx
│   ├── Drafts.jsx
│   └── AgencySettings.jsx
├── services/           # API layer
│   └── api.js
├── hooks/              # React Query hooks
│   └── useApi.js
├── data/               # Mock data
│   └── mockData.js
├── utils/              # Utility functions
│   └── nepaliDate.js
└── index.css           # Global styles
```

## 🌟 Key Features

- **📊 Analytics Dashboard** - Real-time recruitment metrics
- **💼 Job Management** - Create, edit, and manage job postings
- **👥 Application Tracking** - Centralized candidate management
- **📅 Interview Scheduling** - Advanced scheduling with Nepali calendar
- **🔄 Workflow Management** - Post-interview pipeline
- **📝 Draft Management** - Save and manage job drafts
- **⚙️ Agency Settings** - Configure agency profile
- **🌐 Responsive Design** - Mobile-first approach
- **♿ Accessibility** - WCAG compliant
- **🗓️ Nepali Calendar** - Full BS calendar integration
- **⚡ Performance** - Optimized loading and caching

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (when configured)

### CSS Validation Warnings
The "Unknown at rule @tailwind" warnings are normal and don't affect functionality. They occur because:
1. VS Code doesn't recognize Tailwind CSS directives by default
2. The project is properly configured with PostCSS and Tailwind
3. The application builds and runs correctly

To eliminate these warnings, install the Tailwind CSS IntelliSense extension or use the provided VS Code settings.

## 🌍 Internationalization

The application supports both English and Nepali date formats with proper timezone handling for Asia/Kathmandu.

## 🔧 Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration  
- `vite.config.js` - Vite build configuration
- `.vscode/settings.json` - VS Code workspace settings
- `.vscode/extensions.json` - Recommended extensions

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.