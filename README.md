# Socio-Copy University Fest Platform

A comprehensive platform for managing university fests and events, similar to "Book My Show" but specifically designed for college events.

## Features Implemented

### ✅ Core Functionality
- **Event Management**: Create, edit, and manage events and fests
- **User Authentication**: Secure login system with role-based access
- **Event Discovery**: Browse and search for events with filtering
- **Registration System**: Students can register for events

### ✅ New Features Added
- **Attendance Management**: Real-time attendance tracking for organizers
- **Notification System**: Event updates and reminders for users
- **Professional UI**: Enhanced user interface with consistent design

## User Types

### Students
- Browse and discover events
- Register for events (individual or team)
- Receive notifications about event updates
- View event details and schedules

### Organizers
- Create and manage events/fests
- Track registrations and participant data
- Mark attendance for participants
- Export attendance data as CSV
- Send notifications to participants

## Technical Stack

### Frontend
- **Next.js 15.3.1**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Responsive styling
- **React Hook Form**: Form management with validation

### Backend
- **Node.js + Express**: RESTful API server
- **Supabase**: Database and authentication
- **File Upload**: Support for images, banners, and PDFs

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   PORT=8000
   NODE_ENV=development
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Client Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables for client:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Key Features

### Attendance Management System
- **Real-time attendance tracking** with participant search and filtering
- **Attendance statistics** showing total, attended, absent, and pending counts
- **CSV export functionality** for attendance records
- **Status management** for each participant (registered/attended/absent)
- **Authorization checks** ensuring only event creators can manage attendance

### Notification System
- **Real-time notifications** with automatic polling every 30 seconds
- **Notification types** (info, success, warning, error) with appropriate icons
- **Bulk notification support** for event updates to all participants
- **Mark as read/unread functionality** with visual indicators
- **Event-specific notifications** with action URLs for direct navigation

### Professional UI/UX
- Consistent design with brand colors (#154CB3, #FFCC00)
- Responsive layout for mobile and desktop
- Loading states and error handling
- Intuitive navigation and user flows

## API Endpoints

### Core Endpoints
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/fests` - Get all fests
- `POST /api/fests` - Create new fest

### Attendance Management
- `GET /api/events/:eventId/participants` - Get event participants
- `POST /api/events/:eventId/attendance` - Mark attendance
- `GET /api/events/:eventId/attendance/stats` - Get attendance statistics

### Notification System
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification
- `POST /api/notifications/bulk` - Create bulk notifications
- `POST /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Usage Guide

### For Organizers
1. **Create Events**: Use "Create Event" to add new events
2. **Manage Registrations**: View participant lists from event cards
3. **Mark Attendance**: Use "Mark Attendance" link to track attendance
4. **Export Data**: Download attendance records as CSV
5. **Send Notifications**: Automatic notifications for event updates

### For Students
1. **Discover Events**: Browse events on the discovery page
2. **Register**: Click events to view details and register
3. **Get Notified**: Receive notifications about event updates
4. **Track Events**: View registered events in profile

## Professional Implementation

This platform has been professionally implemented with:
- ✅ **Full TypeScript support** with proper type definitions
- ✅ **Professional UI/UX** consistent with modern web standards
- ✅ **Comprehensive error handling** and loading states
- ✅ **Secure authentication** and authorization
- ✅ **Scalable architecture** with modular components
- ✅ **Production-ready code** with proper build configuration

## Contributing

1. Follow existing code structure and patterns
2. Ensure TypeScript types are properly defined
3. Test all features before submitting
4. Follow established UI/UX guidelines
5. Document any new features or API endpoints