import React from 'react';
import Sidebar from '../components/Sidebar';
import Account from './Account';
import History from './History';

export default function Dashboard({ role = 'user' }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role={role} />
      <div style={{ marginLeft: '1rem', padding: '1rem' }}>
        <h2>Dashboard</h2>
        <p>Welcome to your dashboard, {role}.</p>
        {role !== 'admin' && (
          <>
            <Account />
            <History />
          </>
        )}
      </div>
    </div>
  );
}
