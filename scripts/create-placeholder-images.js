#!/usr/bin/env node

/**
 * Creates placeholder room images using ImageMagick or Canvas
 * Run this script if you don't have room images yet
 */

const fs = require('fs');
const path = require('path');

const roomsDir = path.join(__dirname, '../public/assets/rooms');

// Ensure directory exists
if (!fs.existsSync(roomsDir)) {
  fs.mkdirSync(roomsDir, { recursive: true });
}

const rooms = [
  { name: 'zen-room', color: '#f5f5dc', label: 'Japanese Zen Room' },
  { name: 'brutalist-cube', color: '#4a4a4a', label: 'Brutalist Concrete Cube' },
  { name: 'neon-corridor', color: '#1a0033', label: 'Neon Corridor' },
  { name: 'scifi-room', color: '#ffffff', label: 'White Sci-Fi Room' },
];

console.log('Creating placeholder room images...');
console.log('Note: These are simple colored placeholders. Replace with actual room images for best results.\n');

// Create simple SVG placeholders
rooms.forEach((room) => {
  const svgPath = path.join(roomsDir, `${room.name}.svg`);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1920" height="1080" fill="${room.color}"/>
  <text x="960" y="540" font-family="Arial" font-size="48" fill="${room.color === '#ffffff' ? '#000' : '#fff'}" text-anchor="middle" dominant-baseline="middle">${room.label}</text>
</svg>`;
  
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Created ${room.name}.svg`);
});

console.log('\nPlaceholder images created!');
console.log('To convert SVG to JPG, you can use ImageMagick:');
console.log('  convert zen-room.svg zen-room.jpg');
console.log('\nOr replace these with your own room images.');

