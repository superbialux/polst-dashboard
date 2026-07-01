import { type ComponentType } from "react";
import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_SEO_SLUG, type SeoVariantId } from "./shared";
import { SearchAnswerEditorial } from "./SearchAnswerEditorial";
import { SearchAnswerDashboard } from "./SearchAnswerDashboard";
import { SearchAnswerShowdown } from "./SearchAnswerShowdown";
import { SearchAnswerMinimal } from "./SearchAnswerMinimal";
import { SearchAnswerSocial } from "./SearchAnswerSocial";

const PAGES: Record<SeoVariantId, ComponentType> = {
  editorial: SearchAnswerEditorial,
  dashboard: SearchAnswerDashboard,
  showdown: SearchAnswerShowdown,
  minimal: SearchAnswerMinimal,
  social: SearchAnswerSocial,
};

/** `/seo/:variant/:slug` — render the chosen variation, or redirect to the
 *  first one when the variant segment is unknown. */
export function SeoVariationRoute() {
  const { variant } = useParams();
  const Page = variant && variant in PAGES ? PAGES[variant as SeoVariantId] : null;
  if (!Page) return <Navigate to={`/seo/editorial/${DEFAULT_SEO_SLUG}`} replace />;
  return <Page />;
}

export { SeoGallery } from "./SeoGallery";
