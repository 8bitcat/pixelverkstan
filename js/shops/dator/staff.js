// Kurser för datorbutikens personal (core/staff.js sköter logiken). Priser i grundårets kronor,
// räknas upp med prisindex. time = sekunder borta från jobbet.
export const COURSES = [
  { id: 'dos', name: 'MS-DOS, BIOS och jumprar', stat: 'bygg', cost: 1200, time: 40, year: 1983, desc: 'Grunderna: sätta ihop en PC utan att något ryker.' },
  { id: 'lod', name: 'Lödkurs på Komvux', stat: 'service', cost: 1500, time: 45, year: 1983, desc: 'Byta kondensatorer utan att bränna kortet.' },
  { id: 'salj1', name: 'Säljkurs: "Har du tänkt på grafikkortet?"', stat: 'salj', cost: 2000, time: 40, year: 1983, desc: 'Merförsäljning med ett leende.' },
  { id: 'novell', name: 'Novell CNE', stat: 'service', cost: 6000, time: 60, year: 1990, desc: 'Nätverk och felsökning på riktigt.' },
  { id: 'aplus', name: 'CompTIA A+', stat: 'bygg', cost: 3500, time: 50, year: 1993, desc: 'Certifikatet varenda tekniker vill ha.' },
  { id: 'salj2', name: 'Kundpsykologi', stat: 'salj', cost: 4000, time: 50, year: 1995, desc: 'Läsa av vem som vill ha det bästa – och vem som vill ha det billigaste.' },
  { id: 'mcse', name: 'Microsoft MCSE', stat: 'service', cost: 8000, time: 60, year: 1998, desc: 'Windows-servrar och registerpyssel.' },
  { id: 'cisco', name: 'Cisco CCNA', stat: 'service', cost: 9000, time: 60, year: 2000, desc: 'Routrar, switchar och kabelskåp.' },
  { id: 'vatten', name: 'Vattenkylning och kabeldragning', stat: 'bygg', cost: 5000, time: 50, year: 2008, desc: 'Snyggt, tyst och läckagefritt.' },
  { id: 'salj3', name: 'Sociala medier för butiker', stat: 'salj', cost: 3000, time: 40, year: 2010, desc: 'Bilder på byggen som folk delar.' },
];
