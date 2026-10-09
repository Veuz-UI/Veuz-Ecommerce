import { ProductsCatalogView } from '@/components/catalog/ProductsCatalogView';

export default function ProductsPage() {
  // The base /products route is the complete catalog. Query filters narrow it when requested.
  return <ProductsCatalogView pageMode="category" />;
}
