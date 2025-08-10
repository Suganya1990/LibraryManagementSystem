import React from 'react';

export default function Sidebar({ role }) {
  const links = [{ text: 'View Books', path: '#' }];
  if (role === 'admin') {
    links.push({ text: 'Add Book', path: '#' });
    links.push({ text: 'Add User', path: '#' });
  } else {
    links.push({ text: 'Account', path: '#' });
    links.push({ text: 'History', path: '#' });
  }

  return (
    <div style={{ width: '200px', background: '#f0f0f0', padding: '1rem' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {links.map(link => (
          <li key={link.text} style={{ marginBottom: '0.5rem' }}>
            <a href={link.path}>{link.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
