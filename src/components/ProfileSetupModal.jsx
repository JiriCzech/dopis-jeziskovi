import React from 'react';
import { ProfilePage } from '../pages/ProfilePage';

export function ProfileSetupModal() {
  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:py-12">
      <ProfilePage isSetup />
    </div>
  );
}
