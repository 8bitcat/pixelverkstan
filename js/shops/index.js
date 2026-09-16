// Register över verksamheter. Lägg till nya här när de byggs.
import dator from './dator/index.js';

export const SHOPS = [
  { id: 'dator', icon: '🖥️', name: 'Datorbutiken', desc: 'Bygg datorer åt kunderna', module: dator },
  { id: 'restaurang', icon: '🍔', name: 'Hamburgerbaren', desc: 'Bygg burgare – kommer snart', module: null },
  { id: 'bilverkstad', icon: '🚗', name: 'Bilverkstaden', desc: 'Skruva ihop bilar – kommer snart', module: null },
];
