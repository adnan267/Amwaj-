import { Link } from 'react-router-dom';
import { PageHeader } from '../components/Layout.jsx';
import { usePageMeta } from '../lib/site.jsx';

export default function NotFound() {
  usePageMeta('Page not found');
  return (
    <PageHeader title="This page is not here" text="The link may be old, or the page has moved. Start from the home page or browse our products.">
      <Link to="/" className="btn-primary">Go to the home page</Link>
      <Link to="/products" className="btn-ghost">Browse products</Link>
    </PageHeader>
  );
}
