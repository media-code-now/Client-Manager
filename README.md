# Client Manager CRM

A modern, comprehensive Customer Relationship Management (CRM) system built with Next.js 14, React 18, and TypeScript. Features a beautiful glassmorphism design system with full dark/light mode support.

## 🚀 Features

### 📊 Dashboard
- **Quick Actions**: Add new clients and tasks directly from the dashboard
- **Statistics Overview**: Total clients, open tasks, overdue tasks, and stored credentials
- **Recent Activity**: Track recent client interactions and task updates
- **Responsive Design**: Optimized for desktop and mobile devices

### 👥 Client Management
- **Client Profiles**: Comprehensive client information with status tracking
- **Client Detail View**: Dedicated pages for each client with tabs for overview, tasks, and credentials
- **Status Management**: Active, On Hold, and Archived client statuses
- **Tagging System**: Organize clients with custom tags (VIP, Legal, Finance, etc.)
- **Search & Filter**: Advanced search and filtering capabilities

### ✅ Task Management
- **Task Overview**: Centralized view of all tasks across clients
- **Priority Levels**: High, Medium, and Low priority tasks
- **Due Date Tracking**: Calendar integration with overdue indicators
- **Status Workflow**: Open → In Progress → Done
- **Advanced Filtering**: Filter by status, priority, client, and due date
- **Task Reminders**: Configurable reminder system

### 🔐 Credential Management
- **Secure Storage**: Store client credentials with masked values
- **URL Integration**: Link credentials to relevant websites
- **Client Association**: Organize credentials by client
- **Add/Edit Interface**: Easy credential management with forms

### ⚙️ Comprehensive Settings
- **Profile & Account**: User profile management, password changes, 2FA
- **Appearance**: Theme selection, color schemes, view density, accessibility options
- **Notifications**: Email, push, task reminders, client activity alerts, quiet hours
- **Security & Privacy**: Advanced security settings (coming soon)
- **Business Settings**: Company-specific configurations (coming soon)

## 🎨 Design System

### Glassmorphism UI
- **Backdrop Blur Effects**: Modern translucent design throughout
- **Smooth Animations**: iOS-inspired motion and transitions
- **Dark/Light Mode**: Complete theme system with system preference detection
- **Color Schemes**: Multiple accent color options (Blue, Purple, Green, Orange, Pink)
- **Responsive Layout**: Mobile-first design with desktop enhancements

### Accessibility
- **High Contrast Mode**: Enhanced visibility option
- **Reduced Motion**: Respect user preferences for animations
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: Latest React with hooks and concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS framework
- **Heroicons**: Beautiful SVG icons

### Backend (Coming Soon)
- **Node.js + Express**: RESTful API server
- **PostgreSQL**: Reliable database with proper indexing
- **JWT Authentication**: Secure authentication with refresh tokens
- **bcrypt**: Password hashing and security

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/client-manager.git
   cd client-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Navigation
- **Dashboard**: Overview of all CRM activities
- **Clients**: Manage client profiles and information
- **Tasks**: Track and manage tasks across all clients
- **Settings**: Configure your account and application preferences

### Quick Actions
- Use the **+ Add New Client** and **+ Add New Task** buttons on the dashboard for quick access
- Navigate between sections using the sidebar (desktop) or bottom navigation (mobile)
- Switch between light and dark themes using the theme toggle in the header

### Client Management
1. Add new clients with company information and tags
2. View detailed client profiles with associated tasks and credentials
3. Update client status and manage their information
4. Store secure credentials for each client

### Task Management
1. Create tasks and assign them to specific clients
2. Set priorities and due dates with calendar integration
3. Track task progress through different status stages
4. Use filters to find specific tasks quickly

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (when backend is implemented)

### Customization
- **Themes**: Modify color schemes in the Appearance settings
- **Notifications**: Configure email and push notification preferences
- **Layout**: Choose between compact, comfortable, or spacious view density

## 🌟 Roadmap

### Phase 1 (Current)
- ✅ Frontend CRM interface
- ✅ Client and task management
- ✅ Settings and preferences
- ✅ Responsive design

### Phase 2 (Coming Soon)
- 🔄 Backend API integration
- 🔄 Database persistence
- 🔄 User authentication
- 🔄 Real-time notifications

### Phase 3 (Future)
- 📅 Calendar integration
- 📧 Email automation
- 📊 Analytics and reporting
- 🔗 Third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Noam Sadi**
- Email: noam@nsmprime.com
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Heroicons](https://heroicons.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Inspired by modern design systems and iOS interface guidelines