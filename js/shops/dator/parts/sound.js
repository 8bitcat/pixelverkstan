// Ljudkort 1987–2026 – riktiga produkter, svenska butikspriser det året.
import { SEK_PER_USD } from './canon.js';

const kr = (usd, y) => Math.max(50, Math.round((usd * SEK_PER_USD[y] * 1.25) / 10) * 10);
const slug = (s) => s.toLowerCase().replace(/\+/g, '-plus').replace(/[!²]/g, '').replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');

const PCB = { green: '#2c7a45', dkgreen: '#23603a', blue: '#1f3f8f', black: '#1b1c1f', red: '#8e2a2a', purple: '#4a2f6b' };
const S = [];
// namn, tillverkare, år, sista år, buss, USD, segment, kort-färg, accent, rgb
function s(name, brand, year, until, bus, usd, tier, pcb, accent, rgb = false) {
  const style = bus === 'PCI' ? 'pci' : bus === 'PCIe' ? 'pcie' : 'isa';
  S.push({ id: 'sound-' + slug(name), cat: 'sound', name, brand, year, until, cost: kr(usd, year), tier, rgb, bus, look: { style, pcb, accent } });
}

// ---------- ISA 8-bit: FM-syntes och de första Sound Blaster ----------
s('AdLib Music Synthesizer Card', 'AdLib', 1987, 1991, 'ISA8', 195, 3, PCB.green, '#c0c6cc');
s('Creative Music System (C/MS)', 'Creative', 1987, 1989, 'ISA8', 199, 3, PCB.green, '#c0c6cc');
s('Creative Game Blaster', 'Creative', 1988, 1990, 'ISA8', 129, 2, PCB.green, '#e8c030');
s('Roland LAPC-I', 'Roland', 1989, 1993, 'ISA8', 595, 5, PCB.green, '#c9323a');
s('Creative Sound Blaster 1.0 (CT1320A)', 'Creative', 1989, 1991, 'ISA8', 239, 3, PCB.green, '#e8c030');
s('Creative Sound Blaster 1.5 (CT1320C)', 'Creative', 1990, 1992, 'ISA8', 199, 3, PCB.green, '#e8c030');
s('Roland SCC-1 Sound Canvas', 'Roland', 1990, 1994, 'ISA8', 449, 5, PCB.green, '#c9323a');
s('Creative Sound Blaster 2.0 (CT1350B)', 'Creative', 1991, 1994, 'ISA8', 169, 2, PCB.green, '#e8c030');
s('Creative Sound Blaster Pro (CT1330)', 'Creative', 1991, 1993, 'ISA8', 299, 4, PCB.green, '#e8c030');
s('Media Vision Pro AudioSpectrum', 'Media Vision', 1991, 1993, 'ISA8', 389, 4, PCB.green, '#3a8fd8');
s('Media Vision Thunderboard', 'Media Vision', 1991, 1994, 'ISA8', 169, 2, PCB.green, '#3a8fd8');
s('Creative Sound Blaster Pro 2 (CT1600)', 'Creative', 1992, 1995, 'ISA8', 249, 3, PCB.green, '#e8c030');

// ---------- ISA 16-bit ----------
s('AdLib Gold 1000', 'AdLib', 1992, 1993, 'ISA16', 299, 4, PCB.green, '#c0c6cc');
s('Creative Sound Blaster 16 (CT1740)', 'Creative', 1992, 1995, 'ISA16', 349, 4, PCB.green, '#e8c030');
s('Media Vision Pro AudioSpectrum Plus', 'Media Vision', 1992, 1994, 'ISA16', 249, 3, PCB.green, '#3a8fd8');
s('Media Vision Pro AudioSpectrum 16', 'Media Vision', 1992, 1995, 'ISA16', 299, 4, PCB.green, '#3a8fd8');
s('Gravis UltraSound', 'Advanced Gravis', 1992, 1995, 'ISA16', 199, 4, PCB.green, '#c9323a');
s('Turtle Beach MultiSound', 'Turtle Beach', 1992, 1995, 'ISA16', 599, 5, PCB.green, '#2a8f6a');
s('Creative Sound Blaster 16 MCD (CT1750)', 'Creative', 1993, 1995, 'ISA16', 249, 3, PCB.green, '#e8c030');
s('Creative Sound Blaster 16 SCSI-2 (CT1770)', 'Creative', 1993, 1995, 'ISA16', 299, 4, PCB.green, '#e8c030');
s('Gravis UltraSound MAX', 'Advanced Gravis', 1993, 1996, 'ISA16', 249, 4, PCB.green, '#c9323a');
s('Aztech Sound Galaxy NX Pro 16', 'Aztech', 1993, 1996, 'ISA16', 99, 2, PCB.green, '#c0c6cc');
s('Creative Sound Blaster 16 Value Edition (CT2770)', 'Creative', 1994, 1997, 'ISA16', 99, 2, PCB.green, '#e8c030');
s('Creative Sound Blaster AWE32 (CT2760)', 'Creative', 1994, 1997, 'ISA16', 399, 5, PCB.green, '#e8c030');
s('Gravis UltraSound ACE', 'Advanced Gravis', 1994, 1996, 'ISA16', 149, 3, PCB.green, '#c9323a');
s('Ensoniq Soundscape S-2000', 'Ensoniq', 1994, 1997, 'ISA16', 249, 4, PCB.green, '#3a6fd8');
s('Roland RAP-10', 'Roland', 1994, 1997, 'ISA16', 349, 5, PCB.green, '#c9323a');
s('Orchid SoundWave 32', 'Orchid', 1994, 1996, 'ISA16', 199, 3, PCB.green, '#c0c6cc');
s('Creative Sound Blaster 32 (CT3600)', 'Creative', 1995, 1998, 'ISA16', 149, 3, PCB.green, '#e8c030');
s('Gravis UltraSound PnP', 'Advanced Gravis', 1995, 1998, 'ISA16', 199, 4, PCB.green, '#c9323a');
s('Ensoniq Soundscape Elite', 'Ensoniq', 1995, 1997, 'ISA16', 299, 5, PCB.green, '#3a6fd8');
s('Turtle Beach Tropez', 'Turtle Beach', 1995, 1997, 'ISA16', 249, 4, PCB.green, '#2a8f6a');
s('Turtle Beach Monterey', 'Turtle Beach', 1995, 1997, 'ISA16', 179, 3, PCB.green, '#2a8f6a');
s('Creative Sound Blaster AWE64 Value (CT4520)', 'Creative', 1996, 1999, 'ISA16', 129, 3, PCB.green, '#e8c030');
s('Creative Sound Blaster AWE64 (CT4500)', 'Creative', 1996, 1999, 'ISA16', 199, 4, PCB.green, '#e8c030');
s('Creative Sound Blaster AWE64 Gold (CT4390)', 'Creative', 1996, 1999, 'ISA16', 249, 5, PCB.green, '#d8b24a');
s('Creative Sound Blaster Vibra 16C (CT2800)', 'Creative', 1996, 1999, 'ISA16', 59, 1, PCB.green, '#e8c030');
s('Ensoniq Soundscape VIVO90', 'Ensoniq', 1996, 1998, 'ISA16', 149, 3, PCB.green, '#3a6fd8');
s('Turtle Beach Tropez Plus', 'Turtle Beach', 1996, 1998, 'ISA16', 299, 5, PCB.green, '#2a8f6a');
s('ESS AudioDrive ES1868', 'ESS', 1996, 1999, 'ISA16', 39, 1, PCB.green, '#c0c6cc');
s('TerraTec Maestro 32/96', 'TerraTec', 1997, 1999, 'ISA16', 199, 4, PCB.dkgreen, '#c0c6cc');

// ---------- PCI ----------
s('Ensoniq AudioPCI (ES1370)', 'Ensoniq', 1997, 1999, 'PCI', 99, 2, PCB.green, '#3a6fd8');
s('Creative Sound Blaster PCI64', 'Creative', 1998, 2000, 'PCI', 79, 2, PCB.green, '#e8c030');
s('Creative Sound Blaster PCI128', 'Creative', 1998, 2000, 'PCI', 99, 2, PCB.green, '#e8c030');
s('Diamond Monster Sound MX200', 'Diamond', 1998, 1999, 'PCI', 99, 3, PCB.green, '#c0c6cc');
s('Diamond Monster Sound MX300', 'Diamond', 1998, 2000, 'PCI', 129, 4, PCB.green, '#c0c6cc');
s('Aureal Vortex SQ2500', 'Aureal', 1998, 2000, 'PCI', 149, 4, PCB.green, '#3a8fd8');
s('Turtle Beach Montego II', 'Turtle Beach', 1998, 2000, 'PCI', 99, 3, PCB.green, '#2a8f6a');
s('Creative Sound Blaster Live! (CT4620)', 'Creative', 1998, 2001, 'PCI', 199, 4, PCB.green, '#e8c030');
s('Creative Sound Blaster Live! Value (CT4670)', 'Creative', 1998, 2002, 'PCI', 99, 3, PCB.green, '#e8c030');
s('Creative Sound Blaster 16 PCI', 'Creative', 1999, 2001, 'PCI', 49, 1, PCB.green, '#e8c030');
s('Creative Sound Blaster PCI512', 'Creative', 1999, 2001, 'PCI', 79, 3, PCB.green, '#e8c030');
s('Creative Sound Blaster Live! Platinum', 'Creative', 1999, 2001, 'PCI', 199, 5, PCB.green, '#d8b24a');
s('Turtle Beach Santa Cruz', 'Turtle Beach', 1999, 2003, 'PCI', 99, 3, PCB.green, '#2a8f6a');
s('Creative Sound Blaster Live! 5.1 (SB0100)', 'Creative', 2000, 2004, 'PCI', 79, 3, PCB.green, '#e8c030');
s('Hercules Fortissimo II', 'Hercules', 2000, 2002, 'PCI', 59, 2, PCB.blue, '#c9a227');
s('M-Audio Audiophile 2496', 'M-Audio', 2000, 2012, 'PCI', 149, 4, PCB.green, '#c0c6cc');
s('Philips Acoustic Edge', 'Philips', 2000, 2003, 'PCI', 79, 3, PCB.green, '#3a6fd8');
s('Creative Sound Blaster Audigy (SB0090)', 'Creative', 2001, 2004, 'PCI', 99, 4, PCB.green, '#c0c6cc');
s('Creative Sound Blaster Audigy Platinum eX', 'Creative', 2001, 2003, 'PCI', 249, 5, PCB.green, '#d8b24a');
s('Hercules Game Theater XP', 'Hercules', 2001, 2003, 'PCI', 149, 4, PCB.blue, '#c9a227');
s('TerraTec DMX 6fire 24/96', 'TerraTec', 2001, 2005, 'PCI', 199, 5, PCB.dkgreen, '#c0c6cc');
s('Creative Sound Blaster Live! 5.1 Digital (SB0220)', 'Creative', 2002, 2006, 'PCI', 49, 2, PCB.green, '#e8c030');
s('Creative Sound Blaster Audigy 2 (SB0240)', 'Creative', 2002, 2005, 'PCI', 99, 4, PCB.green, '#c0c6cc');
s('M-Audio Revolution 7.1', 'M-Audio', 2002, 2006, 'PCI', 99, 4, PCB.green, '#c0c6cc');
s('Creative Sound Blaster Audigy 2 ZS (SB0350)', 'Creative', 2003, 2007, 'PCI', 99, 4, PCB.black, '#c0c6cc');
s('Creative Sound Blaster Audigy 2 ZS Platinum Pro', 'Creative', 2003, 2006, 'PCI', 249, 5, PCB.black, '#d8b24a');
s('M-Audio Revolution 5.1', 'M-Audio', 2003, 2006, 'PCI', 79, 3, PCB.green, '#c0c6cc');
s('TerraTec Aureon 7.1 Space', 'TerraTec', 2003, 2007, 'PCI', 99, 4, PCB.dkgreen, '#c0c6cc');
s('Creative Sound Blaster Live! 24-bit (SB0410)', 'Creative', 2004, 2008, 'PCI', 39, 1, PCB.green, '#e8c030');
s('Creative Sound Blaster Audigy 2 Value (SB0400)', 'Creative', 2004, 2008, 'PCI', 69, 3, PCB.black, '#c0c6cc');
s('Creative Sound Blaster Audigy 4 Pro', 'Creative', 2004, 2007, 'PCI', 249, 5, PCB.black, '#d8b24a');
s('Chaintech AV-710', 'Chaintech', 2004, 2008, 'PCI', 29, 1, PCB.green, '#c0c6cc');
s('Creative Sound Blaster Audigy SE (SB0570)', 'Creative', 2005, 2011, 'PCI', 39, 1, PCB.black, '#c0c6cc');
s('Creative Sound Blaster X-Fi XtremeMusic (SB0460)', 'Creative', 2005, 2009, 'PCI', 129, 4, PCB.black, '#c0c6cc');
s('Creative Sound Blaster X-Fi Platinum', 'Creative', 2005, 2008, 'PCI', 199, 5, PCB.black, '#d8b24a');
s('Creative Sound Blaster X-Fi Fatal1ty FPS', 'Creative', 2005, 2008, 'PCI', 279, 5, PCB.black, '#c9323a');
s('Creative Sound Blaster X-Fi Elite Pro', 'Creative', 2005, 2008, 'PCI', 399, 5, PCB.black, '#d8b24a');
s('Creative Sound Blaster X-Fi XtremeGamer (SB0730)', 'Creative', 2006, 2011, 'PCI', 99, 4, PCB.black, '#c0c6cc');
s('Creative Sound Blaster X-Fi XtremeGamer Fatal1ty Professional', 'Creative', 2006, 2010, 'PCI', 199, 5, PCB.black, '#c9323a');
s('Creative Sound Blaster X-Fi Xtreme Audio', 'Creative', 2007, 2011, 'PCI', 49, 2, PCB.black, '#c0c6cc');
s('ASUS Xonar D2', 'ASUS', 2007, 2012, 'PCI', 179, 5, PCB.black, '#c9323a');
s('Auzentech X-Meridian 7.1', 'Auzentech', 2007, 2010, 'PCI', 179, 5, PCB.black, '#3a8fd8');
s('Auzentech X-Fi Prelude 7.1', 'Auzentech', 2007, 2010, 'PCI', 199, 5, PCB.black, '#3a8fd8');
s('ASUS Xonar DS', 'ASUS', 2008, 2014, 'PCI', 59, 2, PCB.blue, '#c0c6cc');
s('HT Omega Striker 7.1', 'HT Omega', 2008, 2014, 'PCI', 69, 3, PCB.black, '#c9323a');
s('HT Omega Claro Plus', 'HT Omega', 2008, 2014, 'PCI', 129, 4, PCB.black, '#c9323a');
s('ASUS Xonar DG', 'ASUS', 2009, 2016, 'PCI', 39, 1, PCB.blue, '#c0c6cc');
s('ASUS Xonar Essence ST', 'ASUS', 2009, 2015, 'PCI', 199, 5, PCB.black, '#c0c6cc');
s('HT Omega Claro Halo', 'HT Omega', 2009, 2014, 'PCI', 179, 5, PCB.black, '#c9323a');

// ---------- PCI Express ----------
s('ASUS Xonar D2X', 'ASUS', 2007, 2012, 'PCIe', 199, 5, PCB.black, '#c9323a');
s('Creative Sound Blaster X-Fi Xtreme Audio PCIe', 'Creative', 2007, 2012, 'PCIe', 59, 2, PCB.black, '#c0c6cc');
s('ASUS Xonar DX', 'ASUS', 2008, 2016, 'PCIe', 89, 3, PCB.blue, '#c0c6cc');
s('ASUS Xonar Essence STX', 'ASUS', 2008, 2016, 'PCIe', 199, 5, PCB.black, '#c0c6cc');
s('Creative Sound Blaster X-Fi Titanium (SB0880)', 'Creative', 2008, 2013, 'PCIe', 99, 4, PCB.black, '#c0c6cc');
s('Creative Sound Blaster X-Fi Titanium Fatal1ty Professional', 'Creative', 2008, 2012, 'PCIe', 199, 5, PCB.black, '#c9323a');
s('ASUS Xonar Phoebus', 'ASUS', 2010, 2014, 'PCIe', 179, 4, PCB.black, '#c9323a');
s('Creative Sound Blaster X-Fi Titanium HD', 'Creative', 2010, 2015, 'PCIe', 179, 5, PCB.black, '#c0c6cc');
s('ASUS Xonar DGX', 'ASUS', 2011, 2020, 'PCIe', 39, 1, PCB.blue, '#c0c6cc');
s('ASUS Xonar DSX', 'ASUS', 2011, 2018, 'PCIe', 69, 2, PCB.blue, '#c0c6cc');
s('Creative Sound Blaster Recon3D PCIe', 'Creative', 2011, 2014, 'PCIe', 99, 3, PCB.black, '#c9323a');
s('Creative Sound Blaster Recon3D Fatal1ty Professional', 'Creative', 2011, 2014, 'PCIe', 149, 4, PCB.black, '#c9323a');
s('Creative Sound Blaster Z', 'Creative', 2012, 2019, 'PCIe', 99, 3, PCB.black, '#c9323a');
s('Creative Sound Blaster Zx', 'Creative', 2012, 2018, 'PCIe', 149, 4, PCB.black, '#c9323a');
s('HT Omega eClaro', 'HT Omega', 2012, 2019, 'PCIe', 199, 5, PCB.black, '#c9323a');
s('Creative Sound Blaster ZxR', 'Creative', 2013, 2020, 'PCIe', 249, 5, PCB.black, '#c9323a');
s('Creative Sound Blaster Audigy Rx', 'Creative', 2013, 2022, 'PCIe', 79, 2, PCB.black, '#c0c6cc');
s('Creative Sound Blaster Audigy Fx', 'Creative', 2013, 2022, 'PCIe', 49, 1, PCB.black, '#c0c6cc');
s('ASUS Xonar Essence STX II', 'ASUS', 2014, 2022, 'PCIe', 249, 5, PCB.black, '#c0c6cc');
s('ASUS ROG Strix Soar', 'ASUS', 2016, 2021, 'PCIe', 99, 3, PCB.black, '#e07a2e');
s('ASUS ROG Strix Raid DLX', 'ASUS', 2016, 2021, 'PCIe', 199, 5, PCB.black, '#c9323a');
s('ASUS Xonar AE', 'ASUS', 2017, 2024, 'PCIe', 59, 2, PCB.black, '#c0c6cc');
s('Creative Sound Blaster AE-5', 'Creative', 2018, 2020, 'PCIe', 149, 4, PCB.black, '#c9323a', true);
s('Creative Sound Blaster AE-7', 'Creative', 2019, 2026, 'PCIe', 199, 5, PCB.black, '#c0c6cc');
s('Creative Sound Blaster AE-9', 'Creative', 2019, 2026, 'PCIe', 349, 5, PCB.black, '#d8b24a');
s('Creative Sound Blaster Z SE', 'Creative', 2019, 2026, 'PCIe', 99, 3, PCB.black, '#c9323a');
s('ASUS Xonar SE', 'ASUS', 2019, 2026, 'PCIe', 49, 1, PCB.black, '#c0c6cc');
s('EVGA NU Audio Card', 'EVGA', 2019, 2022, 'PCIe', 249, 5, PCB.black, '#9aa4ae', true);
s('Creative Sound Blaster AE-5 Plus', 'Creative', 2020, 2026, 'PCIe', 159, 4, PCB.black, '#c9323a', true);
s('Creative Sound Blaster Audigy Fx V2', 'Creative', 2022, 2026, 'PCIe', 69, 2, PCB.black, '#c0c6cc');

export default S;
