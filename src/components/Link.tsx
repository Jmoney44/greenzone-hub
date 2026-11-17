import { Link as RouterLink } from "react-router";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; scroll?: boolean };

/** Link between pages of the site (same props as an <a>, with href). */
export default function Link({ href, scroll, ...rest }: Props) {
  return <RouterLink to={href} preventScrollReset={scroll === false} {...rest} />;
}
