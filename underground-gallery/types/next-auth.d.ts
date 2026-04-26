// types/next-auth.d.ts
// Adds our custom fields to the NextAuth Session.user type.
// Without this, accessing `session.user.status` would be a TS error.

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      status: 'pending' | 'active' | 'rejected';
      isModerator: boolean;
      callsign: string | null;
    };
  }

  interface User {
    status?: 'pending' | 'active' | 'rejected';
    isModerator?: boolean;
    callsign?: string | null;
  }
}
