import Link from 'next/link';
import Head from 'next/head';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  // The last crumb names the current page, so it has no href.
  href?: string;
}

interface Props {
  crumbs: Crumb[];
}

const SITE_URL = 'https://a-450.com';

/**
 * Upward navigation for pages below the top level. The brand link in the
 * navbar always goes home, so without these the only visible way off a film
 * or cinema page was the brand, which dropped people on the site homepage.
 *
 * Hand-rolled rather than React Bootstrap's Breadcrumb: that component's
 * floated text divider and its own colour defaults needed more overrides to
 * undo than this markup takes to write.
 */
const Breadcrumbs = ({ crumbs }: Props) => {
  // Search engines want absolute URLs, and every crumb needs a position even
  // though the last one isn't a link.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol className="breadcrumbs-list">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li className="breadcrumbs-item" key={`${crumb.label}-${index}`}>
                {crumb.href && !isLast ? (
                  <Link className="breadcrumbs-link" href={crumb.href}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumbs-current" aria-current="page">
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight
                    className="breadcrumbs-separator"
                    size={14}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
