import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://www.teraplayer.in";
export const SITE_NAME = "TeraPlayer";
export const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  imageAlt,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  robots,
  children,
}) {
  const canonical = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalTwitterTitle = twitterTitle || finalOgTitle;
  const finalTwitterDescription = twitterDescription || finalOgDescription;
  const finalImageAlt = imageAlt || finalOgTitle;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {robots ? <meta name="robots" content={robots} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={finalImageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTwitterTitle} />
      <meta name="twitter:description" content={finalTwitterDescription} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={finalImageAlt} />
      {children}
    </Helmet>
  );
}

export default Seo;