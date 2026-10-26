/* St. John the Beloved test site · the page entry (site/boot.js): reads the parish data from the API first, then loads
   the site (main.jsx), because several screens prepare their lists from the data when they load. */
import { loadData } from './data.js';

loadData().then(() => { require('./main.jsx'); }).catch((e) => {
  const root = document.getElementById('root');
  root.textContent = 'St. John the Beloved: the parish data could not load. ' + e.message;
  console.error(e);
});
