/* St. John the Beloved test site · Page not found (#/missing, and every address the site does not know): an ErrorPage
   (404) with the site chrome, drawn only through its public properties (its strings and the way home). ErrorPage takes no
   other content today (no children or suggestions): a Platform gap, reported for a proper fix. The visit is counted
   (AnalyticsProvider, useAnalytics: only the status number, no address or person), and the common pages are joined in the
   reader's language (useLocale). */
import { AnalyticsProvider, ErrorPage, useAnalytics, useLocale } from 'plenix-platform';
const { useEffect } = React;

const COMMON = ['Members', 'the Calendar', 'Donations and pledges'];

export function NotFoundScreen({ screen, chrome }) {
  return (
    <AnalyticsProvider enabled allowedProperties={['status']}>
      <NotFound screen={screen} chrome={chrome} />
    </AnalyticsProvider>
  );
}

function NotFound({ chrome }) {
  const track = useAnalytics();
  const { format } = useLocale();
  useEffect(() => { track('page_not_found', { status: 404 }); }, []);
  return (
    <ErrorPage {...chrome} error={404} homeHref="#/"
      strings={{ title: 'This page isn’t on the parish site', description: 'Check the address. The pages people look for most are ' + format.list(COMMON) + ', in the navigation.', home: 'Go to the dashboard' }} />
  );
}
