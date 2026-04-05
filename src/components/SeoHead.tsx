import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type SeoData = {
  title: string;
  description: string;
};

const DEFAULT_SEO: SeoData = {
  title: 'AST Visualizer | Interactive Ohm.js Grammar Tool',
  description:
    'Visualize and debug Ohm.js grammars with an interactive editor, dependency graph, and AST flow view.',
};

const ROUTE_SEO: Array<{ match: (path: string) => boolean; seo: SeoData }> = [
  {
    match: (path) => path === '/grammar/code' || path === '/grammar',
    seo: {
      title: 'Grammar Code Editor | AST Visualizer',
      description:
        'Write and edit Ohm.js grammar rules with live parsing feedback and fast iteration.',
    },
  },
  {
    match: (path) => path === '/grammar/dependencies',
    seo: {
      title: 'Grammar Dependencies | AST Visualizer',
      description:
        'Inspect how grammar rules depend on each other with a visual dependency view.',
    },
  },
  {
    match: (path) => path === '/grammar/suggestions',
    seo: {
      title: 'Grammar Suggestions | AST Visualizer',
      description:
        'Discover suggestions to improve grammar quality, consistency, and parser structure.',
    },
  },
  {
    match: (path) => path === '/visualize',
    seo: {
      title: 'AST Visualization | AST Visualizer',
      description:
        'Explore parser output and syntax trees with an interactive AST visualization interface.',
    },
  },
];

function getSeo(pathname: string): SeoData {
  return ROUTE_SEO.find((entry) => entry.match(pathname))?.seo ?? DEFAULT_SEO;
}

function setMeta(name: string, content: string) {
  const selector = `meta[name="${name}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setPropertyMeta(property: string, content: string) {
  const selector = `meta[property="${property}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(url: string) {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function SeoHead() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeo(location.pathname);
    const url = `${window.location.origin}${location.pathname}${location.search}`;

    document.title = seo.title;
    setMeta('description', seo.description);
    setMeta('twitter:title', seo.title);
    setMeta('twitter:description', seo.description);

    setPropertyMeta('og:title', seo.title);
    setPropertyMeta('og:description', seo.description);
    setPropertyMeta('og:url', url);

    setCanonical(url);
  }, [location.pathname, location.search]);

  return null;
}
